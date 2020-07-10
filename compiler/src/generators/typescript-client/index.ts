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

  // Remove endname
  const outFileName =
    path.basename(file.path).replace(/\.butt(ery)?$/, "") + ".browser.ts";

  const content = `import {ButteryClient, structNode, listNode, booleanNode, integerNode, doubleNode, stringNode, nullNode, optionalNode, oneOfNode, mapNode, buildRpcHandler, buildChannelHandler, ButteryChannelConnection} from './buttery.runtime';

${generateNodeDeclarations(file.variables)}

${classDecls}
`;

  const genfiles = [
    {
      fileName: `__ts__/${outFileName}`,
      content,
    },
    {
      fileName: "__ts__/buttery.runtime.ts",
      content:
        fs.readFileSync(__dirname + "/../../ext/ts-client/nodes.ts", "utf8") +
        fs.readFileSync(
          __dirname + "/../../ext/ts-client/buttery.runtime.ts",
          "utf8"
        ),
    },
  ];

  return {
    postGenerate: (outDir) =>
      `tsc -d ${outDir}/__ts__/* --outDir ${outDir} --strict --types node`,
    genfiles,
  };
};

const generateServiceClass = (decl: VariableDeclaration<Representable>) => {
  const value = decl.value;
  if (!(value.type === "service")) {
    return "";
  }
  const methodDecls = value.variables
    .map((variable) => generateClassMethod(variable, value.name))
    .filter(Boolean)
    .join("\n");
  return `export class ${value.name}Client extends ButteryClient {
  serviceName = "${value.name}";
${methodDecls}
}
`;
};

const generateClassMethod = (
  decl: VariableDeclaration<Representable>,
  serviceName: string
) => {
  // Lol this should be better.
  if (decl.value.type === "struct") {
    return "";
  }
  const rpcOrChannel = decl.value;
  if (rpcOrChannel.type === "rpc") {
    return `  ${decl.name} = buildRpcHandler("${decl.name}", ${serviceName}.endpoints.${rpcOrChannel.name}.request, ${serviceName}.endpoints.${rpcOrChannel.name}.response);`;
  }
  if (rpcOrChannel.type === "channel") {
    return `  ${decl.name} = buildChannelHandler("${decl.name}", ${serviceName}.endpoints.${rpcOrChannel.name}.incoming, ${serviceName}.endpoints.${rpcOrChannel.name}.outgoing);`;
  }
};
