import { ButteryServer } from "buttery-node";
import { ensureLoggedIn } from "connect-ensure-login";
import { SnailBook, SnailBookLoggedOut } from "./buttery-genfiles/api.node";
import bodyParser = require("body-parser");
import "./config";
import cookieParser = require("cookie-parser");
import session = require("express-session");
import passport = require("passport");
import { implement } from "./implementations";

const server = new ButteryServer();
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

// Annoying workaround that bodyParser doesn't work w/ bare strings, so i relegate it to this particular path
server.use(SnailBookLoggedOut, "LogIn" as "LogIn", bodyParser.json());
server.use(
  SnailBookLoggedOut,
  "LogIn" as "LogIn",
  passport.authenticate("local")
);
server.use(SnailBook, ensureLoggedIn("/login"));
implement(server);

server.listen(8080);
