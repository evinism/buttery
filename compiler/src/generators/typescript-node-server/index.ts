import { CodeGenerator } from "../types";
import path from "path";
import fs from "fs";
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
    {
      fileName: "__ts__/buttery.runtime.ts",
      content:
        fs.readFileSync(
          __dirname + "/../../../ext/ts-client/nodes.ts",
          "utf8"
        ) +
        fs.readFileSync(
          __dirname + "/../../../ext/ts-client/buttery.runtime.ts",
          "utf8"
        ),
    },
  ];

  return {
    postGenerate: (outDir) => `tsc -d ${outDir}/__ts__/* --outDir ${outDir}`,
    genfiles,
  };
};
