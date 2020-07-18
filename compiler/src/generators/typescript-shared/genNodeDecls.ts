import {
  VariableDeclaration,
  Representable,
  VarRHS,
  Primitive,
} from "../../ast";

export const generateNodeDeclarations = (
  variables: VariableDeclaration<Representable>[]
) => {
  return variables.map(generateNodeDeclaration).filter(Boolean).join("\n");
};

const generateNodeDeclaration = (
  varDecl: VariableDeclaration<Representable>
): string => {
  const { name, value: rhs } = varDecl;
  const rhsType = genTypeForRhs(rhs);
  if (rhs.type === "service") {
    return rhsType;
  }
  return `const ${name}__node = ${rhsType};
export type ${name} = ExtractNodeType<typeof ${name}__node>;`;
};

const genTypeForRhs = (rhs: VarRHS<Representable>): string => {
  switch (rhs.type) {
    case "channel": {
      const incoming = genTypeForRepresentable(rhs.incoming.baseType);
      const outgoing = genTypeForRepresentable(rhs.outgoing.baseType);
      return `{ type: "channelNode" as "channelNode", name: "${rhs.name}" as "${rhs.name}",incoming: ${incoming}, outgoing: ${outgoing}}`;
    }
    case "rpc": {
      const request = genTypeForRepresentable(rhs.request.baseType);
      const response = genTypeForRepresentable(rhs.response.baseType);
      return `{ type: "rpcNode" as "rpcNode", name: "${rhs.name}" as "${rhs.name}", request: ${request}, response: ${response}}`;
    }
    case "struct": {
      return genTypeForRepresentable(rhs);
    }
    case "oneof": {
      return genTypeForRepresentable(rhs);
    }
    case "service": {
      const nodeDeclarations =
        "  " +
        rhs.variables
          .map((decl) => generateNodeDeclaration(decl))
          .filter(Boolean)
          .join("\n")
          .replace(/\n/g, "\n  ");
      return `export namespace ${rhs.name} {
${nodeDeclarations}
  export const name = "${rhs.name}" as "${rhs.name}"
  export const endpoints = {${rhs.variables
    .map((decl) => `${decl.name}: ${decl.name}__node`)
    .join(", ")}};
}`;
    }
  }
  throw `Unknown RHS type ${rhs.type}`;
};

const genTypeForRepresentable = (rep: Representable): string => {
  switch (rep.type) {
    case "list":
      return `listNode(${genTypeForRepresentable(rep.value)})`;
    case "map":
      // TODO: Map the representable all the way through here
      return `mapNode(${genTypeForRepresentable(rep.value)}, "${rep.key}")`;
    case "struct":
      const structString = rep.fields
        .map((field) => {
          let val = genTypeForRepresentable(field.baseType);
          return `${field.name}: ${val}`;
        })
        .join(", ");
      return `structNode({${structString}})`;
    case "oneof":
      const oneOfString = rep.fields
        .map((field) => {
          return `${field.name}: ${genTypeForRepresentable(field.baseType)}`;
        })
        .join(", ");
      return `oneOfNode({${oneOfString}})`;
    case "optional":
      return `optionalNode(${genTypeForRepresentable(rep.value)})`;
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
