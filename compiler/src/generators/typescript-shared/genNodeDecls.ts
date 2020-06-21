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
  return `export const ${name} = ${rhsType};`;
};

const genTypeForRhs = (rhs: VarRHS<Representable>): string => {
  switch (rhs.type) {
    case "channel": {
      const incoming = genTypeForRepresentable(rhs.incoming.baseType);
      const outgoing = genTypeForRepresentable(rhs.outgoing.baseType);
      return `{ type: "channelNode" as "channelNode", name: "${rhs.name}",incoming: ${incoming}, outgoing: ${outgoing}}`;
    }
    case "rpc": {
      const request = genTypeForRepresentable(rhs.request.baseType);
      const response = genTypeForRepresentable(rhs.response.baseType);
      return `{ type: "rpcNode" as "rpcNode", name: "${rhs.name}", request: ${request}, response: ${response}}`;
    }
    case "struct": {
      return genTypeForRepresentable(rhs);
    }
    // Right now, services will have a name conflict when vars are defined
    // inside and outside of services. This will have to change as part of
    // alpha release
    case "service": {
      return (
        rhs.variables.map(generateNodeDeclaration).filter(Boolean).join("\n") +
        `\nexport const ${rhs.name} = {name: "${
          rhs.name
        }", endpoints: {${rhs.variables.map((decl) => decl.name).join(", ")}}};`
      );
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
