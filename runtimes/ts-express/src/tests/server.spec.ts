import { PartyService } from "./fake_genfile.data";
import * as chai from "chai";
import { createSurServer } from "..";
import express from "express";

const baseApp = express();
baseApp.get("/", (req, res) => res.send("ok"));

const request = require("supertest");

describe("ts-server runtime", function () {
  const server = createSurServer(PartyService, baseApp);

  it("should accept preexisting urls", function (done) {
    request(server)
      .get("/")
      .end(function (err, res) {
        chai.assert.equal(err, null);
        chai.assert.equal(res.status, 200);
        done();
      });
  });

  it("should successfully accept valid RPCs", function (done) {
    request(server)
      .post("/__sur__/PartyService/AddToParty")
      .end(function (err, res) {
        chai.assert.equal(err, null);
        chai.assert.equal(res.status, 400);
        done();
      });
  });
});
