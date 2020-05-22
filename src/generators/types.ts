import { SurpcFile, Representable } from "../ast";

interface GenFile {
  fileName: string;
  content: string;
}

export type CodeGenerator = (file: SurpcFile<Representable>) => GenFile[];
