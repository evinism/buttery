import * as N from "../nodes";
import * as chai from "chai";

function checkIdempotent<A, T extends N.ButteryNode<A>>(node: T, data: A) {
  const serializedData = node.serialize(data);
  if (serializedData === undefined) {
    throw "Passed in invalid value to idempotent!";
  }
  const serDessedData = node.deserialize(serializedData);
  if (serDessedData === undefined) {
    throw "Passed in invalid value to idempotent!";
  }
  const desSerredData = node.serialize(serDessedData);
  if (desSerredData === undefined) {
    throw "Passed in invalid value to idempotent!";
  }
  chai.assert.deepEqual(data, serDessedData);
  chai.assert.deepEqual(serializedData, desSerredData);
}

describe("Typescript shared nodes", function () {
  describe("General ", function () {
    it("should have idempotent serialization and deserialization of all types", function () {
      checkIdempotent(N.booleanNode(), true);
      checkIdempotent(N.booleanNode(), false);
      checkIdempotent(N.doubleNode(), 0.5);
      checkIdempotent(N.integerNode(), 1);
      checkIdempotent(N.stringNode(), "hello");
      checkIdempotent(N.nullNode(), null);
      checkIdempotent(N.optionalNode(N.integerNode()), null as null | number);
      checkIdempotent(N.optionalNode(N.integerNode()), 1 as null | number);
      checkIdempotent(N.listNode(N.stringNode()), ["Hello", "There"]);
      checkIdempotent(N.mapNode(N.stringNode(), "string"), {
        cat: "hi",
        bees: "there",
      } as { [key: string]: string });
      checkIdempotent(
        N.structNode({
          foo: N.doubleNode(),
          bar: N.stringNode(),
        }),
        {
          foo: 0.5,
          bar: "hi",
        }
      );
    });
  });
});
