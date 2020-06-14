import { SurFile, Representable } from "../ast";

export interface GenFile {
  fileName: string;
  content: string;
}

export type CodeGenerator = (file: SurFile<Representable>) => GenFile[];
