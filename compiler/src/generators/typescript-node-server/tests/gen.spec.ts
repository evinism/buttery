import { gen } from "..";
import { generateCmd } from "../../../commands";
import { load } from "../../../pipeline";
import fs from "fs";
import * as chai from "chai";
import child_process from "child_process";

describe("Generation", function () {
  describe("Node Server", function () {
    it("should generate types", function () {
      const ast = load("../data/resolve/party/main.sur");
      const bleep = gen(ast);
      const expected = fs.readFileSync(
        "./src/generators/typescript-node-server/tests/expected.data.ts",
        "utf8"
      );
      chai.assert.equal(expected, bleep[0].content);
    });

    it.skip("should generate a semi-functioning typescript server", function () {
      generateCmd({
        target: "ts-client",
        files: ["../data/resolve/party/main.sur"],
        outputDir: "sur-genfiles",
      });
      child_process.exec(
        "ts-node ./src/generators/typescript-client/tests/driveTests.data.ts",
        (err, stdout, stderr) => {
          if (err) {
            throw err;
          }
          chai.assert.equal(
            stdout,
            `body: {"name": "toby","pronouns": ["he","him"]}
res: {"success":true,"time":{"people":[{"name":"toby","pronouns":["he","him"]}],"startTime":100,"endTime":110}}
`
          );
          chai.assert.equal(stderr, "");
        }
      );
    });
  });
});
