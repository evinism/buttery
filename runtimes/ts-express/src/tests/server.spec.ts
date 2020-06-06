import { PartyService } from "./fake_genfile.data";
import { attachSur } from "../index";
import * as http from "http";
import * as chai from "chai";
import express from "express";

const app = express();
app.get("/", (req, res) => res.send("ok"));

const request = require("supertest");

describe("ts-server runtime", function () {
  const server = http.createServer(app);
  attachSur(server, PartyService);

  it("should accept preexisting urls", function (done) {
    request(server)
      .get("/")
      //.post("__sur__/PartyService/AddToParty")
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
        chai.assert.equal(res.status, 200);
        done();
      });
  });
});
