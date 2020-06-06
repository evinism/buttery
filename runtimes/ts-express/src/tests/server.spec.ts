import { PartyService } from "./fake_genfile.data";
import * as chai from "chai";
import { SurServer } from "..";
import express from "express";

const baseApp = express();
baseApp.get("/", (req, res) => res.send("ok"));

const request = require("supertest");

describe("ts-server runtime", function () {
  const surServer = new SurServer(PartyService);
  surServer.wrapListener(baseApp);
  surServer.implement("Chat", () => {});
  surServer.implement("AddToParty", (z) => {
    return Promise.resolve({
      success: true,
      time: {
        people: [],
        startTime: 0,
        endTime: 0,
      },
    });
  });
  const server = surServer.createHttpServer();

  it("should accept preexisting urls", function (done) {
    request(server)
      .get("/")
      .end(function (err, res) {
        chai.assert.equal(err, null);
        chai.assert.equal(res.status, 200);
        done();
      });
  });

  it("should successfully reject invalid RPCs", function (done) {
    request(server)
      .post("/__sur__/PartyService/AddToParty")
      .end(function (err, res) {
        chai.assert.equal(err, null);
        chai.assert.equal(res.status, 400);
        done();
      });
  });

  it("should successfully accept and handle valid RPCs", function (done) {
    request(server)
      .post("/__sur__/PartyService/AddToParty")
      .send({ name: "john", pronouns: [] })
      .end(function (err, res) {
        chai.assert.equal(err, null);
        chai.assert.equal(res.status, 200);
        chai.assert.deepEqual(res.body, {
          success: true,
          time: { people: [], startTime: 0, endTime: 0 },
        });
        done();
      });
  });
});
