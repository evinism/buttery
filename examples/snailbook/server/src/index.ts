import { ButteryServer } from "buttery-node";
import { ensureLoggedIn } from "connect-ensure-login";
import * as app from "express/lib/application";
import * as init from "express/lib/middleware/init";
import "./config";
//import session = require("express-session");
import passport = require("passport");
import { implement } from "./implementations";

const server = new ButteryServer();

const initMiddleware = init.init(app);

server.use((req, res, next) => {
  console.log(req, res, next);
  initMiddleware(req, res, next);
});
server.use(passport.initialize());
server.use(ensureLoggedIn("/login"));
server.use(passport.authenticate("local"));
implement(server);

server.listen(8080);
