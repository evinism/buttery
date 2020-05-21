import assert from "assert";
import {
  refParser,
  fieldParser,
  structParser,
  varDeclParser,
  rpcParser,
  channelParser,
  importParser,
  fileParser,
} from "../parse";
import { stream } from "parser-ts/lib/Stream";
import { isRight, isLeft } from "fp-ts/lib/Either";
import * as chai from "chai";
import {
  Reference,
  Field,
  VariableDeclaration,
  ImportStatement,
  SurpcFile,
} from "../ast";
import { eof, seq, Parser, apFirst, map, sat } from "parser-ts/lib/Parser";

function eoffed<a, b>(parser: Parser<a, b>) {
  return apFirst(eof())(parser);
}

const buildTestParser = <T>(parser: Parser<string, T>) => (str: string) =>
  eoffed<string, T>(parser)(stream(str.split(""), 0));

const buildUneoffedTestParser = <T>(parser: Parser<string, T>) => (
  str: string
) => parser(stream(str.split(""), 0));

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
        statementType: "declaration",
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
        statementType: "declaration",
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
  describe("RpcParser", () => {
    const parseRpc = buildTestParser(rpcParser);
    it("should correctly parse an rpc decl with complex types", function () {
      const input = `rpc Hello:
  request: List<Map<string, Dog>>
  response: bool
`;

      const parsed = parseRpc(input);
      // parsing succeeds!
      assert(isRight(parsed));
      const ref = parsed.right.value;
      const targetRef: VariableDeclaration<Reference> = {
        statementType: "declaration",
        name: "Hello",
        value: {
          type: "rpc",
          name: "Hello",
          request: {
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
            name: "request",
            optional: false,
          },
          response: {
            baseType: {
              ref: "bool",
              typeArgs: [],
            },
            name: "response",
            optional: false,
          },
        },
      };
      chai.assert.deepEqual(ref, targetRef);
    });
  });

  describe("ChannelParser", () => {
    const parseChannel = buildTestParser(channelParser);
    it("should correctly parse a proto with complex types", function () {
      const input = `channel Hello:
  incoming: List<Map<string, Dog>>
  outgoing: bool
`;

      const parsed = parseChannel(input);
      // parsing succeeds!
      assert(isRight(parsed));
      const ref = parsed.right.value;
      const targetRef: VariableDeclaration<Reference> = {
        statementType: "declaration",
        name: "Hello",
        value: {
          type: "channel",
          name: "Hello",
          incoming: {
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
            name: "incoming",
            optional: false,
          },
          outgoing: {
            baseType: {
              ref: "bool",
              typeArgs: [],
            },
            name: "outgoing",
            optional: false,
          },
        },
      };
      chai.assert.deepEqual(ref, targetRef);
    });
  });
  describe("Import", function () {
    const parseImport = buildTestParser(importParser);

    it("correctly parses a basic input stream", function () {
      const input = `import Bleep, Bleep2 from "./this_path.sur"\n`;

      const parsed = parseImport(input);
      // parsing succeeds!
      assert(isRight(parsed));
      const ref = parsed.right.value;
      const targetRef: ImportStatement = {
        statementType: "import",
        path: "./this_path.sur",
        imports: ["Bleep", "Bleep2"],
      };
      chai.assert.deepEqual(ref, targetRef);
    });

    it("correctly parses an input stream in an uneven format", function () {
      const input = `import
  Bleep,
  Bleep2
from "./this_path.sur"
`;

      const parsed = parseImport(input);
      // parsing succeeds!
      assert(isRight(parsed));
      const ref = parsed.right.value;
      const targetRef: ImportStatement = {
        statementType: "import",
        path: "./this_path.sur",
        imports: ["Bleep", "Bleep2"],
      };
      chai.assert.deepEqual(ref, targetRef);
    });
  });
  describe("File", function () {
    const parseFile = buildUneoffedTestParser(fileParser("filename"));
    it("correctly parses a file", function () {
      const input = `import
  Bloop,
  Scoop
from "./some_path.sur"

struct WhoBloopedRequest:
  bloop: Bloop
  includeExtras: optional boolean

struct WhoBloopedResponse:
  scoop: Scoop
  bloopers: List<Bloopers>
`;

      const parsed = parseFile(input);
      // parsing succeeds!
      assert(isRight(parsed));
      const ref = parsed.right.value;
      const targetRef: SurpcFile<Reference> = {
        imports: [
          {
            imports: ["Bloop", "Scoop"],
            path: "./some_path.sur",
            statementType: "import",
          },
        ],
        path: "filename",
        variables: [
          {
            name: "WhoBloopedRequest",
            statementType: "declaration",
            value: {
              fields: [
                {
                  baseType: {
                    ref: "Bloop",
                    typeArgs: [],
                  },
                  name: "bloop",
                  optional: false,
                },
                {
                  baseType: {
                    ref: "boolean",
                    typeArgs: [],
                  },
                  name: "includeExtras",
                  optional: true,
                },
              ],
              type: "struct",
            },
          },
          {
            name: "WhoBloopedResponse",
            statementType: "declaration",
            value: {
              fields: [
                {
                  baseType: {
                    ref: "Scoop",
                    typeArgs: [],
                  },
                  name: "scoop",
                  optional: false,
                },
                {
                  baseType: {
                    ref: "List",
                    typeArgs: [
                      {
                        ref: "Bloopers",
                        typeArgs: [],
                      },
                    ],
                  },
                  name: "bloopers",
                  optional: false,
                },
              ],
              type: "struct",
            },
          },
        ],
      };
      chai.assert.deepEqual(ref, targetRef);
    });
  });
});
