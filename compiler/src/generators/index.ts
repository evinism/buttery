import { CodeGenerator } from "./types";
import { gen as tsClientGen } from "./typescript-client";
import { gen as tsNodeServerGen } from "./typescript-node-server";

export const generators: { [key: string]: CodeGenerator } = {
  browser: tsClientGen,
  "node-server": tsNodeServerGen,
};
