import { usersTable } from "./store";
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

passport.use(
  new LocalStrategy(function (targetUserName, password, done) {
    const user = usersTable.find(
      ({ data: { username } }) => username === targetUserName
    );
    if (!user) {
      return done(null, false, { message: "Incorrect username." });
    }
    if (user.data.password !== password) {
      return done(null, false, { message: "Incorrect password." });
    }
    return done(null, user);
  })
);

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  const user = usersTable.read(id);
  if (user) {
    done(null, user);
  } else {
    done("aaaa", null);
  }
});
