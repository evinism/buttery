import { ButteryServer } from "buttery-node";
import { SnailBook, SnailBookLoggedOut } from "./buttery-genfiles/api.node";
import { usersTable, postsTable, getUserId, commentsTable } from "./store";
import * as http from "http";
import { UserAnnotation } from "./types";

export const implement = (server: ButteryServer) => {
  server.implement(SnailBook, "CreatePost", (content) => {
    const userId = getUserId();
    const { id } = postsTable.create({
      content,
      authorId: userId,
      commentIds: [],
    });

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
    const listener = ({ id }: { id: string }) => {
      getUserId();
      const post = postsTable.read(id);
      channel.send({
        id,
        content: post.content,
        comments: [],
        author: {
          id: post.authorId,
          name: usersTable.read(post.authorId).name,
        },
      });
    };
    postsTable.pipe.listen(listener);
  });

  server.implement(SnailBookLoggedOut, "LogIn", () => Promise.resolve(true));

  server.implement(
    SnailBookLoggedOut,
    "WhoAmI",
    (_, { user }: http.IncomingMessage & { user?: UserAnnotation }) => {
      console.log(JSON.stringify(user));
      if (user) {
        return Promise.resolve({
          id: user.id,
          name: user.name,
        });
      } else {
        return Promise.resolve(null);
      }
    }
  );
};
