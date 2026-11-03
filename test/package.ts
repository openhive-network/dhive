import "mocha";
import * as assert from "assert";
import { execFileSync } from "child_process";
import * as esbuild from "esbuild";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

// Imports the built package (lib/, lib/esm/ and the committed dist/) the way a
// consumer does, through package.json's exports; `make lib` must have run.
const root = path.resolve(__dirname, "..");

const clientApp = `import { Client } from "@hiveio/dhive"
export const client = new Client("https://api.hive.blog")
`;

describe("package", function() {
  this.timeout(60 * 1000);

  let consumerDir: string;
  before(function() {
    for (const built of ["lib/index-node.js", "lib/esm/index.js", "lib/esm/version.js"]) {
      assert.ok(fs.existsSync(path.join(root, built)), `${built} is missing: run make lib`);
    }
    consumerDir = fs.mkdtempSync(path.join(os.tmpdir(), "dhive-consumer-"));
    fs.mkdirSync(path.join(consumerDir, "node_modules", "@hiveio"), { recursive: true });
    fs.symlinkSync(root, path.join(consumerDir, "node_modules", "@hiveio", "dhive"), "dir");
  });
  after(function() {
    fs.rmSync(consumerDir, { recursive: true, force: true });
  });

  const runNode = (args: string[]) =>
    execFileSync(process.execPath, args, { cwd: consumerDir, encoding: "utf8" });

  it("exposes the same API to require and import under Node", function() {
    const script = `
      import * as esm from "@hiveio/dhive"
      import { createRequire } from "module"
      const cjs = createRequire(import.meta.url)("@hiveio/dhive")
      const names = o => Object.keys(o).filter(k => !["default", "module.exports", "__esModule"].includes(k)).sort()
      console.log(JSON.stringify({
        esm: names(esm), cjs: names(cjs),
        sameClient: esm.Client === cjs.Client
      }))
    `;
    const result = JSON.parse(runNode(["--input-type=module", "-e", script]));
    assert.ok(result.cjs.includes("Client"));
    assert.ok(result.cjs.includes("PrivateKey"));
    assert.deepEqual(result.esm, result.cjs);
    assert.equal(result.sameClient, true);
  });

  it("keeps deep requires into lib/ and dist/ resolvable", function() {
    const out = runNode(["-p", `[
      require("@hiveio/dhive/lib/crypto").PrivateKey.name,
      require("@hiveio/dhive/lib/crypto.js").PrivateKey.name,
      require("@hiveio/dhive/package.json").name,
      require.resolve("@hiveio/dhive/dist/dhive.js")
    ].join(" ")`]);
    assert.equal(out.trim(), `PrivateKey PrivateKey @hiveio/dhive ${path.join(root, "dist", "dhive.js")}`);
  });

  const bundleClientApp = async (options: esbuild.BuildOptions) => {
    const result = await esbuild.build({
      bundle: true,
      format: "esm",
      logLevel: "silent",
      metafile: true,
      minify: true,
      stdin: { contents: clientApp, resolveDir: consumerDir },
      write: false,
      ...options
    });
    const [output] = Object.values(result.metafile!.outputs);
    const dhiveFiles = Object.keys(output.inputs)
      .filter(input => input !== "<stdin>")
      .map(input => path.relative(root, fs.realpathSync(path.resolve(input))))
      .filter(file => !file.startsWith("node_modules") && !file.startsWith(".."));
    return { bytes: result.outputFiles![0].contents.length, dhiveFiles };
  };

  it("lets an ESM bundler tree-shake an app that imports only Client", async function() {
    // cross-fetch is only the fallback when there is no global fetch; it is left
    // out so the sizes measure dhive and the dependencies it really needs.
    const external = ["cross-fetch"];
    const esm = await bundleClientApp({ external, platform: "node" });
    const cjs = await bundleClientApp({
      alias: { "@hiveio/dhive": path.join(root, "lib", "index-node.js") },
      external,
      platform: "node"
    });
    console.log(`      { Client } app, esbuild --minify: ESM ${esm.bytes} bytes, CommonJS ${cjs.bytes} bytes`);

    assert.ok(esm.dhiveFiles.includes(path.join("lib", "esm", "client.js")), esm.dhiveFiles.join());
    assert.ok(!esm.dhiveFiles.some(file => !file.startsWith(path.join("lib", "esm"))), esm.dhiveFiles.join());
    assert.ok(!esm.dhiveFiles.includes(path.join("lib", "esm", "memo.js")), "memo.js was not tree-shaken");
    assert.ok(cjs.dhiveFiles.includes(path.join("lib", "memo.js")));
    assert.ok(esm.bytes < cjs.bytes, `ESM ${esm.bytes} bytes is not smaller than CommonJS ${cjs.bytes} bytes`);
  });

  it("gives browser bundlers the prebuilt dist/dhive.js", async function() {
    const browser = await bundleClientApp({ platform: "browser" });
    assert.deepEqual(browser.dhiveFiles, [path.join("dist", "dhive.js")]);
  });
});
