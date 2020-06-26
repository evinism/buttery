import { v4 } from "uuid";

const createFakeTable = <BaseType>() => {
  const map: {
    [id: string]: BaseType;
  } = {};

  return {
    create: (data: BaseType) => {
      const id = v4();
      map[id] = data;
      return {
        data,
        id,
      };
    },
    read: (id: string) => {
      return map[id];
    },
    update: (id: string, data: BaseType) => {
      if (!map[id]) {
        throw "No entry for id " + id;
      }
      return (map[id] = data);
    },
    delete: (id: string) => {
      if (!map[id]) {
        throw "No entry for id " + id;
      }
      delete map[id];
    },
  };
};

export const usersTable = createFakeTable<{
  name: string;
  password: string;
}>();

export const postsTable = createFakeTable<{
  content: string;
  authorId: string;
  commentIds: string[];
}>();

export const commentsTable = createFakeTable<{
  content: string;
}>();
