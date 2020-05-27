import { CodeGenerator } from "./types";
import { gen as tsClientGen } from "./typescript-client";

export const generators: { [key: string]: CodeGenerator } = {
  "ts-client": tsClientGen,
};
