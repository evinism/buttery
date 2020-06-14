import { load } from "../pipeline";
import * as chai from "chai";

describe("Resolving", function () {
  describe("Single File", function () {
    it("resolves vars in oneFile correctly", function () {
      const output = load("../data/resolve/onefile/main.sur");
      chai.assert.deepEqual(output, {
        path: "../data/resolve/onefile/main.sur",
        imports: [],
        variables: [
          {
            statementType: "declaration",
            name: "Person",
            value: {
              type: "struct",
              fields: [
                { name: "name", optional: false, baseType: { type: "string" } },
                {
                  name: "sonicFast",
                  optional: false,
                  baseType: { type: "boolean" },
                },
              ],
            },
          },
          {
            statementType: "declaration",
            name: "Message",
            value: {
              type: "struct",
              fields: [
                {
                  name: "author",
                  optional: false,
                  baseType: {
                    type: "struct",
                    fields: [
                      {
                        name: "name",
                        optional: false,
                        baseType: { type: "string" },
                      },
                      {
                        name: "sonicFast",
                        optional: false,
                        baseType: { type: "boolean" },
                      },
                    ],
                  },
                },
                {
                  name: "timestamp",
                  optional: false,
                  baseType: { type: "integer" },
                },
                {
                  name: "contents",
                  optional: false,
                  baseType: { type: "string" },
                },
                {
                  name: "reacts",
                  optional: false,
                  baseType: {
                    type: "map",
                    key: "string",
                    value: {
                      type: "struct",
                      fields: [
                        {
                          name: "name",
                          optional: false,
                          baseType: { type: "string" },
                        },
                        {
                          name: "sonicFast",
                          optional: false,
                          baseType: { type: "boolean" },
                        },
                      ],
                    },
                  },
                },
              ],
            },
          },
          {
            statementType: "declaration",
            name: "OneFileService",
            value: {
              type: "service",
              name: "OneFileService",
              variables: [
                {
                  statementType: "declaration",
                  name: "FindFastest",
                  value: {
                    type: "rpc",
                    name: "FindFastest",
                    request: {
                      name: "request",
                      optional: false,
                      baseType: {
                        type: "list",
                        value: {
                          type: "struct",
                          fields: [
                            {
                              name: "name",
                              optional: false,
                              baseType: { type: "string" },
                            },
                            {
                              name: "sonicFast",
                              optional: false,
                              baseType: { type: "boolean" },
                            },
                          ],
                        },
                      },
                    },
                    response: {
                      name: "response",
                      optional: false,
                      baseType: {
                        type: "struct",
                        fields: [
                          {
                            name: "name",
                            optional: false,
                            baseType: { type: "string" },
                          },
                          {
                            name: "sonicFast",
                            optional: false,
                            baseType: { type: "boolean" },
                          },
                        ],
                      },
                    },
                  },
                },
                {
                  statementType: "declaration",
                  name: "Chat",
                  value: {
                    type: "channel",
                    name: "Chat",
                    incoming: {
                      name: "incoming",
                      optional: false,
                      baseType: {
                        type: "struct",
                        fields: [
                          {
                            name: "author",
                            optional: false,
                            baseType: {
                              type: "struct",
                              fields: [
                                {
                                  name: "name",
                                  optional: false,
                                  baseType: { type: "string" },
                                },
                                {
                                  name: "sonicFast",
                                  optional: false,
                                  baseType: { type: "boolean" },
                                },
                              ],
                            },
                          },
                          {
                            name: "timestamp",
                            optional: false,
                            baseType: { type: "integer" },
                          },
                          {
                            name: "contents",
                            optional: false,
                            baseType: { type: "string" },
                          },
                          {
                            name: "reacts",
                            optional: false,
                            baseType: {
                              type: "map",
                              key: "string",
                              value: {
                                type: "struct",
                                fields: [
                                  {
                                    name: "name",
                                    optional: false,
                                    baseType: { type: "string" },
                                  },
                                  {
                                    name: "sonicFast",
                                    optional: false,
                                    baseType: { type: "boolean" },
                                  },
                                ],
                              },
                            },
                          },
                        ],
                      },
                    },
                    outgoing: {
                      name: "outgoing",
                      optional: false,
                      baseType: {
                        type: "struct",
                        fields: [
                          {
                            name: "author",
                            optional: false,
                            baseType: {
                              type: "struct",
                              fields: [
                                {
                                  name: "name",
                                  optional: false,
                                  baseType: { type: "string" },
                                },
                                {
                                  name: "sonicFast",
                                  optional: false,
                                  baseType: { type: "boolean" },
                                },
                              ],
                            },
                          },
                          {
                            name: "timestamp",
                            optional: false,
                            baseType: { type: "integer" },
                          },
                          {
                            name: "contents",
                            optional: false,
                            baseType: { type: "string" },
                          },
                          {
                            name: "reacts",
                            optional: false,
                            baseType: {
                              type: "map",
                              key: "string",
                              value: {
                                type: "struct",
                                fields: [
                                  {
                                    name: "name",
                                    optional: false,
                                    baseType: { type: "string" },
                                  },
                                  {
                                    name: "sonicFast",
                                    optional: false,
                                    baseType: { type: "boolean" },
                                  },
                                ],
                              },
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              ],
            },
          },
        ],
      });
    });
  });

  describe("Multiple Files", function () {
    it("resolves vars in party correctly", function () {
      const output = load("../data/resolve/party/main.sur");
      chai.assert.deepEqual(output, {
        path: "../data/resolve/party/main.sur",
        imports: [],
        variables: [
          {
            statementType: "declaration",
            name: "Slot",
            value: {
              type: "struct",
              fields: [
                {
                  name: "people",
                  optional: false,
                  baseType: {
                    type: "list",
                    value: {
                      type: "struct",
                      fields: [
                        {
                          name: "name",
                          optional: false,
                          baseType: {
                            type: "string",
                          },
                        },
                        {
                          name: "pronouns",
                          optional: false,
                          baseType: {
                            type: "list",
                            value: {
                              type: "string",
                            },
                          },
                        },
                      ],
                    },
                  },
                },
                {
                  name: "startTime",
                  optional: false,
                  baseType: {
                    type: "integer",
                  },
                },
                {
                  name: "endTime",
                  optional: false,
                  baseType: {
                    type: "integer",
                  },
                },
              ],
            },
          },
          {
            statementType: "declaration",
            name: "AddToPartyResponse",
            value: {
              type: "struct",
              fields: [
                {
                  name: "success",
                  optional: false,
                  baseType: {
                    type: "boolean",
                  },
                },
                {
                  name: "time",
                  optional: true,
                  baseType: {
                    type: "struct",
                    fields: [
                      {
                        name: "people",
                        optional: false,
                        baseType: {
                          type: "list",
                          value: {
                            type: "struct",
                            fields: [
                              {
                                name: "name",
                                optional: false,
                                baseType: {
                                  type: "string",
                                },
                              },
                              {
                                name: "pronouns",
                                optional: false,
                                baseType: {
                                  type: "list",
                                  value: {
                                    type: "string",
                                  },
                                },
                              },
                            ],
                          },
                        },
                      },
                      {
                        name: "startTime",
                        optional: false,
                        baseType: {
                          type: "integer",
                        },
                      },
                      {
                        name: "endTime",
                        optional: false,
                        baseType: {
                          type: "integer",
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            statementType: "declaration",
            name: "ChatMessage",
            value: {
              type: "struct",
              fields: [
                {
                  name: "time",
                  optional: false,
                  baseType: {
                    type: "integer",
                  },
                },
                {
                  name: "content",
                  optional: false,
                  baseType: {
                    type: "string",
                  },
                },
              ],
            },
          },
          {
            statementType: "declaration",
            name: "ChatUpdate",
            value: {
              type: "struct",
              fields: [
                {
                  name: "time",
                  optional: false,
                  baseType: {
                    type: "integer",
                  },
                },
                {
                  name: "content",
                  optional: false,
                  baseType: {
                    type: "string",
                  },
                },
                {
                  name: "author",
                  optional: false,
                  baseType: {
                    type: "struct",
                    fields: [
                      {
                        name: "name",
                        optional: false,
                        baseType: {
                          type: "string",
                        },
                      },
                      {
                        name: "pronouns",
                        optional: false,
                        baseType: {
                          type: "list",
                          value: {
                            type: "string",
                          },
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            statementType: "declaration",
            name: "PartyService",
            value: {
              type: "service",
              name: "PartyService",
              variables: [
                {
                  statementType: "declaration",
                  name: "AddToParty",
                  value: {
                    type: "rpc",
                    name: "AddToParty",
                    request: {
                      name: "request",
                      optional: false,
                      baseType: {
                        type: "struct",
                        fields: [
                          {
                            name: "name",
                            optional: false,
                            baseType: {
                              type: "string",
                            },
                          },
                          {
                            name: "pronouns",
                            optional: false,
                            baseType: {
                              type: "list",
                              value: {
                                type: "string",
                              },
                            },
                          },
                        ],
                      },
                    },
                    response: {
                      name: "response",
                      optional: false,
                      baseType: {
                        type: "struct",
                        fields: [
                          {
                            name: "success",
                            optional: false,
                            baseType: {
                              type: "boolean",
                            },
                          },
                          {
                            name: "time",
                            optional: true,
                            baseType: {
                              type: "struct",
                              fields: [
                                {
                                  name: "people",
                                  optional: false,
                                  baseType: {
                                    type: "list",
                                    value: {
                                      type: "struct",
                                      fields: [
                                        {
                                          name: "name",
                                          optional: false,
                                          baseType: {
                                            type: "string",
                                          },
                                        },
                                        {
                                          name: "pronouns",
                                          optional: false,
                                          baseType: {
                                            type: "list",
                                            value: {
                                              type: "string",
                                            },
                                          },
                                        },
                                      ],
                                    },
                                  },
                                },
                                {
                                  name: "startTime",
                                  optional: false,
                                  baseType: {
                                    type: "integer",
                                  },
                                },
                                {
                                  name: "endTime",
                                  optional: false,
                                  baseType: {
                                    type: "integer",
                                  },
                                },
                              ],
                            },
                          },
                        ],
                      },
                    },
                  },
                },
                {
                  statementType: "declaration",
                  name: "Chat",
                  value: {
                    type: "channel",
                    name: "Chat",
                    incoming: {
                      name: "incoming",
                      optional: false,
                      baseType: {
                        type: "struct",
                        fields: [
                          {
                            name: "time",
                            optional: false,
                            baseType: {
                              type: "integer",
                            },
                          },
                          {
                            name: "content",
                            optional: false,
                            baseType: {
                              type: "string",
                            },
                          },
                        ],
                      },
                    },
                    outgoing: {
                      name: "outgoing",
                      optional: false,
                      baseType: {
                        type: "struct",
                        fields: [
                          {
                            name: "time",
                            optional: false,
                            baseType: {
                              type: "integer",
                            },
                          },
                          {
                            name: "content",
                            optional: false,
                            baseType: {
                              type: "string",
                            },
                          },
                          {
                            name: "author",
                            optional: false,
                            baseType: {
                              type: "struct",
                              fields: [
                                {
                                  name: "name",
                                  optional: false,
                                  baseType: {
                                    type: "string",
                                  },
                                },
                                {
                                  name: "pronouns",
                                  optional: false,
                                  baseType: {
                                    type: "list",
                                    value: {
                                      type: "string",
                                    },
                                  },
                                },
                              ],
                            },
                          },
                        ],
                      },
                    },
                  },
                },
              ],
            },
          },
        ],
      });
    });
  });

  describe("Circular Includes", function () {
    // TODO: Ensure a specific type of error
    it("resolves vars in oneFile correctly", function () {
      chai.assert.throws(() => load("../data/resolve/circular/a.sur"));
    });
  });

  describe("Service descriptors", function () {
    it.skip("resolves vars in foodDelivery correctly", function () {
      const output = load("../data/resolve/fooddelivery/order.sur");
      chai.assert.deepEqual({}, output);
    });
  });

  describe("Namespace resolution", function () {
    it("is able to resolve references with namespaces", function () {
      const output = load("../data/resolve/namespace/ns1.sur");
      chai.assert.equal(!!output, true);
    });
  });
});
