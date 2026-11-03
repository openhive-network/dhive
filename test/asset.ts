import "mocha";
import assert = require("assert");

import { Asset, NaiAsset, Price, getVestingSharePrice } from "./../src";

const fixtures = require("./block-api-fixtures.json");

describe("asset", function() {
  it("should create from string", function() {
    const oneHive = Asset.fromString("1.000 HIVE");
    assert.equal(oneHive.amount, 1);
    assert.equal(oneHive.symbol, "HIVE");
    const vests = Asset.fromString("0.123456 VESTS");
    assert.equal(vests.amount, 0.123456);
    assert.equal(vests.symbol, "VESTS");
    const hbd = Asset.from("0.444 HBD");
    assert.equal(hbd.amount, 0.444);
    assert.equal(hbd.symbol, "HBD");
  });

  it("should convert to string", function() {
    const hive = new Asset(44.999999, "HIVE");
    assert.equal(hive.toString(), "45.000 HIVE");
    const vests = new Asset(44.999999, "VESTS");
    assert.equal(vests.toString(), "44.999999 VESTS");
  });

  it("should add and subtract", function() {
    const a = new Asset(44.999, "HIVE");
    assert.equal(a.subtract(1.999).toString(), "43.000 HIVE");
    assert.equal(a.add(0.001).toString(), "45.000 HIVE");
    assert.equal(
      Asset.from("1.999 HIVE")
        .subtract(a)
        .toString(),
      "-43.000 HIVE"
    );
    assert.equal(
      Asset.from(a)
        .subtract(a)
        .toString(),
      "0.000 HIVE"
    );
    assert.equal(
      Asset.from("99.999999 VESTS")
        .add("0.000001 VESTS")
        .toString(),
      "100.000000 VESTS"
    );
    assert.throws(() =>
      Asset.fromString("100.000 HIVE").subtract("100.000000 VESTS")
    );
    assert.throws(() => Asset.from(100, "VESTS").add(a));
    assert.throws(() => Asset.from(100).add("1.000000 VESTS"));
  });

  it("should max and min", function() {
    const a = Asset.from(1),
      b = Asset.from(2);
    assert.equal(Asset.min(a, b), a);
    assert.equal(Asset.min(b, a), a);
    assert.equal(Asset.max(a, b), b);
    assert.equal(Asset.max(b, a), b);
  });

  it("should throw on invalid values", function() {
    assert.throws(() => Asset.fromString("1.000 SNACKS"));
    assert.throws(() => Asset.fromString("I LIKE TURT 0.42"));
    assert.throws(() => Asset.fromString("Infinity HIVE"));
    assert.throws(() => Asset.fromString("..0 HIVE"));
    assert.throws(() => Asset.from("..0 HIVE"));
    assert.throws(() => Asset.from(NaN));
    assert.throws(() => Asset.from(false as any));
    assert.throws(() => Asset.from(Infinity));
    assert.throws(() => Asset.from({ bar: 22 } as any));
  });

  it("should parse price", function() {
    const price1 = new Price(Asset.from("1.000 HIVE"), Asset.from(1, "HBD"));
    const price2 = Price.from(price1);
    const price3 = Price.from({ base: "1.000 HIVE", quote: price1.quote });
    assert.equal(price1.toString(), "1.000 HIVE:1.000 HBD");
    assert.equal(price2.base.toString(), price3.base.toString());
    assert.equal(price2.quote.toString(), price3.quote.toString());
  });

  it("should get vesting share price", function() {
    const props: any = {
      total_vesting_fund_hive: "5.000 HIVE",
      total_vesting_shares: "12345.000000 VESTS"
    };
    const price1 = getVestingSharePrice(props);
    assert.equal(price1.base.amount, 12345);
    assert.equal(price1.base.symbol, "VESTS");
    assert.equal(price1.quote.amount, 5);
    assert.equal(price1.quote.symbol, "HIVE");
    const badProps: any = {
      total_vesting_fund_hive: "0.000 HIVE",
      total_vesting_shares: "0.000000 VESTS"
    };
    const price2 = getVestingSharePrice(badProps);
    assert.equal(price2.base.amount, 1);
    assert.equal(price2.base.symbol, "VESTS");
    assert.equal(price2.quote.amount, 1);
    assert.equal(price2.quote.symbol, "HIVE");
  });

  it("should convert price", function() {
    const price1 = new Price(Asset.from("0.500 HIVE"), Asset.from("1.000 HBD"));
    const v1 = price1.convert(Asset.from("1.000 HIVE"));
    assert.equal(v1.amount, 2);
    assert.equal(v1.symbol, "HBD");
    const v2 = price1.convert(Asset.from("1.000 HBD"));
    assert.equal(v2.amount, 0.5);
    assert.equal(v2.symbol, "HIVE");
    assert.throws(() => {
      price1.convert(Asset.from(1, "VESTS"));
    });
  });

  it("should convert from NAI", function() {
    const hbd = Asset.fromNai({ nai: "@@000000013", amount: "1000000000", precision: 3 });
    assert.equal(hbd.symbol, "HBD");
    assert.equal(hbd.amount, 1000000);
    assert.equal(hbd.toString(), "1000000.000 HBD");
    assert.equal(Asset.fromNai({ nai: "@@000000021", amount: "1", precision: 3 }).toString(), "0.001 HIVE");
    assert.equal(Asset.fromNai({ nai: "@@000000037", amount: "0", precision: 6 }).toString(), "0.000000 VESTS");
    assert.equal(
      Asset.from({ nai: "@@000000021", amount: "42000", precision: 3 }, "HIVE").add("1.000 HIVE").toString(),
      "43.000 HIVE"
    );
  });

  it("should convert block_api NAI amounts", function() {
    const [transfer, claim] = fixtures.get_block.block.transactions
      .slice(1)
      .map((tx: any) => tx.operations[0].value);
    assert.equal(Asset.fromNai(transfer.amount).toString(), "14.000 HBD");
    assert.deepEqual(Asset.fromNai(transfer.amount).toNai(), transfer.amount);
    assert.equal(Asset.fromNai(claim.fee).toString(), "0.000 HIVE");
    assert.deepEqual(Asset.fromNai(claim.fee).toNai(), claim.fee);
  });

  it("should convert to NAI", function() {
    assert.deepEqual(Asset.from("1.000 HIVE").toNai(), { nai: "@@000000021", amount: "1000", precision: 3 });
    assert.deepEqual(Asset.from("0.444 HBD").toNai(), { nai: "@@000000013", amount: "444", precision: 3 });
    assert.deepEqual(Asset.from("0.123456 VESTS").toNai(), { nai: "@@000000037", amount: "123456", precision: 6 });
    assert.deepEqual(Asset.from("-1.5 HIVE").toNai(), { nai: "@@000000021", amount: "-1500", precision: 3 });
    assert.deepEqual(new Asset(44.999999, "HIVE").toNai(), { nai: "@@000000021", amount: "45000", precision: 3 });
    assert.deepEqual(Asset.from(2, "TESTS").toNai(), { nai: "@@000000021", amount: "2000", precision: 3 });
    assert.deepEqual(Asset.from("0.001 TBD").toNai(), { nai: "@@000000013", amount: "1", precision: 3 });
  });

  it("should convert large VESTS amounts exactly", function() {
    const nai: NaiAsset = { nai: "@@000000037", amount: "312345678901234567890", precision: 6 };
    const vests = Asset.fromNai(nai);
    assert.equal(vests.toString(), "312345678901234.567890 VESTS");
    assert.deepEqual(vests.toNai(), nai);
    assert.deepEqual(Asset.from(vests.toString()).toNai(), nai);
  });

  it("should round-trip strings through NAI", function() {
    for (const s of [
      "0.000 HIVE",
      "1.000 HIVE",
      "123456789.123 HIVE",
      "0.001 HBD",
      "1000000.000 HBD",
      "0.000001 VESTS",
      "9007199254.740993 VESTS",
      "312345678901234.567890 VESTS",
    ]) {
      assert.equal(Asset.fromNai(Asset.fromString(s).toNai()).toString(), s);
    }
  });

  it("should reject invalid NAI assets", function() {
    assert.throws(() => Asset.fromNai({ nai: "@@000000099", amount: "1", precision: 3 }), /Unknown asset NAI: @@000000099/);
    assert.throws(() => Asset.fromNai({ nai: "constructor", amount: "1", precision: 3 }), /Unknown asset NAI/);
    assert.throws(
      () => Asset.fromNai({ nai: "@@000000037", amount: "1", precision: 3 }),
      /Invalid precision for NAI @@000000037 \(VESTS\): expected 6 got: 3/
    );
    assert.throws(() => Asset.fromNai({ nai: "@@000000013", amount: "1.5", precision: 3 }), /Invalid NAI asset amount: 1.5/);
    assert.throws(() => Asset.from({ nai: "@@000000013", amount: "1", precision: 3 }, "HIVE"), /expected symbol: HIVE got: HBD/);
  });
});
