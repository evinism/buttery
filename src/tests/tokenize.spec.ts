import * as chai from "chai";
import fs from "fs";
import { tokenize, nameTokenParser } from "../tokenize";
import { stream } from "parser-ts/lib/Stream";
import assert from "assert";
import { isRight } from "fp-ts/lib/Either";

describe("Tokenizing", function () {
  describe("Featureful file", function () {
    it("allows whitespace before newlines", function () {
      const parsed = tokenize(stream("  \n \n\n \n".split(""), 0));

      assert(isRight(parsed));
      const output = parsed.right.value;
      chai.assert.deepEqual(
        [
          {
            token: "newline",
          },
          {
            token: "newline",
          },
          {
            token: "newline",
          },
          {
            token: "newline",
          },
        ],
        output
      );
    });

    it.skip("ignores whitespace at end of file", function () {
      const parsed = tokenize(stream("  ".split(""), 0));

      assert(isRight(parsed));
      const output = parsed.right.value;
      chai.assert.deepEqual(
        [
          {
            token: "newline",
          },
        ],
        output
      );
    });

    /*it.skip("correctly parses names", function () {
      const parsed = tokenize(stream("import Bleep".split(""), 0));

      assert(isRight(parsed));
      const output = parsed.right.value;
      chai.assert.deepEqual(
        [
          {
            name: "Bleep",
            token: "name",
          },
        ],
        output
      );
    });*/

    it("resolves tokens in party main correctly", function () {
      const contents = fs.readFileSync(
        "./data/resolve/party/main.sur",
        "utf-8"
      );
      const parsed = tokenize(stream(contents.split(""), 0));

      assert(isRight(parsed));
      const output = parsed.right.value;
      const expected = [
        { token: "import" },
        { token: "name", name: "person" },
        { token: "from" },
        { token: "quotedString", contents: "./person.sur" },
        { token: "newline" },
        { token: "newline" },
        { token: "struct" },
        { token: "name", name: "Slot" },
        { token: "colon" },
        { token: "newline" },
        { token: "indent" },
        { token: "name", name: "people" },
        { token: "colon" },
        { token: "name", name: "List" },
        { token: "openbracket" },
        { token: "name", name: "Person" },
        { token: "closebracket" },
        { token: "newline" },
        { token: "indent" },
        { token: "name", name: "startTime" },
        { token: "colon" },
        { token: "name", name: "integer" },
        { token: "newline" },
        { token: "indent" },
        { token: "name", name: "endTime" },
        { token: "colon" },
        { token: "name", name: "integer" },
        { token: "newline" },
        { token: "newline" },
        { token: "struct" },
        { token: "name", name: "AddToPartyResponse" },
        { token: "colon" },
        { token: "newline" },
        { token: "indent" },
        { token: "name", name: "success" },
        { token: "colon" },
        { token: "name", name: "boolean" },
        { token: "newline" },
        { token: "indent" },
        { token: "name", name: "time" },
        { token: "colon" },
        { token: "optional" },
        { token: "name", name: "Slot" },
        { token: "newline" },
        { token: "newline" },
        { token: "rpc" },
        { token: "name", name: "AddToParty" },
        { token: "colon" },
        { token: "newline" },
        { token: "indent" },
        { token: "name", name: "request" },
        { token: "colon" },
        { token: "name", name: "Person" },
        { token: "newline" },
        { token: "indent" },
        { token: "name", name: "response" },
        { token: "colon" },
        { token: "name", name: "AddToPartyResponse" },
        { token: "newline" },
        { token: "newline" },
        { token: "newline" },
      ];
      chai.assert.deepEqual(expected, output);
    });
  });
});
