import "mocha";
import * as assert from "assert";

import { Asset, Price, getVestingSharePrice } from "./../src";

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
      total_vesting_fund_steem: "5.000 HIVE",
      total_vesting_shares: "12345.000000 VESTS"
    };
    const price1 = getVestingSharePrice(props);
    assert.equal(price1.base.amount, 12345);
    assert.equal(price1.base.symbol, "VESTS");
    assert.equal(price1.quote.amount, 5);
    assert.equal(price1.quote.symbol, "HIVE");
    const badProps: any = {
      total_vesting_fund_steem: "0.000 HIVE",
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
});
