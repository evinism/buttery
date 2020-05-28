import { CodeGenerator } from "../types";
import {
  VariableDeclaration,
  Representable,
  VarRHS,
  Primitive,
} from "../../ast";
import path from "path";

export const gen: CodeGenerator = (file) => {
  const typeDecls = file.variables.map(generateTypeDeclaration).join("\n");
  const methodDecls = file.variables
    .map(generateClassMethod)
    .filter(Boolean)
    .join("\n");

  const content = `import SurClient from 'surpc-client';

${typeDecls}

class Client extends SurClient {
${methodDecls}
}
`;

  return [
    {
      fileName: `${path.basename(file.path)}.ts`,
      content,
    },
  ];
};

const generateClassMethod = (decl: VariableDeclaration<Representable>) => {
  // Lol this should be
  if (decl.value.type === "struct") {
    return "";
  }
  const rpcOrChannel = decl.value;
  if (rpcOrChannel.type === "rpc") {
    const reqType = genTypeForRepresentable(rpcOrChannel.request.baseType);
    const resType = genTypeForRepresentable(rpcOrChannel.response.baseType);
    return `  ${decl.name}(data: ${reqType}): (${resType}){
    this.request(data);
  }`;
  }
};

const generateTypeDeclaration = (
  varDecl: VariableDeclaration<Representable>
): string => {
  const { name, value: rhs } = varDecl;
  const rhsType = genTypeForRhs(rhs);
  return `export type ${name} = ${rhsType};`;
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
      return `Array<${genTypeForRepresentable(rep.value)}>`;
    case "map":
      const primRef = {
        type: rep.key,
      };
      const val = genTypeForRepresentable(rep.value);
      return `{[key: ${genTypeForRepresentable(primRef)}]: ${val}}`;
    case "struct":
      const structString = rep.fields
        .map((fields) => {
          const optionalStr = fields.optional ? "?" : "";
          const val = genTypeForRepresentable(fields.baseType);
          return `${fields.name}${optionalStr}: ${val}`;
        })
        .join(", ");
      return `{${structString}}`;
    case Primitive.boolean:
      return "boolean";
    case Primitive.double:
      return "number";
    case Primitive.integer:
      return "number";
    case Primitive.string:
      return "string";
    case Primitive.null:
      return "null";
  }
};
