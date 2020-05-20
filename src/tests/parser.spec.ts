import assert from "assert";
import { refParser, fieldParser, structParser, varDeclParser } from "../parse";
import { stream } from "parser-ts/lib/Stream";
import { isRight, isLeft } from "fp-ts/lib/Either";
import * as chai from "chai";
import { Reference, Field, VariableDeclaration } from "../ast";
import { eof, seq, Parser, apFirst, map, sat } from "parser-ts/lib/Parser";

function eoffed<a, b>(parser: Parser<a, b>) {
  return apFirst(eof())(parser);
}

const buildTestParser = <T>(parser: Parser<string, T>) => (str: string) =>
  eoffed<string, T>(parser)(stream(str.split(""), 0));

describe("Parsing", function () {
  describe("Reference", function () {
    const parseRef = buildTestParser(refParser);

    it("should correctly parse a bare value", function () {
      const parsed = parseRef("z");
      // parsing succeeds!
      assert(isRight(parsed));
      const ref = parsed.right.value;
      const targetRef: Reference = {
        ref: "z",
        typeArgs: [],
      };
      chai.assert.deepEqual(ref, targetRef);
    });

    it("should correctly parse a reference with one type argument", function () {
      const parsed = parseRef("List<blah>");
      // parsing succeeds!
      assert(isRight(parsed));
      const ref = parsed.right.value;
      const targetRef: Reference = {
        ref: "List",
        typeArgs: [
          {
            ref: "blah",
            typeArgs: [],
          },
        ],
      };
      chai.assert.deepEqual(ref, targetRef);
    });

    it("should correctly parse a reference with two type args", function () {
      const parsed = parseRef("Map<number, Dog>");
      // parsing succeeds!
      assert(isRight(parsed));
      const ref = parsed.right.value;
      const targetRef: Reference = {
        ref: "Map",
        typeArgs: [
          {
            ref: "number",
            typeArgs: [],
          },
          {
            ref: "Dog",
            typeArgs: [],
          },
        ],
      };
      chai.assert.deepEqual(ref, targetRef);
    });

    it("should correctly parse a reference with two type args", function () {
      const parsed = parseRef("List<Map<string,Cat>>");
      // parsing succeeds!
      assert(isRight(parsed));
      const ref = parsed.right.value;
      const targetRef: Reference = {
        ref: "List",
        typeArgs: [
          {
            ref: "Map",
            typeArgs: [
              {
                ref: "string",
                typeArgs: [],
              },
              {
                ref: "Cat",
                typeArgs: [],
              },
            ],
          },
        ],
      };
      chai.assert.deepEqual(ref, targetRef);
    });

    it("should correctly parse a reference with lots of spaces everywhere", function () {
      const parsed = parseRef("List  < Map <string  ,Cat  > >");
      // parsing succeeds!
      assert(isRight(parsed));
      const ref = parsed.right.value;
      const targetRef: Reference = {
        ref: "List",
        typeArgs: [
          {
            ref: "Map",
            typeArgs: [
              {
                ref: "string",
                typeArgs: [],
              },
              {
                ref: "Cat",
                typeArgs: [],
              },
            ],
          },
        ],
      };
      chai.assert.deepEqual(ref, targetRef);
    });
  });
  describe("Field", function () {
    const parseField = buildTestParser(fieldParser);
    it("should correctly parse a simple field line", function () {
      const parsed = parseField("  myFieldName: number\n");
      // parsing succeeds!
      assert(isRight(parsed));
      const ref = parsed.right.value;
      const targetRef: Field<Reference> = {
        name: "myFieldName",
        optional: false,
        baseType: {
          ref: "number",
          typeArgs: [],
        },
      };
      chai.assert.deepEqual(ref, targetRef);
    });

    it("should correctly parse an optional field line", function () {
      const parsed = parseField("  myFieldName: optional number\n");
      // parsing succeeds!
      assert(isRight(parsed));
      const ref = parsed.right.value;
      const targetRef: Field<Reference> = {
        name: "myFieldName",
        optional: true,
        baseType: {
          ref: "number",
          typeArgs: [],
        },
      };
      chai.assert.deepEqual(ref, targetRef);
    });

    it("should fail parsing an unindented line", function () {
      const parsed = parseField("myFieldName: number\n");
      assert(isLeft(parsed));
    });

    it("should fail parsing a line with multiple optional decls", function () {
      const parsed = parseField("myFieldName: optional optional number\n");
      assert(isLeft(parsed));
    });

    it("should correctly parse a complicated field line", function () {
      const parsed = parseField("  myFieldName: optional List<Dog>\n");
      // parsing succeeds!
      assert(isRight(parsed));
      const ref = parsed.right.value;
      const targetRef: Field<Reference> = {
        name: "myFieldName",
        optional: true,
        baseType: {
          ref: "List",
          typeArgs: [
            {
              ref: "Dog",
              typeArgs: [],
            },
          ],
        },
      };
      chai.assert.deepEqual(ref, targetRef);
    });
  });

  describe("VarDeclHelper", function () {
    const parseVarDeclFirstLine = buildTestParser(varDeclParser("bloop"));

    it("should correctly parse a simple var declaration", function () {
      const input = "bloop Hello:\n";

      const parsed = parseVarDeclFirstLine(input);
      // parsing succeeds!
      assert(isRight(parsed));
      chai.assert.equal("Hello", parsed.right.value);
    });
  });

  describe("StructDecl", function () {
    const parseStruct = buildTestParser(structParser);

    it("should correctly parse a simple proto", function () {
      const input = "struct Hello:\n  fat: Dog\n  cat: Dog";

      const parsed = parseStruct(input);
      // parsing succeeds!
      assert(isRight(parsed));
      const ref = parsed.right.value;
      const targetRef: VariableDeclaration<Reference> = {
        name: "Hello",
        value: {
          type: "struct",
          fields: [
            {
              name: "fat",
              optional: false,
              baseType: { ref: "Dog", typeArgs: [] },
            },
            {
              name: "cat",
              optional: false,
              baseType: { ref: "Dog", typeArgs: [] },
            },
          ],
        },
      };
      chai.assert.deepEqual(ref, targetRef);
    });

    it("should correctly parse a proto with complex types", function () {
      const input = `struct Hello:
  fatDogs: List<Map<string, Dog>>
  catTracksSeen: bool
  peopleWhoLetTheDogsOut: List<string>
`;

      const parsed = parseStruct(input);
      // parsing succeeds!
      assert(isRight(parsed));
      const ref = parsed.right.value;
      const targetRef: VariableDeclaration<Reference> = {
        name: "Hello",
        value: {
          type: "struct",
          fields: [
            {
              baseType: {
                ref: "List",
                typeArgs: [
                  {
                    ref: "Map",
                    typeArgs: [
                      {
                        ref: "string",
                        typeArgs: [],
                      },
                      {
                        ref: "Dog",
                        typeArgs: [],
                      },
                    ],
                  },
                ],
              },
              name: "fatDogs",
              optional: false,
            },
            {
              baseType: {
                ref: "bool",
                typeArgs: [],
              },
              name: "catTracksSeen",
              optional: false,
            },
            {
              baseType: {
                ref: "List",
                typeArgs: [
                  {
                    ref: "string",
                    typeArgs: [],
                  },
                ],
              },
              name: "peopleWhoLetTheDogsOut",
              optional: false,
            },
          ],
        },
      };
      chai.assert.deepEqual(ref, targetRef);
    });
  });
});
