import React, { useState } from "react";
import "./App.css";
import { SnailBookClient } from "./buttery-genfiles/__ts__/api.browser";

const client = new SnailBookClient("http://localhost:3000");
// silly workaround for proxy in CRA not working properly
const newsFeed = new SnailBookClient("http://localhost:8080").Feed();

function App() {
  const [feed, setFeed] = useState<
    {
      content: string;
      author: string;
    }[]
  >([]);

  newsFeed.listen(({ content, author: { name } }) => {
    setFeed(feed.concat({ content, author: name }));
  });

  return (
    <div className="App">
      <header className="App-header">
        <button onClick={() => client.CreatePost("hello")}></button>
      </header>
      {feed.map(({ content, author }) => (
        <div>
          "{content}" <br />-{author}
        </div>
      ))}
    </div>
  );
}

export default App;
