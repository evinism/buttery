import { v4 } from "uuid";
import { Pipe } from "./util";

const createFakeTable = <BaseType>() => {
  type Record = {
    id: string;
    data: BaseType;
  };
  const map: {
    [id: string]: BaseType;
  } = {};

  const pipe = new Pipe<Record>();

  return {
    find: (pred: (record: Record) => boolean) => {
      return Object.entries(map)
        .map(([id, data]) => ({ id, data }))
        .find(pred);
    },
    create: (data: BaseType) => {
      const id = v4();
      map[id] = data;
      const retVal = {
        data,
        id,
      };
      pipe.fire(retVal);
      return retVal;
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
    pipe,
  };
};

export const usersTable = createFakeTable<{
  username: string;
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

const { id: bobsId } = usersTable.create({
  username: "bob",
  name: "Bob Builder",
  password: "hunter2",
});

export const getUserId = () => bobsId;
