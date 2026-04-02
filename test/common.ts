import * as https from 'https';
import { randomBytes } from 'crypto';
import { Client, PrivateKey } from '../src';

export const NUM_TEST_ACCOUNTS = 2;
export const TEST_NODE = process.env.TEST_NODE || 'https://api.hive.blog';

export const agent = new https.Agent({ keepAlive: true });

let testAccounts;

export const randomString = (length: number) =>
  randomBytes(length * 2)
    .toString('base64')
    .replace(/[^0-9a-z]+/gi, '')
    .slice(0, length)
    .toLowerCase();

export const createAccount = async (): Promise<{
  username: string;
  password: string;
}> => {
  const password = randomString(32);
  const username = `dhive-${randomString(9)}`;

  // Create testnet account and delegate to it
  const client = Client.testnet({ agent });
  const ops = {
    creator: 'initminer',
    username,
    password
  };
  const key = PrivateKey.from('5JNHfZYKGaomSFvd4NUdQ9qMcEAC43kujbfjueTHpVapX1Kzq2n');
  await client.broadcast.createTestAccount(ops, key);
  await client.broadcast.sendOperations(
    [
      [
        'transfer_to_vesting',
        {
          amount: '100000.000 TESTS',
          from: 'initminer',
          to: username
        }
      ]
    ],
    key
  );
  await client.broadcast.transfer(
    {
      from: 'initminer',
      to: username,
      amount: '1000.000 TESTS',
      memo: 'test acc'
    },
    key
  );
  await client.broadcast.transfer(
    {
      from: 'initminer',
      to: username,
      amount: '1000.000 TBD',
      memo: 'test acc'
    },
    key
  );

  return { username, password };
};

export const getTestnetAccounts = async (): Promise<{ username: string; password: string }[]> => {
  if (testAccounts) {
    return testAccounts;
  }
  const rv: { username: string; password: string }[] = [];
  while (rv.length < NUM_TEST_ACCOUNTS) {
    rv.push(await createAccount());
  }
  testAccounts = rv;
  // eslint-disable-next-line no-console
  if (console && console.log) {
    // eslint-disable-next-line no-console,@typescript-eslint/restrict-template-expressions
    console.log(`CREATED TESTNET ACCOUNTS: ${rv.map((i) => i.username)}`);
  }
  return rv;
};
