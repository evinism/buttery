import * as chai from "chai";
import fs from "fs";
import { tokenize, nameTokenParser } from "../tokenize";
import { stream } from "parser-ts/lib/Stream";
import assert from "assert";
import { isRight } from "fp-ts/lib/Either";

describe("Tokenizing", function () {
  describe("Featureful file", function () {
    it("allows whitespace before newlines", function () {
      const parsed = tokenize(stream("hi  \n \n\n \nhi".split(""), 0));

      assert(isRight(parsed));
      const output = parsed.right.value;
      chai.assert.deepEqual(
        [
          {
            token: "name",
            name: "hi",
          },
          {
            token: "newline",
          },
          {
            token: "name",
            name: "hi",
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
        { token: "name", name: "Person" },
        { token: "from" },
        { token: "quotedString", contents: "./person.sur" },
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
      ];
      chai.assert.deepEqual(expected, output);
    });

    it("tokenizes references with lots of spaces everywhere", function () {
      const contents = "List  < Map <string  ,Cat  > >";
      const parsed = tokenize(stream(contents.split(""), 0));

      assert(isRight(parsed));
      const output = parsed.right.value;
      const expected = [
        {
          name: "List",
          token: "name",
        },
        {
          token: "openbracket",
        },
        {
          name: "Map",
          token: "name",
        },
        {
          token: "openbracket",
        },
        {
          name: "string",
          token: "name",
        },
        {
          token: "comma",
        },
        {
          name: "Cat",
          token: "name",
        },
        {
          token: "closebracket",
        },
        {
          token: "closebracket",
        },
      ];
      chai.assert.deepEqual(expected, output);
    });

    it("tokenizes nested and multiple items", function () {
      const contents = "field: Map<number, List<Dog>>";
      const parsed = tokenize(stream(contents.split(""), 0));

      assert(isRight(parsed));
      const output = parsed.right.value;
      const expected = [
        {
          name: "field",
          token: "name",
        },
        {
          token: "colon",
        },
        {
          name: "Map",
          token: "name",
        },
        {
          token: "openbracket",
        },
        {
          name: "number",
          token: "name",
        },
        {
          token: "comma",
        },
        {
          name: "List",
          token: "name",
        },
        {
          token: "openbracket",
        },
        {
          name: "Dog",
          token: "name",
        },
        {
          token: "closebracket",
        },
        {
          token: "closebracket",
        },
      ];
      chai.assert.deepEqual(expected, output);
    });

    it("correctly tokenizes a simple field", function () {
      const contents = "myFieldName: number";
      const parsed = tokenize(stream(contents.split(""), 0));

      assert(isRight(parsed));
      const output = parsed.right.value;
      const expected = [
        {
          name: "myFieldName",
          token: "name",
        },
        {
          token: "colon",
        },
        {
          name: "number",
          token: "name",
        },
      ];
      chai.assert.deepEqual(expected, output);
    });

    it("correctly tokenizes a simple struct", function () {
      const contents = "struct Hello:\n  fat: Dog\n  cat: Dog";
      const parsed = tokenize(stream(contents.split(""), 0));

      assert(isRight(parsed));
      const output = parsed.right.value;
      const expected = [
        {
          token: "struct",
        },
        {
          name: "Hello",
          token: "name",
        },
        {
          token: "colon",
        },
        {
          token: "newline",
        },
        {
          token: "indent",
        },
        {
          name: "fat",
          token: "name",
        },
        {
          token: "colon",
        },
        {
          name: "Dog",
          token: "name",
        },
        {
          token: "newline",
        },
        {
          token: "indent",
        },
        {
          name: "cat",
          token: "name",
        },
        {
          token: "colon",
        },
        {
          name: "Dog",
          token: "name",
        },
      ];
      chai.assert.deepEqual(expected, output);
    });
    it("correctly tokenizes an import with odd newlines", function () {
      const contents = `import
  Bleep,
  Bleep2
from "./this_path.sur"`;
      const parsed = tokenize(stream(contents.split(""), 0));

      assert(isRight(parsed));
      const output = parsed.right.value;
      const expected = [
        {
          token: "import",
        },
        {
          name: "Bleep",
          token: "name",
        },
        {
          token: "comma",
        },
        {
          name: "Bleep2",
          token: "name",
        },
        {
          token: "from",
        },
        {
          contents: "./this_path.sur",
          token: "quotedString",
        },
      ];
      chai.assert.deepEqual(expected, output);
    });
  });
});
