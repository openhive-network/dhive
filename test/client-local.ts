import "mocha";
import assert = require("assert");
import * as http from "http";
import { AddressInfo } from "net";

import { Client, VERSION } from "./../src";

const MIRRORNET_CHAIN_ID = "4200000000000000000000000000000000000000000000000000000000000000";

interface LocalNode {
  url: string;
  requests: http.IncomingHttpHeaders[];
  close: () => Promise<void>;
}

// Answers each request with the next status in `statuses`, then with 200 and a valid JSON-RPC result,
// or with the JSON-RPC `error` when one is given.
async function startNode(statuses: number[] = [], error?: object): Promise<LocalNode> {
  const requests: http.IncomingHttpHeaders[] = [];
  const server = http.createServer((req, res) => {
    req.resume();
    req.on("end", () => {
      requests.push(req.headers);
      const status = statuses.shift() || 200;
      if (status !== 200) {
        res.writeHead(status, { "Retry-After": "60" });
        res.end();
        return;
      }
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(error ? { id: 0, jsonrpc: "2.0", error } : { id: 0, jsonrpc: "2.0", result: "ok" }));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}`,
    requests,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}

describe("client (local nodes)", function() {
  this.slow(500);
  this.timeout(10 * 1000);

  let nodes: LocalNode[] = [];
  const start = async (statuses?: number[], error?: object) => {
    const node = await startNode(statuses, error);
    nodes.push(node);
    return node;
  };

  afterEach(async function() {
    await Promise.all(nodes.map((node) => node.close()));
    nodes = [];
  });

  it("should send a User-Agent header under node", async function() {
    const node = await start();
    const client = new Client(node.url);
    assert.equal(await client.call("condenser_api", "get_config"), "ok");
    assert.equal(node.requests[0]["user-agent"], `dhive/${VERSION}`);
    assert.equal(node.requests[0]["content-type"], "application/json");
  });

  it("should not set a User-Agent header where self is defined", async function() {
    const node = await start();
    const client = new Client(node.url);
    (global as any).self = global;
    try {
      await client.call("condenser_api", "get_config");
    } finally {
      delete (global as any).self;
    }
    assert.notEqual(node.requests[0]["user-agent"], `dhive/${VERSION}`);
  });

  for (const status of [429, 503]) {
    it(`should record one failure for an HTTP ${status} answer`, async function() {
      const failing = await start([status]);
      const healthy = await start();
      const client = new Client([failing.url, healthy.url]);
      assert.equal(await client.call("condenser_api", "get_config"), "ok");
      assert.equal(failing.requests.length, 1);
      assert.equal(healthy.requests.length, 1);
      const state = client.healthTracker.getHealthSnapshot().get(failing.url);
      assert.equal(state.consecutiveFailures, 1);
      const apiFailures = status === 503 ? { condenser_api: { count: 1 } } : {};
      assert.deepEqual(state.apiFailures, apiFailures);
    });
  }

  it("should start from the current node while it is healthy", async function() {
    const first = await start();
    const second = await start();
    const client = new Client([first.url, second.url]);
    client.currentAddress = second.url;
    await client.call("condenser_api", "get_config");
    assert.equal(first.requests.length, 0);
    assert.equal(second.requests.length, 1);
    assert.equal(client.currentAddress, second.url);
  });

  it("should start from the healthiest node when the current node is unhealthy", async function() {
    const first = await start();
    const second = await start();
    const client = new Client([first.url, second.url]);
    client.currentAddress = second.url;
    client.healthTracker.isNodeHealthy = (node: string) => node !== second.url;
    client.healthTracker.getOrderedNodes = () => [first.url, second.url];
    await client.call("condenser_api", "get_config");
    assert.equal(first.requests.length, 1);
    assert.equal(second.requests.length, 0);
    assert.equal(client.currentAddress, first.url);
  });
  const callError = async (error: object): Promise<any> => {
    const node = await start([], error);
    const client = new Client(node.url);
    try {
      await client.call("condenser_api", "get_content", ["kaboom", "boomboomboom"]);
    } catch (thrown) {
      return thrown;
    }
    assert.fail("expected an RPCError");
  };

  it("should keep the node's explanation of a hivemind assert", async function() {
    const data = {
      code: 10,
      name: "assert_exception",
      message: "Assert Exception",
      extension: { assertion_expression: "Post kaboom/boomboomboom does not exist" },
      stack: [{
        context: { level: "error", file: "hivemind", line: 0, method: "get_content" },
        data: { category: "hivemind" },
        format: "",
      }],
    };
    const thrown = await callError({ code: -32602, message: "Assert Exception", data });
    assert.equal(thrown.name, "RPCError");
    assert.equal(thrown.message, "Assert Exception: Post kaboom/boomboomboom does not exist");
    assert.deepEqual(thrown.jse_info, data);
  });

  it("should format a hived assert from its stack format", async function() {
    const data = {
      code: 10,
      name: "assert_exception",
      message: "Assert Exception",
      stack: [{
        context: { level: "error", file: "database.cpp", line: 3150, method: "validate_transaction" },
        data: { what: "missing required posting authority", account: "foo", missing: ["foo"] },
        format: "${what}: Missing Posting Authority ${account}",
      }],
    };
    const thrown = await callError({ code: -32000, message: "Assert Exception", data });
    assert.equal(thrown.name, "RPCError");
    assert.equal(thrown.message, 'missing required posting authority: Missing Posting Authority foo missing=["foo"]');
    assert.deepEqual(thrown.jse_info, data);
  });

  it("should use the error message when the error has no data", async function() {
    const thrown = await callError({ code: -32601, message: "Could not find method get_content" });
    assert.equal(thrown.name, "RPCError");
    assert.equal(thrown.message, "Could not find method get_content");
  });
});

describe("client network presets", function() {
  it("should configure mirrornet", function() {
    const agent = {};
    const client = Client.mirrornet({ agent, timeout: 1234 });
    assert.equal(client.address, "https://api.fake.openhive.network");
    assert.equal(client.addressPrefix, "STM");
    assert.equal(client.chainId.toString("hex"), MIRRORNET_CHAIN_ID);
    assert.equal(client.options.timeout, 1234);
    assert.strictEqual(client.options.agent, agent);
  });

  it("should return mirrornet from the deprecated testnet and warn once", function() {
    const warn = console.warn;
    const warnings: any[] = [];
    console.warn = (...args: any[]) => { warnings.push(args); };
    let clients: Client[];
    try {
      clients = [Client.testnet(), Client.testnet()];
    } finally {
      console.warn = warn;
    }
    assert.equal(warnings.length, 1);
    assert(String(warnings[0][0]).includes("Client.mirrornet()"));
    for (const client of clients) {
      assert.equal(client.address, "https://api.fake.openhive.network");
      assert.equal(client.addressPrefix, "STM");
      assert.equal(client.chainId.toString("hex"), MIRRORNET_CHAIN_ID);
    }
  });
});
