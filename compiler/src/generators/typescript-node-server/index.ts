import { CodeGenerator } from "../types";
import path from "path";
import { generateNodeDeclarations } from "../typescript-shared/genNodeDecls";

export const gen: CodeGenerator = (file) => {
  const outFileName =
    path.basename(file.path).replace(/\.butt(ery)?$/, "") + ".node.ts";
  const content = `import {structNode, listNode, booleanNode, integerNode, doubleNode, stringNode, nullNode, optionalNode, oneOfNode} from 'buttery-node/dist/shared/nodes';

${generateNodeDeclarations(file.variables)}
`;

  const genfiles = [
    {
      fileName: `__ts__/${outFileName}`,
      content,
    },
  ];

  return {
    postGenerate: (outDir) =>
      `tsc -d ${outDir}/__ts__/* --outDir ${outDir} --strict --types node`,
    genfiles,
  };
};
