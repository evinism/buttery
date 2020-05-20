import {
  SurpcFile,
  Representable,
  Reference,
  Primitive,
  VariableDeclaration,
  VarRHS,
} from "./ast";
import fs from "fs";
import { alphanum, char } from "parser-ts/lib/char";
import { string, spaces1 } from "parser-ts/lib/string";
import { seq } from "parser-ts/lib/Parser";

function parse(contents: string): SurpcFile<Reference> {}

function load(file: string, loadedFiles: string[]): SurpcFile<Representable> {
  if (loadedFiles.includes(file)) {
    throw new Error("Cycle detected between files!");
  }
  return resolve(parse(fs.readFileSync(file, "utf8")));
}

function resolveRef(
  { ref }: Reference,
  context: SurpcFile<Reference>,
  prevReffedVars: string[]
): Representable {
  const primitive = Primitive[ref] as Primitive | undefined;
  if (primitive) {
    return {
      type: primitive,
    };
  }
  const decl = context.variables.find(({ name }) => name === ref);
  if (!decl) {
    throw new Error(`Could not find type ${decl}`);
  }
  const resolvedDecl = resolveDecl(decl, context, prevReffedVars);
  if (resolvedDecl.value.type === "channel") {
    throw new Error("Channels cannot be referenced as types");
  }
  if (resolvedDecl.value.type === "rpc") {
    throw new Error("Rpcs cannot be referenced as types");
  }
  return resolvedDecl.value;
}

function resolveDecl(
  decl: VariableDeclaration<Reference>,
  context: SurpcFile<Reference>,
  prevReffedVars: string[]
): VariableDeclaration<Representable> {
  if (prevReffedVars.includes(decl.name)) {
    throw new Error("Cycle detected in var!");
  }
  const nextReffedVars = prevReffedVars.slice();
  nextReffedVars.push(decl.name);

  const qResolveRev = (ref: Reference) =>
    resolveRef(ref, context, nextReffedVars);

  let newVal: VarRHS<Representable>;
  if (decl.value.type === "channel") {
    const { type, name, namespace, incoming, outgoing } = decl.value;
    newVal = {
      type,
      name,
      namespace,
      incoming: qResolveRev(incoming),
      outgoing: qResolveRev(outgoing),
    };
  } else if (decl.value.type === "rpc") {
    const { type, name, namespace, request, response } = decl.value;
    newVal = {
      type,
      name,
      namespace,
      request: qResolveRev(request),
      response: qResolveRev(response),
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
    name,
    value: newVal,
  };
}

function resolve(refFile: SurpcFile<Reference>): SurpcFile<Representable> {
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
