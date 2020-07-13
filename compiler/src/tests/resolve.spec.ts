import { load } from "../pipeline";
import * as chai from "chai";

describe("Resolving", function () {
  describe("Single File", function () {
    it("resolves vars in oneFile correctly", function () {
      const output = load("../data/resolve/onefile/main.buttery");
      const targetOutput = {
        path: "../data/resolve/onefile/main.buttery",
        variables: [
          {
            statementType: "declaration",
            name: "Person",
            value: {
              type: "struct",
              fields: [
                { name: "name", baseType: { type: "string" } },
                {
                  name: "sonicFast",
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
                  baseType: {
                    type: "struct",
                    fields: [
                      {
                        name: "name",
                        baseType: { type: "string" },
                      },
                      {
                        name: "sonicFast",
                        baseType: { type: "boolean" },
                      },
                    ],
                  },
                },
                {
                  name: "timestamp",
                  baseType: { type: "integer" },
                },
                {
                  name: "contents",
                  baseType: { type: "string" },
                },
                {
                  name: "reacts",
                  baseType: {
                    type: "map",
                    key: "string",
                    value: {
                      type: "struct",
                      fields: [
                        {
                          name: "name",
                          baseType: { type: "string" },
                        },
                        {
                          name: "sonicFast",
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
                      baseType: {
                        type: "list",
                        value: {
                          type: "struct",
                          fields: [
                            {
                              name: "name",
                              baseType: { type: "string" },
                            },
                            {
                              name: "sonicFast",
                              baseType: { type: "boolean" },
                            },
                          ],
                        },
                      },
                    },
                    response: {
                      name: "response",
                      baseType: {
                        type: "struct",
                        fields: [
                          {
                            name: "name",
                            baseType: { type: "string" },
                          },
                          {
                            name: "sonicFast",
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
                      baseType: {
                        type: "struct",
                        fields: [
                          {
                            name: "author",
                            baseType: {
                              type: "struct",
                              fields: [
                                {
                                  name: "name",
                                  baseType: { type: "string" },
                                },
                                {
                                  name: "sonicFast",
                                  baseType: { type: "boolean" },
                                },
                              ],
                            },
                          },
                          {
                            name: "timestamp",
                            baseType: { type: "integer" },
                          },
                          {
                            name: "contents",
                            baseType: { type: "string" },
                          },
                          {
                            name: "reacts",
                            baseType: {
                              type: "map",
                              key: "string",
                              value: {
                                type: "struct",
                                fields: [
                                  {
                                    name: "name",
                                    baseType: { type: "string" },
                                  },
                                  {
                                    name: "sonicFast",
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
                      baseType: {
                        type: "struct",
                        fields: [
                          {
                            name: "author",
                            baseType: {
                              type: "struct",
                              fields: [
                                {
                                  name: "name",
                                  baseType: { type: "string" },
                                },
                                {
                                  name: "sonicFast",
                                  baseType: { type: "boolean" },
                                },
                              ],
                            },
                          },
                          {
                            name: "timestamp",
                            baseType: { type: "integer" },
                          },
                          {
                            name: "contents",
                            baseType: { type: "string" },
                          },
                          {
                            name: "reacts",
                            baseType: {
                              type: "map",
                              key: "string",
                              value: {
                                type: "struct",
                                fields: [
                                  {
                                    name: "name",
                                    baseType: { type: "string" },
                                  },
                                  {
                                    name: "sonicFast",
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
      };
      chai.assert.deepEqual<Object>(output, targetOutput);
    });
  });

  describe("Multiple Files", function () {
    it("resolves vars in party correctly", function () {
      const output = load("../data/resolve/party/main.buttery");
      chai.assert.deepEqual<Object>(output, {
        path: "../data/resolve/party/main.buttery",
        variables: [
          {
            statementType: "declaration",
            name: "Person",
            value: {
              type: "struct",
              fields: [
                { name: "name", baseType: { type: "string" } },
                {
                  name: "pronouns",
                  baseType: { type: "list", value: { type: "string" } },
                },
              ],
            },
          },
          {
            statementType: "declaration",
            name: "Slot",
            value: {
              type: "struct",
              fields: [
                {
                  name: "people",
                  baseType: {
                    type: "list",
                    value: {
                      type: "struct",
                      fields: [
                        {
                          name: "name",
                          baseType: { type: "string" },
                        },
                        {
                          name: "pronouns",
                          baseType: { type: "list", value: { type: "string" } },
                        },
                      ],
                    },
                  },
                },
                {
                  name: "startTime",
                  baseType: { type: "integer" },
                },
                {
                  name: "endTime",
                  baseType: { type: "integer" },
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
                  baseType: { type: "boolean" },
                },
                {
                  name: "time",
                  baseType: {
                    type: "optional",
                    value: {
                      type: "struct",
                      fields: [
                        {
                          name: "people",
                          baseType: {
                            type: "list",
                            value: {
                              type: "struct",
                              fields: [
                                {
                                  name: "name",
                                  baseType: { type: "string" },
                                },
                                {
                                  name: "pronouns",
                                  baseType: {
                                    type: "list",
                                    value: { type: "string" },
                                  },
                                },
                              ],
                            },
                          },
                        },
                        {
                          name: "startTime",
                          baseType: { type: "integer" },
                        },
                        {
                          name: "endTime",
                          baseType: { type: "integer" },
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
            name: "ChatMessage",
            value: {
              type: "struct",
              fields: [
                {
                  name: "time",
                  baseType: { type: "integer" },
                },
                {
                  name: "content",
                  baseType: { type: "string" },
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
                  baseType: { type: "integer" },
                },
                {
                  name: "content",
                  baseType: { type: "string" },
                },
                {
                  name: "author",
                  baseType: {
                    type: "struct",
                    fields: [
                      {
                        name: "name",
                        baseType: { type: "string" },
                      },
                      {
                        name: "pronouns",
                        baseType: { type: "list", value: { type: "string" } },
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
                      baseType: {
                        type: "struct",
                        fields: [
                          {
                            name: "name",
                            baseType: { type: "string" },
                          },
                          {
                            name: "pronouns",
                            baseType: {
                              type: "list",
                              value: { type: "string" },
                            },
                          },
                        ],
                      },
                    },
                    response: {
                      name: "response",
                      baseType: {
                        type: "struct",
                        fields: [
                          {
                            name: "success",
                            baseType: { type: "boolean" },
                          },
                          {
                            name: "time",
                            baseType: {
                              type: "optional",
                              value: {
                                type: "struct",
                                fields: [
                                  {
                                    name: "people",
                                    baseType: {
                                      type: "list",
                                      value: {
                                        type: "struct",
                                        fields: [
                                          {
                                            name: "name",
                                            baseType: { type: "string" },
                                          },
                                          {
                                            name: "pronouns",
                                            baseType: {
                                              type: "list",
                                              value: { type: "string" },
                                            },
                                          },
                                        ],
                                      },
                                    },
                                  },
                                  {
                                    name: "startTime",
                                    baseType: { type: "integer" },
                                  },
                                  {
                                    name: "endTime",
                                    baseType: { type: "integer" },
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
                {
                  statementType: "declaration",
                  name: "Chat",
                  value: {
                    type: "channel",
                    name: "Chat",
                    incoming: {
                      name: "incoming",
                      baseType: {
                        type: "struct",
                        fields: [
                          {
                            name: "time",
                            baseType: { type: "integer" },
                          },
                          {
                            name: "content",
                            baseType: { type: "string" },
                          },
                        ],
                      },
                    },
                    outgoing: {
                      name: "outgoing",
                      baseType: {
                        type: "struct",
                        fields: [
                          {
                            name: "time",
                            baseType: { type: "integer" },
                          },
                          {
                            name: "content",
                            baseType: { type: "string" },
                          },
                          {
                            name: "author",
                            baseType: {
                              type: "struct",
                              fields: [
                                {
                                  name: "name",
                                  baseType: { type: "string" },
                                },
                                {
                                  name: "pronouns",
                                  baseType: {
                                    type: "list",
                                    value: { type: "string" },
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
    // TODO: Enbutterye a specific type of error
    it("fails on circular imports correctly", function () {
      chai.assert.throws(() => load("../data/resolve/circular/a.buttery"));
    });
  });

  describe("Service descriptors", function () {
    it("resolves vars in foodDelivery correctly", function () {
      const output = load("../data/resolve/fooddelivery/order.buttery");
      chai.assert.deepEqual<Object>(output, {
        path: "../data/resolve/fooddelivery/order.buttery",
        variables: [
          {
            statementType: "declaration",
            name: "RestaurantService",
            value: {
              type: "service",
              name: "RestaurantService",
              variables: [
                {
                  statementType: "declaration",
                  name: "Meal",
                  value: {
                    type: "struct",
                    fields: [
                      {
                        name: "id",
                        baseType: { type: "integer" },
                      },
                      {
                        name: "title",
                        baseType: { type: "string" },
                      },
                      {
                        name: "price",
                        baseType: { type: "integer" },
                      },
                    ],
                  },
                },
                {
                  statementType: "declaration",
                  name: "Restaurant",
                  value: {
                    type: "struct",
                    fields: [
                      {
                        name: "id",
                        baseType: { type: "integer" },
                      },
                      {
                        name: "name",
                        baseType: { type: "string" },
                      },
                      {
                        name: "address",
                        baseType: { type: "string" },
                      },
                      {
                        name: "menu",
                        baseType: {
                          type: "list",
                          value: {
                            type: "struct",
                            fields: [
                              {
                                name: "id",
                                baseType: { type: "integer" },
                              },
                              {
                                name: "title",
                                baseType: { type: "string" },
                              },
                              {
                                name: "price",
                                baseType: { type: "integer" },
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
                  name: "GetRestauraunts",
                  value: {
                    type: "rpc",
                    name: "GetRestauraunts",
                    request: {
                      name: "request",
                      baseType: { type: "boolean" },
                    },
                    response: {
                      name: "response",
                      baseType: {
                        type: "list",
                        value: {
                          type: "struct",
                          fields: [
                            {
                              name: "id",
                              baseType: { type: "integer" },
                            },
                            {
                              name: "name",
                              baseType: { type: "string" },
                            },
                            {
                              name: "address",
                              baseType: { type: "string" },
                            },
                            {
                              name: "menu",
                              baseType: {
                                type: "list",
                                value: {
                                  type: "struct",
                                  fields: [
                                    {
                                      name: "id",
                                      baseType: { type: "integer" },
                                    },
                                    {
                                      name: "title",
                                      baseType: { type: "string" },
                                    },
                                    {
                                      name: "price",
                                      baseType: { type: "integer" },
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
                },
              ],
            },
          },
          {
            statementType: "declaration",
            name: "User",
            value: {
              type: "struct",
              fields: [
                {
                  name: "id",
                  baseType: { type: "integer" },
                },
                {
                  name: "name",
                  baseType: { type: "string" },
                },
                {
                  name: "pronouns",
                  baseType: { type: "string" },
                },
              ],
            },
          },
          {
            statementType: "declaration",
            name: "OrderService",
            value: {
              type: "service",
              name: "OrderService",
              variables: [
                {
                  statementType: "declaration",
                  name: "Order",
                  value: {
                    type: "struct",
                    fields: [
                      {
                        name: "restaurantId",
                        baseType: { type: "integer" },
                      },
                      {
                        name: "mealId",
                        baseType: { type: "integer" },
                      },
                      {
                        name: "timeOfOrder",
                        baseType: { type: "integer" },
                      },
                    ],
                  },
                },
                {
                  statementType: "declaration",
                  name: "PlaceOrder",
                  value: {
                    type: "rpc",
                    name: "PlaceOrder",
                    request: {
                      name: "request",
                      baseType: {
                        type: "struct",
                        fields: [
                          {
                            name: "restaurantId",
                            baseType: { type: "integer" },
                          },
                          {
                            name: "mealId",
                            baseType: { type: "integer" },
                          },
                          {
                            name: "timeOfOrder",
                            baseType: { type: "integer" },
                          },
                        ],
                      },
                    },
                    response: {
                      name: "response",
                      baseType: { type: "boolean" },
                    },
                  },
                },
                {
                  statementType: "declaration",
                  name: "GetRestaurauntMeals",
                  value: {
                    type: "rpc",
                    name: "GetRestaurauntMeals",
                    request: {
                      name: "request",
                      baseType: { type: "null" },
                    },
                    response: {
                      name: "response",
                      baseType: {
                        type: "list",
                        value: {
                          type: "struct",
                          fields: [
                            {
                              name: "id",
                              baseType: { type: "integer" },
                            },
                            {
                              name: "title",
                              baseType: { type: "string" },
                            },
                            {
                              name: "price",
                              baseType: { type: "integer" },
                            },
                          ],
                        },
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

  describe("Namespace resolution", function () {
    it("is able to resolve references with namespaces", function () {
      const output = load("../data/resolve/namespace/ns1.buttery");
      chai.assert.equal(!!output, true);
    });
  });
});
