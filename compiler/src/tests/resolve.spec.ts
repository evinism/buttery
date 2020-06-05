import { load } from "../resolve";
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
    it.skip("resolves vars in party correctly", function () {
      const output = load("../data/resolve/party/main.sur");
      chai.assert.deepEqual(output, {});
    });
  });

  describe("Circular Includes", function () {
    it.skip("resolves vars in oneFile correctly", function () {
      const output = load("../data/resolve/circular/a.sur");
      chai.assert.deepEqual({}, output);
    });
  });

  describe("Service descriptors", function () {
    it.skip("resolves vars in foodDelivery correctly", function () {
      const output = load("../data/resolve/fooddelivery/order.sur");
      chai.assert.deepEqual({}, output);
    });
  });
});
