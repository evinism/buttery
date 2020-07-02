import React, { useState, useEffect } from "react";
import PostForm from "./PostForm";

const LoggedIn = ({ feedConnection: newsFeed }: { feedConnection: any }) => {
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
    <>
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
    </>
  );
};

export default LoggedIn;
