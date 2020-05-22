import { gen } from "..";
import { load } from "../../../resolve";
import fs from "fs";
import * as chai from "chai";

describe("Generation", function () {
  describe("Typescript", function () {
    it("Types should be generated", function () {
      const ast = load("./data/resolve/party/main.sur");
      const bleep = gen(ast);
      const expected = fs.readFileSync(
        "./src/generators/typescript/tests/expected.ts.data",
        "utf8"
      );
      chai.assert.equal(expected, bleep[0].content);
    });
  });
});
