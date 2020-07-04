import React, { useState } from "react";
import "./App.css";
import LoggedIn from "./LoggedIn";
import LoggedOut from "./LoggedOut";
import { client, loggedOutClient } from "./api";

function App() {
  const [user, setUser] = useState<
    | {
        feedConnection: any;
        name: string;
      }
    | undefined
  >();

  const handleLogin = (username: string, password: string) => {
    loggedOutClient.LogIn({ username, password }).then(() => {
      const feedConnection = client.Feed();
      setUser({
        feedConnection,
        name: "lolwhut",
      });
    });
  };
  const handleWhoAmI = () =>
    loggedOutClient.WhoAmI(null).then((msg) => {
      alert(JSON.stringify(msg));
    });

  return (
    <div className="App">
      {<button onClick={handleWhoAmI}>Who am I?</button>}
      {!user && <button onClick={() => handleLogin("bob", "hunter2")} />}
      {user && <LoggedIn feedConnection={user.feedConnection} />}
    </div>
  );
}

export default App;
