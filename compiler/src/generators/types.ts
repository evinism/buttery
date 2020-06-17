import { ButterFile, Representable } from "../ast";

export interface GenFile {
  fileName: string;
  content: string;
}

export type CodeGenerator = (file: ButterFile<Representable>) => GenFile[];
