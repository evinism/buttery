import { ButteryServer } from "buttery-node";
import { ensureLoggedIn } from "connect-ensure-login";
import "./config";
//import session = require("express-session");
import passport = require("passport");
import { implement } from "./implementations";

const server = new ButteryServer();
server.use(passport.initialize());
server.use(ensureLoggedIn("/login"));
server.use(passport.authenticate("local"));
implement(server);

server.listen(8080);
