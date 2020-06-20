import { ButteryFile, Representable } from "../ast";

export interface GenFile {
  fileName: string;
  content: string;
}

export type CodeGenerator = (
  file: ButteryFile<Representable>
) => {
  postGenerate?: (surFilePath: string) => string;
  genfiles: GenFile[];
};
