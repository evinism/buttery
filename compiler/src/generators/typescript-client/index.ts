import { CodeGenerator } from "../types";
import {
  VariableDeclaration,
  Representable,
  VarRHS,
  Primitive,
} from "../../ast";
import path from "path";
import fs from "fs";

export const gen: CodeGenerator = (file) => {
  const nodeDecls = file.variables.map(generateNodeDeclaration).join("\n");
  const methodDecls = file.variables
    .map(generateClassMethod)
    .filter(Boolean)
    .join("\n");

  const content = `import {SurClient, structNode, listNode, booleanNode, integerNode, doubleNode, stringNode, nullNode, buildRpcHandler, buildChannelHandler} from './sur.runtime';

${nodeDecls}

export default class Client extends SurClient {
${methodDecls}
}
`;

  return [
    {
      fileName: `${path.basename(file.path)}.gen.ts`,
      content,
    },
    {
      fileName: "sur.runtime.ts",
      content: fs.readFileSync(
        "./src/generators/typescript-client/sur.runtime.ts",
        "utf8"
      ),
    },
  ];
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

const generateNodeDeclaration = (
  varDecl: VariableDeclaration<Representable>
): string => {
  const { name, value: rhs } = varDecl;
  const rhsType = genTypeForRhs(rhs);
  return `export const ${name} = ${rhsType};`;
};

const genTypeForRhs = (rhs: VarRHS<Representable>): string => {
  switch (rhs.type) {
    case "channel": {
      const incoming = genTypeForRepresentable(rhs.incoming.baseType);
      const outgoing = genTypeForRepresentable(rhs.outgoing.baseType);
      return `{ incoming: ${incoming}, outgoing: ${outgoing}}`;
    }
    case "rpc": {
      const request = genTypeForRepresentable(rhs.request.baseType);
      const response = genTypeForRepresentable(rhs.response.baseType);
      return `{ request: ${request}, response: ${response}}`;
    }
    case "struct": {
      return genTypeForRepresentable(rhs);
    }
  }
};

const genTypeForRepresentable = (rep: Representable): string => {
  switch (rep.type) {
    case "list":
      return `listNode(${genTypeForRepresentable(rep.value)})`;
    case "map":
      const primRef = {
        type: rep.key,
      };
      const val = genTypeForRepresentable(rep.value);
      throw "Not yet implemented!";
    case "struct":
      const structString = rep.fields
        .map((fields) => {
          // Not working right now!
          const optionalStr = ""; //fields.optional ? "?" : "";
          const val = genTypeForRepresentable(fields.baseType);
          return `${fields.name}${optionalStr}: ${val}`;
        })
        .join(", ");
      return `structNode({${structString}})`;
    case Primitive.boolean:
      return "booleanNode()";
    case Primitive.double:
      return "doubleNode()";
    case Primitive.integer:
      return "integerNode()";
    case Primitive.string:
      return "stringNode()";
    case Primitive.null:
      return "nullNode()";
  }
};
