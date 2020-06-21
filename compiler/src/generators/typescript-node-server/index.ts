import { CodeGenerator } from "../types";
import path from "path";
import { generateNodeDeclarations } from "../typescript-shared/genNodeDecls";

export const gen: CodeGenerator = (file) => {
  const content = `import {structNode, listNode, booleanNode, integerNode, doubleNode, stringNode, nullNode} from 'buttery-node/dist/shared/nodes';

${generateNodeDeclarations(file.variables)}
`;

  const genfiles = [
    {
      fileName: `__ts__/${path.basename(file.path)}.gen.ts`,
      content,
    },
  ];

  return {
    postGenerate: (outDir) => `tsc -d ${outDir}/__ts__/* --outDir ${outDir}`,
    genfiles,
  };
};
