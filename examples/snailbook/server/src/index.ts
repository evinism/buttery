import { ButteryServer } from "buttery-node";
import { ensureLoggedIn } from "connect-ensure-login";
import { SnailBook, SnailBookLoggedOut } from "./buttery-genfiles/api.node";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
import morgan from "morgan";
import "./config";

import { implement } from "./implementations";

const server = new ButteryServer();
server.use(morgan("common"));
server.use(cookieParser());
server.use(
  session({
    secret: "keyboard cat",
    resave: false,
    saveUninitialized: true,
  })
);
server.use(passport.initialize());
server.use(passport.session());

server.use(
  bodyParser.json({
    strict: false,
  })
);
server.use(SnailBookLoggedOut, "LogIn", passport.authenticate("local"));
server.use(SnailBook, ensureLoggedIn("/login"));
implement(server);

server.listen(8080);
