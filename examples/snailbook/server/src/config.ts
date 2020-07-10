import { usersTable } from "./store";
import { UserAnnotation } from "./types";

import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

passport.use(
  new LocalStrategy(function (targetUserName: string, password: string, done) {
    const user = usersTable.find(
      ({ data: { username } }) => username === targetUserName
    );
    if (!user) {
      return done(null, false, { message: "Incorrect username." });
    }
    if (user.data.password !== password) {
      return done(null, false, { message: "Incorrect password." });
    }
    return done(null, {
      id: user.id,
      ...user.data,
    });
  })
);

passport.serializeUser(function (user: any, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id: string, done) {
  const user: UserAnnotation = {
    id,
    ...usersTable.read(id),
  };
  if (user) {
    done(null, user);
  } else {
    done("aaaa", null);
  }
});
