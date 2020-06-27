import React, { useState } from "react";
import { client } from "./api";

const PostForm = () => {
  const [status, setStatus] = useState<"open" | "submitting">("open");
  const [text, setText] = useState("");

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setStatus("submitting");
        await client.CreatePost(text);
        setText("");
        setStatus("open");
      }}
    >
      <input
        type="text"
        disabled={status === "submitting"}
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <input type="submit" />
    </form>
  );
};

export default PostForm;
