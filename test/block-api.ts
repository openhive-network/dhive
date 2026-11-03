import "mocha";
import assert = require("assert");
import * as http from "http";
import { AddressInfo } from "net";

import { BlockApiOperation, Client, NaiAsset } from "./../src";

// Recorded from api.hive.blog. get_block is block 89,999,991 trimmed to three of its transactions.
const fixtures = require("./block-api-fixtures.json");

interface RpcRequest {
  method: string;
  params: any;
}

interface LocalNode {
  url: string;
  requests: RpcRequest[];
  close: () => Promise<void>;
}

async function startNode(result: any): Promise<LocalNode> {
  const requests: RpcRequest[] = [];
  const server = http.createServer((req, res) => {
    let body = "";
    req.on("data", (chunk) => { body += chunk; });
    req.on("end", () => {
      const request = JSON.parse(body);
      requests.push({ method: request.method, params: request.params });
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ id: request.id, jsonrpc: "2.0", result }));
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

describe("block_api helper", function() {
  this.slow(500);
  this.timeout(10 * 1000);

  let node: LocalNode;
  const clientFor = async (result: any) => {
    node = await startNode(result);
    return new Client(node.url);
  };

  afterEach(async function() {
    await node.close();
  });

  it("getBlock should unwrap the block_api block", async function() {
    const client = await clientFor(fixtures.get_block);
    const block = await client.block.getBlock(89999991);
    assert.deepEqual(node.requests, [{ method: "block_api.get_block", params: { block_num: 89999991 } }]);
    assert.deepEqual(block, fixtures.get_block.block);
    assert.equal(block.block_id, "055d4a77a15fab4d3d8fa337a388f638f8c1f9d3");
    assert.equal(block.transaction_ids.length, block.transactions.length);
    assert.equal((block.transactions[0] as any).transaction_id, undefined);

    const op: BlockApiOperation = block.transactions[1].operations[0];
    assert.equal(op.type, "transfer_operation");
    if (op.type === "transfer_operation") {
      const amount: NaiAsset = op.value.amount;
      assert.deepEqual(amount, { nai: "@@000000013", amount: "14000", precision: 3 });
      assert.equal(op.value.to, "zing.sale");
    }
  });

  it("getBlock should return null for a missing block", async function() {
    const client = await clientFor(fixtures.missing);
    assert.strictEqual(await client.block.getBlock(999999999), null);
    assert.deepEqual(node.requests, [{ method: "block_api.get_block", params: { block_num: 999999999 } }]);
  });

  it("getBlockHeader should unwrap the block_api header", async function() {
    const client = await clientFor(fixtures.get_block_header);
    const header = await client.block.getBlockHeader(89999991);
    assert.deepEqual(node.requests, [{ method: "block_api.get_block_header", params: { block_num: 89999991 } }]);
    assert.deepEqual(header, fixtures.get_block_header.header);
    assert.equal(header.witness, "guiltyparties");
  });

  it("getBlockHeader should return null for a missing block", async function() {
    const client = await clientFor(fixtures.missing);
    assert.strictEqual(await client.block.getBlockHeader(999999999), null);
    assert.deepEqual(node.requests, [
      { method: "block_api.get_block_header", params: { block_num: 999999999 } },
    ]);
  });

  it("getBlockRange should return the blocks", async function() {
    const client = await clientFor(fixtures.get_block_range);
    const blocks = await client.block.getBlockRange(1, 2);
    assert.deepEqual(node.requests, [
      { method: "block_api.get_block_range", params: { starting_block_num: 1, count: 2 } },
    ]);
    assert.deepEqual(blocks, fixtures.get_block_range.blocks);
    assert.deepEqual(blocks.map((block) => block.block_id), [
      "0000000109833ce528d5bbfb3f6225b39ee10086",
      "00000002ed04e3c3def0238f693931ee7eebbdf1",
    ]);
  });

  it("database.getBlock should keep calling condenser_api", async function() {
    const block = { block_id: "055d4a77a15fab4d3d8fa337a388f638f8c1f9d3", transactions: [] };
    const client = await clientFor(block);
    assert.deepEqual(await client.database.getBlock(89999991), block);
    await client.database.getBlockHeader(89999991);
    assert.deepEqual(node.requests, [
      { method: "condenser_api.get_block", params: [89999991] },
      { method: "condenser_api.get_block_header", params: [89999991] },
    ]);
  });
});
