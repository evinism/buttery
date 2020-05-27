import { SurpcFile, Representable } from "../ast";

export interface GenFile {
  fileName: string;
  content: string;
}

export type CodeGenerator = (file: SurpcFile<Representable>) => GenFile[];
