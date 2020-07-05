import React, { useState } from "react";
import "./App.css";
import LoggedIn from "./LoggedIn";
import LoggedOut from "./LoggedOut";
import { client, loggedOutClient } from "./api";

function App() {
  const [user, setUser] = useState<{
    feedConnection: any;
    name: string;
    username: string;
  } | null>();

  const handleLogin = (username: string, password: string) => {
    loggedOutClient.LogIn({ username, password }).then(({ username, name }) => {
      const feedConnection = client.Feed();
      setUser({
        feedConnection,
        name,
        username,
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
