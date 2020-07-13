import assert from "assert";
import {
  refParser,
  fieldParser,
  structParser,
  rpcParser,
  channelParser,
  importParser,
  fileParser,
  serviceParser,
  oneOfParser,
} from "../parser";
import { stream } from "parser-ts/lib/Stream";
import { isRight, isLeft } from "fp-ts/lib/Either";
import * as chai from "chai";
import { Reference, Field, VariableDeclaration, ButteryFile } from "../ast";
import { eof, seq, Parser, apFirst, map, sat } from "parser-ts/lib/Parser";
import { Token, lexer } from "../lexer";
import { postLex } from "../postLexer";

function eoffed<I, T>(parser: Parser<I, T>) {
  return apFirst(eof<I>())(parser);
}

/*const buildUneoffedTestParser = <T>(parser: Parser<string, T>) => (
  str: string
) => parser(stream(str.split(""), 0));*/

const buildTestParser = <T>(parser: Parser<Token, T>) => (str: string) => {
  const tokens = eoffed(lexer)(stream(str.split(""), 0));
  if (!isRight(tokens)) {
    throw "lexer error!";
  }
  const indented = postLex(tokens.right.value);
  return eoffed(parser)(stream(indented, 0));
};

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
      const parsed = parseField("myFieldName: number");
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
  peopleWhoLetTheDogsOut: List<string>`;

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

  describe("OneOfDecl", function () {
    const parseOneOf = buildTestParser(oneOfParser);
    it("should correctly parse a simple oneOf", function () {
      const input = "oneof Hello:\n  fat: Dog\n  cat: Dog";

      const parsed = parseOneOf(input);
      // parsing succeeds!
      assert(isRight(parsed));
      const ref = parsed.right.value;
      const targetRef: VariableDeclaration<Reference> = {
        statementType: "declaration",
        name: "Hello",
        value: {
          type: "oneof",
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
  });

  describe("RpcParser", () => {
    const parseRpc = buildTestParser(rpcParser);
    it("should correctly parse an rpc decl with complex types", function () {
      const input = `rpc Hello:
  request: List<Map<string, Dog>>
  response: bool`;

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
  outgoing: bool`;

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

  describe("ServiceParser", () => {
    const parseService = buildTestParser(serviceParser);
    it("should correctly parse an rpc decl with complex types", function () {
      const input = `service HiService:
  rpc Hello:
    request: List<Map<string, Dog>>
    response: bool`;

      const parsed = parseService(input);
      // parsing succeeds!
      assert(isRight(parsed));
      const ref = parsed.right.value;
      const targetRef: VariableDeclaration<Reference> = {
        name: "HiService",
        statementType: "declaration",
        value: {
          name: "HiService",
          type: "service",
          variables: [
            {
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
            },
          ],
        },
      };
      chai.assert.deepEqual(ref, targetRef);
    });
  });
  describe("Import", function () {
    const parseImport = buildTestParser(importParser);

    it("correctly parses a basic input stream", function () {
      const input = `import Bleep, Bleep2 from "./this_path.buttery"`;

      const parsed = parseImport(input);
      // parsing succeeds!
      assert(isRight(parsed));
      const ref = parsed.right.value;
      const targetRef = [
        {
          name: "Bleep",
          statementType: "declaration" as "declaration",
          value: {
            import: "Bleep",
            path: "./this_path.buttery",
            type: "import" as "import",
          },
        },
        {
          name: "Bleep2",
          statementType: "declaration" as "declaration",
          value: {
            import: "Bleep2",
            path: "./this_path.buttery",
            type: "import" as "import",
          },
        },
      ];
      chai.assert.deepEqual(ref, targetRef);
    });

    it("correctly parses an input stream in an uneven format", function () {
      const input = `import
  Bleep,
  Bleep2
from "./this_path.buttery"`;

      const parsed = parseImport(input);
      // parsing succeeds!
      assert(isRight(parsed));
      const ref = parsed.right.value;
      const targetRef = [
        {
          name: "Bleep",
          statementType: "declaration" as "declaration",
          value: {
            import: "Bleep",
            path: "./this_path.buttery",
            type: "import" as "import",
          },
        },
        {
          name: "Bleep2",
          statementType: "declaration" as "declaration",
          value: {
            import: "Bleep2",
            path: "./this_path.buttery",
            type: "import" as "import",
          },
        },
      ];
      chai.assert.deepEqual(ref, targetRef);
    });
  });
  describe("File", function () {
    const parseFile = buildTestParser(fileParser("filename"));
    it("correctly parses a file", function () {
      const input = `import
  Bloop,
  Scoop
from "./some_path.buttery"

struct WhoBloopedRequest:
  bloop: Bloop
  includeExtras: Optional<boolean>

struct WhoBloopedResponse:
  scoop: Scoop
  bloopers: List<Bloopers>

service BloopService:
  rpc WhoBlooped:
    request: WhoBloopedRequest
    response: WhoBloopedResponse

`;

      const parsed = parseFile(input);
      // parsing succeeds!
      assert(isRight(parsed));
      const ref = parsed.right.value;
      const targetRef: ButteryFile<Reference> = {
        path: "filename",
        variables: [
          {
            statementType: "declaration",
            name: "Bloop",
            value: {
              type: "import",
              import: "Bloop",
              path: "./some_path.buttery",
            },
          },
          {
            statementType: "declaration",
            name: "Scoop",
            value: {
              type: "import",
              import: "Scoop",
              path: "./some_path.buttery",
            },
          },
          {
            statementType: "declaration",
            name: "WhoBloopedRequest",
            value: {
              type: "struct",
              fields: [
                {
                  name: "bloop",
                  optional: false,
                  baseType: { ref: "Bloop", typeArgs: [] },
                },
                {
                  name: "includeExtras",
                  optional: false,
                  baseType: {
                    ref: "Optional",
                    typeArgs: [{ ref: "boolean", typeArgs: [] }],
                  },
                },
              ],
            },
          },
          {
            statementType: "declaration",
            name: "WhoBloopedResponse",
            value: {
              type: "struct",
              fields: [
                {
                  name: "scoop",
                  optional: false,
                  baseType: { ref: "Scoop", typeArgs: [] },
                },
                {
                  name: "bloopers",
                  optional: false,
                  baseType: {
                    ref: "List",
                    typeArgs: [{ ref: "Bloopers", typeArgs: [] }],
                  },
                },
              ],
            },
          },
          {
            statementType: "declaration",
            name: "BloopService",
            value: {
              type: "service",
              name: "BloopService",
              variables: [
                {
                  statementType: "declaration",
                  name: "WhoBlooped",
                  value: {
                    type: "rpc",
                    name: "WhoBlooped",
                    request: {
                      name: "request",
                      optional: false,
                      baseType: { ref: "WhoBloopedRequest", typeArgs: [] },
                    },
                    response: {
                      name: "response",
                      optional: false,
                      baseType: { ref: "WhoBloopedResponse", typeArgs: [] },
                    },
                  },
                },
              ],
            },
          },
        ],
      };
      chai.assert.deepEqual(targetRef, ref);
    });
  });
});
