import { PartyServiceClient } from "../../../../sur-genfiles/main.sur.gen";

const client = new PartyServiceClient("lolol", {
  rpc: {
    requester: (url, body, config) => {
      console.log("config: " + JSON.stringify(config));
      console.log("body: " + body);
      return Promise.resolve(`{
      "success": true,
      "time": {
        "people": [{
          "name": "toby",
          "pronouns": ["he", "him"]
        }],
        "startTime": 100,
        "endTime": 110
      }
    }`);
    },
    headers: {
      PoweredBy: "sur",
    },
  },
});

client
  .AddToParty({
    name: "toby",
    pronouns: ["he", "him"],
  })
  .then((res) => {
    console.log("res: " + JSON.stringify(res));
  });
