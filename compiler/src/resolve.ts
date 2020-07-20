import {
  ButteryFile,
  Representable,
  Reference,
  Primitive,
  VariableDeclaration,
  VarRHS,
} from "./ast";
import path from "path";

const validMapKey = (key: Primitive) =>
  [
    Primitive.boolean,
    Primitive.double,
    Primitive.integer,
    Primitive.string,
  ].includes(key);

type LoadFn = (file: string) => ButteryFile<Reference>;

/* START REFACTOR SHIM FOR SWITCHING TO LEXICAL SCOPE TRACKING */
type ResolveFn = (
  { ref, typeArgs }: Reference,
  context: ButteryFile<Reference>,
  prevReffedVars: string[],
  prevReffedFiles: string[],
  load: LoadFn,
  namespaceContext?: string
) => Representable;

// Refactoring to shim in basic lexical scope whatever.
const ListEntry: ResolveFn = (
  { typeArgs },
  context,
  prevReffedVars,
  prevReffedFiles,
  load,
  namespaceContext
) => {
  if (typeArgs.length !== 1) {
    throw `Wrong number of type arguments for a List (expected 1, got ${typeArgs.length})`;
  }
  return {
    type: "list",
    value: resolveRef(
      typeArgs[0],
      context,
      prevReffedVars,
      prevReffedFiles,
      load,
      namespaceContext
    ),
  };
};
const MapEntry: ResolveFn = (
  { typeArgs },
  context,
  prevReffedVars,
  prevReffedFiles,
  load,
  namespaceContext
) => {
  if (typeArgs.length !== 2) {
    throw `Wrong number of type arguments for a Map (expected 2, got ${typeArgs.length})`;
  }

  const mapKey = typeArgs[0].ref as Primitive;
  const isValidMapKey = validMapKey(mapKey);
  if (!isValidMapKey) {
    throw "Can only use one of {string, double, integer, boolean} as a key for map";
  }
  return {
    type: "map",
    key: mapKey,
    value: resolveRef(
      typeArgs[1],
      context,
      prevReffedVars,
      prevReffedFiles,
      load,
      namespaceContext
    ),
  };
};

const OptionalEntry: ResolveFn = (
  { typeArgs },
  context,
  prevReffedVars,
  prevReffedFiles,
  load,
  namespaceContext
) => {
  if (typeArgs.length !== 1) {
    throw `Wrong number of type arguments for a Optional (expected 1, got ${typeArgs.length})`;
  }

  return {
    type: "optional",
    value: resolveRef(
      typeArgs[0],
      context,
      prevReffedVars,
      prevReffedFiles,
      load,
      namespaceContext
    ),
  };
};

type LexicalScope = { [key: string]: ResolveFn }[];

const defaultLexicalScope: { [key: string]: ResolveFn }[] = [
  {
    boolean: () => ({ type: Primitive.boolean }),
    integer: () => ({ type: Primitive.integer }),
    double: () => ({ type: Primitive.double }),
    null: () => ({ type: Primitive.null }),
    string: () => ({ type: Primitive.string }),
  },
  {
    List: ListEntry,
    Map: MapEntry,
    Optional: OptionalEntry,
  },
];

const getRepresentableFromVar = (
  resolvedDecl: VariableDeclaration<Representable>
): Representable => {
  if (resolvedDecl.value.type === "channel") {
    throw new Error("Channels cannot be referenced as types");
  }
  if (resolvedDecl.value.type === "rpc") {
    throw new Error("Rpcs cannot be referenced as types");
  }
  if (resolvedDecl.value.type === "service") {
    throw new Error("Services cannot be referenced as types");
  }
  if (resolvedDecl.value.type === "import") {
    throw new Error("Imports cannot be referenced as types");
  }
  return resolvedDecl.value;
};

// Lookup by lexical scope!!!
function getInLexicalScope(
  lexicalScope: LexicalScope,
  referenceObj: Reference,
  context: ButteryFile<Reference>,
  prevReffedVars: string[],
  prevReffedFiles: string[],
  load: LoadFn,
  namespaceContext?: string
): Representable | undefined {
  const resolveFn = lexicalScope.reduceRight(
    (acc: ResolveFn | undefined, cur) => acc || cur[referenceObj.ref],
    undefined
  );
  if (!resolveFn) {
    return undefined;
  }
  return resolveFn(
    referenceObj,
    context,
    prevReffedVars,
    prevReffedFiles,
    load,
    namespaceContext
  );
}

