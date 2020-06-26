import { ButteryServer } from "buttery-node";
import { SnailBook } from "./buttery-genfiles/api.node";
import { postsTable, usersTable, commentsTable } from "./store";

const { id: bobsId } = usersTable.create({
  name: "Bob Builder",
  password: "hunter2",
});
const getUserId = () => bobsId;

const server = new ButteryServer();

let newPost = (id: string) => {};

server.implement(SnailBook, "CreatePost", (content) => {
  const userId = getUserId();
  const { id } = postsTable.create({
    content,
    authorId: userId,
    commentIds: [],
  });

  newPost(id);

  return Promise.resolve({
    id,
    content: content,
    author: {
      id: userId,
      name: usersTable.read(getUserId()).name,
    },
    comments: [],
  });
});

server.implement(SnailBook, "CreateComment", ({ content, postId }) => {
  const userId = getUserId();
  const parentPost = postsTable.read(postId);
  const { id } = commentsTable.create({
    content,
  });

  parentPost.commentIds.push(id);
  postsTable.update(postId, parentPost);

  return Promise.resolve({
    id,
    postId,
    content,
    author: {
      id: userId,
      name: usersTable.read(getUserId()).name,
    },
  });
});

server.implement(SnailBook, "Feed", (channel) => {
  newPost = (id) => {
    // wut??
    channel.fire(null);
  };
});

server.listen(8080);
