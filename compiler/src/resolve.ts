import fs from "fs";
import { isRight } from "fp-ts/lib/Either";
import {
  SurpcFile,
  Representable,
  Reference,
  Primitive,
  VariableDeclaration,
  VarRHS,
} from "./ast";
import path from "path";

import { badParse } from "./parser";

export function load(
  file: string,
  loadedFiles: string[] = []
): SurpcFile<Representable> {
  if (loadedFiles.includes(file)) {
    throw new Error("Cycle detected between files!");
  }
  const parseResult = badParse(fs.readFileSync(file, "utf8"), file);
  return resolve(parseResult);
}

function resolveRef(
  { ref, typeArgs, namespace }: Reference,
  context: SurpcFile<Reference>,
  prevReffedVars: string[],
  namespaceContext?: string
): Representable {
  const primitive = Primitive[ref] as Primitive | undefined;
  if (primitive) {
    return {
      type: primitive,
    };
  }

  // Garbage way of doing builtins
  if (ref === "List") {
    if (typeArgs.length !== 1) {
      throw `Wrong number of type arguments for a List (expected 1, got ${typeArgs.length})`;
    }
    return {
      type: "list",
      value: resolveRef(typeArgs[0], context, prevReffedVars),
    };
  }
  if (ref === "Map") {
    if (typeArgs.length !== 2) {
      throw `Wrong number of type arguments for a Map (expected 2, got ${typeArgs.length})`;
    }
    const mapKey = Primitive[typeArgs[0].ref] as Primitive | undefined;
    if (!mapKey) {
      throw "Can only use a primitive for map's first type arg";
    }
    return {
      type: "map",
      key: mapKey,
      value: resolveRef(typeArgs[1], context, prevReffedVars),
    };
  }

  // Look in imports! (should move external to this function.)
  const importStatement = context.imports.find((statement) =>
    statement.imports.includes(ref)
  );

  let resolvedDecl: VariableDeclaration<Representable>;
  if (importStatement) {
    const loadPath = path.resolve(
      path.dirname(context.path),
      importStatement.path
    );
    const file = load(loadPath);
    const resolvedVar = file.variables.find((v) => v.name === ref);
    if (!resolvedVar) {
      throw new Error(`File ${loadPath} does not define ${ref}`);
    }
    resolvedDecl = resolvedVar;
  } else {
    let decl: VariableDeclaration<Reference> | undefined;

    // First try to resolve via looking in a namespace
    if (namespace) {
      const nsRef = context.variables.find(({ name }) => name === namespace);
      if (nsRef) {
        if (nsRef.value.type !== "service") {
          throw new Error(
            `Attempted to dereference a ${nsRef.value.type}. Dot syntax only works on services`
          );
        }
        decl = nsRef.value.variables.find(({ name }) => name === ref);
      }
    }

    // Then try to resolve via looking up within the current namespace
    if (!decl && namespaceContext) {
      const nsRef = context.variables.find(
        ({ name }) => name === namespaceContext
      );
      if (nsRef && nsRef.value.type === "service") {
        decl = nsRef.value.variables.find(({ name }) => name === ref);
      } else {
        throw new Error(
          "Somehow current namespace context didnt refer to a service"
        );
      }
    }

    // Then try to find it outside of the namespace
    if (!decl) {
      decl = context.variables.find(({ name }) => name === ref);
    }

    if (!decl) {
      throw new Error(`Unresolved reference ${ref}`);
    }

    resolvedDecl = resolveDecl(decl, context, prevReffedVars);
  }

  if (resolvedDecl.value.type === "channel") {
    throw new Error("Channels cannot be referenced as types");
  }
  if (resolvedDecl.value.type === "rpc") {
    throw new Error("Rpcs cannot be referenced as types");
  }
  if (resolvedDecl.value.type === "service") {
    throw new Error("Services cannot be referenced as types");
  }
  return resolvedDecl.value;
}

function resolveDecl(
  decl: VariableDeclaration<Reference>,
  context: SurpcFile<Reference>,
  prevReffedVars: string[],
  currentNamespace?: string // What namespace are we currently in?
): VariableDeclaration<Representable> {
  if (prevReffedVars.includes(decl.name)) {
    throw new Error("Cycle detected in var!");
  }
  const nextReffedVars = prevReffedVars.slice();
  nextReffedVars.push(decl.name);

  const qResolveRev = (ref: Reference) =>
    resolveRef(ref, context, nextReffedVars, currentNamespace);

  let newVal: VarRHS<Representable>;
  if (decl.value.type === "channel") {
    const { type, name, incoming, outgoing } = decl.value;
    newVal = {
      type,
      name,
      incoming: {
        name: incoming.name,
        optional: incoming.optional,
        baseType: qResolveRev(incoming.baseType),
      },
      outgoing: {
        name: outgoing.name,
        optional: outgoing.optional,
        baseType: qResolveRev(outgoing.baseType),
      },
    };
  } else if (decl.value.type === "rpc") {
    const { type, name, request, response } = decl.value;
    newVal = {
      type,
      name,
      request: {
        name: request.name,
        optional: request.optional,
        baseType: qResolveRev(request.baseType),
      },
      response: {
        name: response.name,
        optional: response.optional,
        baseType: qResolveRev(response.baseType),
      },
    };
  } else if (decl.value.type === "service") {
    const { type, name, variables } = decl.value;

    newVal = {
      type,
      name,
      variables: variables.map((ref: VariableDeclaration<Reference>) =>
        resolveDecl(ref, context, nextReffedVars, name)
      ),
    };
  } else {
    const { type, fields } = decl.value;
    newVal = {
      type,
      fields: fields.map(({ name, optional, baseType }) => ({
        name,
        optional,
        baseType: qResolveRev(baseType),
      })),
    };
  }

  return {
    statementType: "declaration",
    name: decl.name,
    value: newVal,
  };
}

export function resolve(
  refFile: SurpcFile<Reference>
): SurpcFile<Representable> {
  // circ reference betw. files solved in load()
  // so now we just have to solve it here.
  const newVars = refFile.variables.map((variable) =>
    resolveDecl(variable, refFile, [])
  );

  return {
    path: refFile.path,
    imports: [],
    variables: newVars,
  };
}
