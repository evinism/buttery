import React, { useState, useEffect } from "react";
import "./App.css";
import { client } from "./api";
import PostForm from "./PostForm";

const newsFeed = client.Feed();

function App() {
  const [feed, setFeed] = useState<
    {
      content: string;
      author: string;
    }[]
  >([]);
  useEffect(() => {
    const handlerFn = ({
      content,
      author: { name: author },
    }: {
      content: string;
      author: { name: string };
    }) => {
      setFeed((feed) =>
        feed.concat({
          content,
          author,
        })
      );
    };
    newsFeed.listen(handlerFn);
    return () => {
      newsFeed.unlisten(handlerFn);
    };
  });

  return (
    <div className="App">
      <header className="App-header">
        SnailBook! The cool place for Snails to hang out
      </header>
      <div>
        <PostForm />
      </div>
      <article>
        {feed.map(({ content, author }) => (
          <div className="App-post">
            "{content}" <br />-{author}
          </div>
        ))}
      </article>
    </div>
  );
}

export default App;
