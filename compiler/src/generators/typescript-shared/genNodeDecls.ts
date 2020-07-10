import {
  VariableDeclaration,
  Representable,
  VarRHS,
  Primitive,
} from "../../ast";

export const generateNodeDeclarations = (
  variables: VariableDeclaration<Representable>[]
) => {
  return variables
    .map((decl) => `export ${generateNodeDeclaration(decl)}`)
    .filter(Boolean)
    .join("\n");
};

const generateNodeDeclaration = (
  varDecl: VariableDeclaration<Representable>
): string => {
  const { name, value: rhs } = varDecl;
  const rhsType = genTypeForRhs(rhs);
  if (rhs.type === "service") {
    return rhsType;
  }
  return `const ${name} = ${rhsType};`;
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
    // Right now, services will have a name conflict when vars are defined
    // inside and outside of services. This will have to change as part of
    // alpha release
    case "service": {
      const nodeDeclarations = rhs.variables
        .map((decl) => generateNodeDeclaration(decl))
        .filter(Boolean)
        .map((declStr) => "  " + declStr)
        .join("\n");

      return `const ${rhs.name} = (() => {
${nodeDeclarations}
  return {name: "${rhs.name}" as "${rhs.name}", endpoints: {${rhs.variables
        .map((decl) => decl.name)
        .join(", ")}}};
})();`;
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
      return `mapNode(${genTypeForRepresentable({
        type: rep.key,
      })}, ${genTypeForRepresentable(rep.value)})`;
    case "struct":
      const structString = rep.fields
        .map((field) => {
          let val = genTypeForRepresentable(field.baseType);
          // Do we really need this above a builtin?
          if (field.optional) {
            val = `optionalNode(${val})`;
          }
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
