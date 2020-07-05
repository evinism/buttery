import React, { useState, useEffect } from "react";
import "./App.css";
import LoggedIn from "./LoggedIn";
import LoggedOut from "./LoggedOut";
import { client, loggedOutClient } from "./api";

type AppState =
  | {
      status: "loading";
    }
  | {
      status: "loggedOut";
    }
  | {
      status: "loggedIn";
      feedConnection: any;
      name: string;
      username: string;
    };

function App() {
  const [state, setState] = useState<AppState>({
    status: "loading",
  });

  useEffect(() => {
    loggedOutClient.WhoAmI(null).then((res) => {
      if (res) {
        const { name, username } = res;
        const feedConnection = client.Feed();
        setState({
          status: "loggedIn",
          feedConnection,
          name,
          username,
        });
      } else {
        setState({
          status: "loggedOut",
        });
      }
    });
  }, []);

  const handleLogin = (username: string, password: string) => {
    loggedOutClient.LogIn({ username, password }).then(({ username, name }) => {
      const feedConnection = client.Feed();
      setState({
        status: "loggedIn",
        feedConnection,
        name,
        username,
      });
    });
  };

  const handleLogoutClick = () => {
    loggedOutClient.LogOut(null).then(() => {
      setState({
        status: "loggedOut",
      });
    });
  };

  const handleWhoAmI = () =>
    loggedOutClient.WhoAmI(null).then((msg) => {
      alert(JSON.stringify(msg));
    });

  return (
    <div className="App">
      {state.status === "loading" && "Loading..."}
      {state.status === "loggedOut" && (
        <button onClick={() => handleLogin("bob", "hunter2")}>Log In</button>
      )}
      {state.status === "loggedIn" && (
        <>
          <button onClick={handleLogoutClick}>Log Out</button>
          <LoggedIn feedConnection={state.feedConnection} />
        </>
      )}
    </div>
  );
}

export default App;
