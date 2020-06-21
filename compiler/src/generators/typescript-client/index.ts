import { CodeGenerator } from "../types";
import { VariableDeclaration, Representable } from "../../ast";
import path from "path";
import fs from "fs";
import { generateNodeDeclarations } from "../typescript-shared/genNodeDecls";

export const gen: CodeGenerator = (file) => {
  const classDecls = file.variables
    .map(generateServiceClass)
    .filter(Boolean)
    .join("\n");

  const content = `import {ButteryClient, structNode, listNode, booleanNode, integerNode, doubleNode, stringNode, nullNode, buildRpcHandler, buildChannelHandler, ButteryChannelConnection} from './buttery.runtime';

${generateNodeDeclarations(file.variables)}

${classDecls}
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

const generateServiceClass = (decl: VariableDeclaration<Representable>) => {
  const value = decl.value;
  if (!(value.type === "service")) {
    return "";
  }
  const methodDecls = value.variables
    .map(generateClassMethod)
    .filter(Boolean)
    .join("\n");
  return `export class ${value.name}Client extends ButteryClient {
  serviceName = "${value.name}";
${methodDecls}
}
`;
};

const generateClassMethod = (decl: VariableDeclaration<Representable>) => {
  // Lol this should be better.
  if (decl.value.type === "struct") {
    return "";
  }
  const rpcOrChannel = decl.value;
  if (rpcOrChannel.type === "rpc") {
    return `  ${decl.name} = buildRpcHandler("${decl.name}", ${rpcOrChannel.name}.request, ${rpcOrChannel.name}.response);`;
  }
  if (rpcOrChannel.type === "channel") {
    return `  ${decl.name} = buildChannelHandler("${decl.name}", ${rpcOrChannel.name}.incoming, ${rpcOrChannel.name}.outgoing);`;
  }
};
