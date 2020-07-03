import * as N from "../nodes";
import * as chai from "chai";

function checkIdempotent<A, T extends N.ButteryNode<A>>(node: T, data: A) {
  const serializedData = node.serialize(data);
  const serDessedData = node.deserialize(serializedData);
  const desSerredData = node.serialize(serDessedData);
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
      checkIdempotent(N.optionalNode(N.integerNode()), null);
      checkIdempotent(N.optionalNode(N.integerNode()), 1);
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
