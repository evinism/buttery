import { CodeGenerator } from "../types";
import {
  VariableDeclaration,
  Representable,
  VarRHS,
  Primitive,
} from "../../ast";

export const gen: CodeGenerator = (file) => {
  const typeDecls = file.variables.map(generateTypeDeclaration).join("\n");

  const content = typeDecls;

  return [
    {
      fileName: file.path,
      content,
    },
  ];
};

const generateTypeDeclaration = (
  varDecl: VariableDeclaration<Representable>
): string => {
  const { name, value: rhs } = varDecl;
  const rhsType = genTypeForRhs(rhs);
  return `type ${name} = ${rhsType};`;
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
  }
};
