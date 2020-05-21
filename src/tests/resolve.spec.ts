import { load } from "../resolve";
import * as chai from "chai";

describe("Resolving", function () {
  describe("Single File", function () {
    it("resolves vars in oneFile correctly", function () {
      const output = load("./src/tests/data/resolve/onefile/main.sur");

      chai.assert.deepEqual(output, {
        imports: [],
        path: "./src/tests/data/resolve/onefile/main.sur",
        variables: [
          {
            name: "Person",
            statementType: "declaration",
            value: {
              fields: [
                {
                  baseType: {
                    type: "string",
                  },
                  name: "name",
                  optional: false,
                },
                {
                  baseType: {
                    type: "boolean",
                  },
                  name: "sonicFast",
                  optional: false,
                },
              ],
              type: "struct",
            },
          },
          {
            name: "FindFastest",
            statementType: "declaration",
            value: {
              name: "FindFastest",
              request: {
                baseType: {
                  type: "list",
                  value: {
                    fields: [
                      {
                        baseType: {
                          type: "string",
                        },
                        name: "name",
                        optional: false,
                      },
                      {
                        baseType: {
                          type: "boolean",
                        },
                        name: "sonicFast",
                        optional: false,
                      },
                    ],
                    type: "struct",
                  },
                },
                name: "request",
                optional: false,
              },
              response: {
                baseType: {
                  fields: [
                    {
                      baseType: {
                        type: "string",
                      },
                      name: "name",
                      optional: false,
                    },
                    {
                      baseType: {
                        type: "boolean",
                      },
                      name: "sonicFast",
                      optional: false,
                    },
                  ],
                  type: "struct",
                },
                name: "response",
                optional: false,
              },
              type: "rpc",
            },
          },
          {
            name: "Message",
            statementType: "declaration",
            value: {
              fields: [
                {
                  baseType: {
                    fields: [
                      {
                        baseType: {
                          type: "string",
                        },
                        name: "name",
                        optional: false,
                      },
                      {
                        baseType: {
                          type: "boolean",
                        },
                        name: "sonicFast",
                        optional: false,
                      },
                    ],
                    type: "struct",
                  },
                  name: "author",
                  optional: false,
                },
                {
                  baseType: {
                    type: "integer",
                  },
                  name: "timestamp",
                  optional: false,
                },
                {
                  baseType: {
                    type: "string",
                  },
                  name: "contents",
                  optional: false,
                },
                {
                  baseType: {
                    key: "string",
                    type: "map",
                    value: {
                      fields: [
                        {
                          baseType: {
                            type: "string",
                          },
                          name: "name",
                          optional: false,
                        },
                        {
                          baseType: {
                            type: "boolean",
                          },
                          name: "sonicFast",
                          optional: false,
                        },
                      ],
                      type: "struct",
                    },
                  },
                  name: "reacts",
                  optional: false,
                },
              ],
              type: "struct",
            },
          },
          {
            name: "Chat",
            statementType: "declaration",
            value: {
              incoming: {
                baseType: {
                  fields: [
                    {
                      baseType: {
                        fields: [
                          {
                            baseType: {
                              type: "string",
                            },
                            name: "name",
                            optional: false,
                          },
                          {
                            baseType: {
                              type: "boolean",
                            },
                            name: "sonicFast",
                            optional: false,
                          },
                        ],
                        type: "struct",
                      },
                      name: "author",
                      optional: false,
                    },
                    {
                      baseType: {
                        type: "integer",
                      },
                      name: "timestamp",
                      optional: false,
                    },
                    {
                      baseType: {
                        type: "string",
                      },
                      name: "contents",
                      optional: false,
                    },
                    {
                      baseType: {
                        key: "string",
                        type: "map",
                        value: {
                          fields: [
                            {
                              baseType: {
                                type: "string",
                              },
                              name: "name",
                              optional: false,
                            },
                            {
                              baseType: {
                                type: "boolean",
                              },
                              name: "sonicFast",
                              optional: false,
                            },
                          ],
                          type: "struct",
                        },
                      },
                      name: "reacts",
                      optional: false,
                    },
                  ],
                  type: "struct",
                },
                name: "incoming",
                optional: false,
              },
              name: "Chat",
              outgoing: {
                baseType: {
                  fields: [
                    {
                      baseType: {
                        fields: [
                          {
                            baseType: {
                              type: "string",
                            },
                            name: "name",
                            optional: false,
                          },
                          {
                            baseType: {
                              type: "boolean",
                            },
                            name: "sonicFast",
                            optional: false,
                          },
                        ],
                        type: "struct",
                      },
                      name: "author",
                      optional: false,
                    },
                    {
                      baseType: {
                        type: "integer",
                      },
                      name: "timestamp",
                      optional: false,
                    },
                    {
                      baseType: {
                        type: "string",
                      },
                      name: "contents",
                      optional: false,
                    },
                    {
                      baseType: {
                        key: "string",
                        type: "map",
                        value: {
                          fields: [
                            {
                              baseType: {
                                type: "string",
                              },
                              name: "name",
                              optional: false,
                            },
                            {
                              baseType: {
                                type: "boolean",
                              },
                              name: "sonicFast",
                              optional: false,
                            },
                          ],
                          type: "struct",
                        },
                      },
                      name: "reacts",
                      optional: false,
                    },
                  ],
                  type: "struct",
                },
                name: "outgoing",
                optional: false,
              },
              type: "channel",
            },
          },
        ],
      });
    });
  });
});
