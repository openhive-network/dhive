import * as fs from "fs";
import * as https from "https";
import { randomBytes } from "crypto";
import fetch from "cross-fetch";
import { Client, PrivateKey } from './../src'

export const NUM_TEST_ACCOUNTS = 2;
export const IS_BROWSER = global["isBrowser"] === true;
export const TEST_NODE =
  process.env["TEST_NODE"] || "https://api.hive.blog";

export const agent = IS_BROWSER
  ? undefined
  : new https.Agent({ keepAlive: true });

let testAccounts

async function readFile(filename: string) {
  return new Promise<Buffer>((resolve, reject) => {
    fs.readFile(filename, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
}

async function writeFile(filename: string, data: Buffer) {
  return new Promise<void>((resolve, reject) => {
    fs.writeFile(filename, data, error => {
      if (error) {
        reject(error);
      } else {
        resolve();
      }
    });
  });
}

export function randomString(length: number) {
  return randomBytes(length * 2)
    .toString("base64")
    .replace(/[^0-9a-z]+/gi, "")
    .slice(0, length)
    .toLowerCase();
}

export async function createAccount(): Promise<{
  username: string;
  password: string;
}> {
  const password = randomString(32);
  const username = `dhive-${randomString(9)}`;

  // Create testnet account and delegate to it
  const client = Client.testnet({ agent });
  const ops = {
    creator: 'initminer',
    username,
    password
  }
  const key = PrivateKey.from('5JNHfZYKGaomSFvd4NUdQ9qMcEAC43kujbfjueTHpVapX1Kzq2n')
  await client.broadcast.createTestAccount(ops, key)
  await client.broadcast.sendOperations([[
    'transfer_to_vesting',
    {
      amount: '100000.000 TESTS',
      from: 'initminer',
      to: username
    }
  ]], key)
  await client.broadcast.transfer({
    from: 'initminer',
    to: username,
    amount: '1000.000 TESTS',
    memo: 'test acc'
  }, key)
  await client.broadcast.transfer({
    from: 'initminer',
    to: username,
    amount: '1000.000 TBD',
    memo: 'test acc'
  }, key)
  // TESTNET URL NEEDED
  // const response = await fetch("https://hive-test-beeabode.roelandp.nl", {
  //   method: "POST",
  //   body: `username=${username}&password=${password}`,
  //   headers: { "Content-Type": "application/x-www-form-urlencoded" }
  // });
  // const text = await response.text();
  // if (response.status !== 200) {
  //   throw new Error(`Unable to create user: ${text}`);
  // }
  return { username, password };
}

export async function getTestnetAccounts(): Promise<
  { username: string; password: string }[]
> {
  // if (!IS_BROWSER) {
  //   try {
  //     const data = await readFile(".testnetrc");
  //     return JSON.parse(data.toString());
  //   } catch (error) {
  //     if (error.code !== "ENOENT") {
  //       throw error;
  //     }
  //   }
  // } else if (global["__testnet_accounts"]) {
  //   return global["__testnet_accounts"];
  // }
  if (testAccounts) {
    return testAccounts
  }
  let rv: { username: string; password: string }[] = [];
  while (rv.length < NUM_TEST_ACCOUNTS) {
    rv.push(await createAccount());
  }
  testAccounts = rv
  if (console && console.log) {
    console.log(`CREATED TESTNET ACCOUNTS: ${rv.map(i => i.username)}`);
  }
  // if (!IS_BROWSER) {
  //   await writeFile(".testnetrc", Buffer.from(JSON.stringify(rv)));
  // } else {
  //   global["__testnet_accounts"] = rv;
  // }
  return rv;
}
