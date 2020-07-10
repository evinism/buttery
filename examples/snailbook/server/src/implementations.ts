import { ButteryServer } from "buttery-node";
import { SnailBook, SnailBookLoggedOut } from "./buttery-genfiles/api.node";
import { usersTable, postsTable, getUserId, commentsTable } from "./store";
import * as http from "http";
import { UserAnnotation, LoggedInRequest } from "./types";

const ensureLoggedIn = <T, R>(
  handler: (data: T, request: LoggedInRequest) => R
) => (
  data: T,
  request: http.IncomingMessage & { user?: UserAnnotation | null }
): R => {
  if (!request.user) {
    throw "Not Logged In!!";
  }
  return handler(data, request as LoggedInRequest);
};

export const implement = (server: ButteryServer) => {
  server.implement(
    SnailBook,
    "CreatePost",
    ensureLoggedIn((content, { user: { id: userId } }: LoggedInRequest) => {
      const { id } = postsTable.create({
        content,
        authorId: userId,
        commentIds: [],
      });

      const { name, username } = usersTable.read(userId);

      return Promise.resolve({
        id,
        content: content,
        author: {
          id: userId,
          name,
          username,
        },
        comments: [],
      });
    })
  );

  server.implement(
    SnailBook,
    "CreateComment",
    ensureLoggedIn(
      (
        { content, postId },
        { user: { id: userId, name, username } }: LoggedInRequest
      ) => {
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
            name,
            username,
          },
        });
      }
    )
  );

  server.implement(SnailBook, "Feed", (channel) => {
    const postsListener = ({ id }: { id: string }) => {
      getUserId();
      const post = postsTable.read(id);
      const { name, username } = usersTable.read(post.authorId);
      channel.send({
        tag: "post",
        data: {
          id,
          content: post.content,
          comments: [],
          author: {
            id: post.authorId,
            name,
            username,
          },
        },
      });
    };
    postsTable.pipe.listen(postsListener);
  });

  server.implement(
    SnailBookLoggedOut,
    "LogIn",
    (_, { user }: http.IncomingMessage & { user?: UserAnnotation | null }) => {
      if (!user) {
        throw "Not logged in!";
      }
      const { name, id, username } = user;
      return Promise.resolve({
        name,
        id,
        username,
      });
    }
  );

  server.implement(
    SnailBookLoggedOut,
    "WhoAmI",
    (_, { user }: http.IncomingMessage & { user?: UserAnnotation | null }) => {
      if (user) {
        return Promise.resolve({
          id: user.id,
          name: user.name,
          username: user.username,
        });
      } else {
        return Promise.resolve(null);
      }
    }
  );

  server.implement(SnailBookLoggedOut, "LogOut", (_, req) => {
    (req as any).logout();
    return Promise.resolve(null);
  });
};
