const dhive = require("@hiveio/dhive");

const tx = {
  amount: "0.001 HIVE",
  from: "petertag",
  to: "mahdiyari",
  memo: "test dhive hivekings"
};
const privkey = "KEY HERE";

const client = new dhive.Client("https://api.hivekings.com");
const key = dhive.PrivateKey.fromString(privkey);
console.log(key);
const op = ["transfer", tx];
console.log(op);
client.broadcast
  .sendOperations([op], key)
  .then(res => console.log(res))
  .catch(err => console.log(err));
