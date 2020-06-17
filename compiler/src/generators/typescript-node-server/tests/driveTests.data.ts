import { PartyServiceClient } from "../../../../butter-genfiles/main.butter.gen";

const client = new PartyServiceClient("lolol", {
  requester: (url, body) => {
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
});

client
  .AddToParty({
    name: "toby",
    pronouns: ["he", "him"],
  })
  .then((res) => {
    console.log("res: " + JSON.stringify(res));
  });
