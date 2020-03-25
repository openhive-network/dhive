const dsteem = require("dsteem");

const tx = {
  amount: "0.001 HIVE",
  from: "petertag",
  to: "mahdiyari",
  memo: "test dsteem hivekings"
};
const privkey = "KEY HERE";

const client = new dsteem.Client("https://api.hivekings.com");
const key = dsteem.PrivateKey.fromString(privkey);
console.log(key);
const op = ["transfer", tx];
console.log(op);
client.broadcast
  .sendOperations([op], key)
  .then(res => console.log(res))
  .catch(err => console.log(err));