function resolveRef(
  refObject: Reference,
  context: ButteryFile<Reference>,
  prevReffedVars: string[],
  prevReffedFiles: string[],
  load: LoadFn,
  namespaceContext?: string
): Representable {
  const { ref, namespace } = refObject;

  // Builtins!
  const maybeBuiltin = getInLexicalScope(
    defaultLexicalScope,
    refObject,
    context,
    prevReffedVars,
    prevReffedFiles,
    load,
    namespaceContext
  );

  if (maybeBuiltin) {
    return maybeBuiltin;
  }

  let decl: VariableDeclaration<Reference> | undefined;

  // First try to resolve via looking in a namespace
  if (namespace) {
    const nsRef = context.variables.find(({ name }) => name === namespace);
    if (nsRef) {
      let value = nsRef.value;

      // TODO: The fact that this goes through a different resolve path is abhorrent
      // Should be one of the many post-alpha refactors
      if (value.type === "import") {
        const importName = value.import;
        const loadPath = path.resolve(path.dirname(context.path), value.path);
        if (prevReffedFiles.includes(loadPath)) {
          throw new Error(`Circular reference in files detected: ${loadPath}`);
        }
        const tmp = load(loadPath).variables.find(
          (decl) => decl.name === importName
        );
        if (!tmp) {
          throw new Error(
            `Tried to dereference nonexistent import ${value.type} from ${value.path}`
          );
        }
        // overwrite what namespace we're actually working in, if it's an import
        // holy hell this is bad and needs refactoring
        namespaceContext = importName;
        value = tmp.value;
      }

      if (value.type !== "service") {
        throw new Error(
          `Attempted to dereference a ${value.type}. Dot syntax only works on services`
        );
      }
      decl = value.variables.find(({ name }) => name === ref);
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

  return getRepresentableFromVar(
    resolveDecl(
      decl,
      context,
      prevReffedVars,
      prevReffedFiles,
      load,
      namespaceContext
    )
  );
}

function resolveDecl(
  decl: VariableDeclaration<Reference>,
  context: ButteryFile<Reference>,
  prevReffedVars: string[],
  prevReffedFiles: string[],
  load: LoadFn,
  currentNamespace?: string // What namespace are we currently in?
): VariableDeclaration<Representable> {
  const scopedName = currentNamespace
    ? `${currentNamespace}.${decl.name}`
    : decl.name;
  if (prevReffedVars.includes(scopedName)) {
    throw new Error("Cycle detected in var! " + scopedName);
  }
  const nextReffedVars = prevReffedVars.slice();
  nextReffedVars.push(scopedName);

  const qResolveRev = (ref: Reference) =>
    resolveRef(
      ref,
      context,
      nextReffedVars,
      prevReffedFiles,
      load,
      currentNamespace
    );

  let newVal: VarRHS<Representable>;
  if (decl.value.type === "channel") {
    const { type, name, incoming, outgoing } = decl.value;
    newVal = {
      type,
      name,
      incoming: {
        name: incoming.name,
        baseType: qResolveRev(incoming.baseType),
      },
      outgoing: {
        name: outgoing.name,
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
        baseType: qResolveRev(request.baseType),
      },
      response: {
        name: response.name,
        baseType: qResolveRev(response.baseType),
      },
    };
  } else if (decl.value.type === "import") {
    const ref = decl.value.import;
    const importStatement = decl.value;
    const loadPath = path.resolve(
      path.dirname(context.path),
      importStatement.path
    );
    if (prevReffedFiles.includes(loadPath)) {
      throw new Error(`Circular reference in files detected: ${loadPath}`);
    }
    const file = load(loadPath);
    const reffedVar = file.variables.find((v) => v.name === ref);

    if (!reffedVar) {
      throw new Error(`File ${loadPath} does not define ${ref}`);
    }

    newVal = resolveDecl(
      reffedVar,
      file,
      [],
      prevReffedFiles.concat(file.path),
      load
    ).value;
  } else if (decl.value.type === "service") {
    const { type, name, variables } = decl.value;

    newVal = {
      type,
      name,
      variables: variables.map((ref: VariableDeclaration<Reference>) =>
        resolveDecl(ref, context, nextReffedVars, prevReffedFiles, load, name)
      ),
    };
  } else {
    const { type, fields, typeParams } = decl.value;
    newVal = {
      type,
      fields: fields.map(({ name, baseType }) => ({
        name,
        baseType: qResolveRev(baseType),
      })),
      typeParams,
    };
  }

  return {
    statementType: "declaration",
    name: decl.name,
    value: newVal,
  };
}

export function resolve(
  refFile: ButteryFile<Reference>,
  load: (file: string) => ButteryFile<Reference>
): ButteryFile<Representable> {
  // circ reference betw. files solved in load()
  // so now we just have to solve it here.
  const newVars = refFile.variables.map((variable) =>
    resolveDecl(variable, refFile, [], [refFile.path], load)
  );

  return {
    path: refFile.path,
    variables: newVars,
  };
}
