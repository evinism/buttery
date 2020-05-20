import {
  SurpcFile,
  StructType,
  Representable,
  Field,
  Reference,
  Primitive,
  VariableDeclaration,
  VarRHS,
} from "./ast";
import fs from "fs";
import { alphanum, char } from "parser-ts/lib/char";
import {
  string,
  spaces1,
  spaces,
  many1 as stringMany1,
} from "parser-ts/lib/string";
import {
  seq,
  sepBy1,
  map,
  maybe,
  Parser,
  apFirst,
  many,
  fail,
  succeed,
  many1,
  sat,
  either,
  eof,
} from "parser-ts/lib/Parser";
import { getMonoid } from "fp-ts/lib/Array";
import { NonEmptyArray } from "fp-ts/lib/NonEmptyArray";

const identifierParser = stringMany1(alphanum);
const toss = map(() => {});
const eolf = either<string, void>(toss(char("\n")), () => eof());
const spaceRe = /^\s$/;

function isNonNewlineSpace(char: string): boolean {
  return char !== "\n" && spaceRe.test(char);
}
const nonNewlineSpace = many(sat(isNonNewlineSpace));
const nonNewlineSpace1 = many1(sat(isNonNewlineSpace));

export const refParser: Parser<string, Reference> = seq(
  identifierParser,
  (ident) =>
    map((typeArgs: Array<Reference>) => ({
      ref: ident,
      typeArgs,
    }))(
      maybe(getMonoid<Reference>())(
        seq(spaces, () =>
          seq(
            seq(
              seq(char("<"), () => spaces),
              () =>
                sepBy1(
                  seq(spaces, () => seq(char(","), () => spaces)),
                  refParser
                )
            ),
            (refs: NonEmptyArray<Reference>) =>
              map(() => refs)(seq(spaces, () => char(">")))
          )
        )
      )
    )
);

const whitespacedColon = toss(
  seq(nonNewlineSpace, () => seq(char(":"), () => nonNewlineSpace))
);
const lineEndingColon = toss(seq(whitespacedColon, () => char("\n")));

// Right now, hardcoding set of field modifiers to 'optional'
//const fieldModifiers = succeed<string, string[]>([]);
const fieldModifiers = many(apFirst(spaces1)(string("optional")));

export const fieldParser: Parser<string, Field<Reference>> = seq(
  nonNewlineSpace1,
  () =>
    seq(identifierParser, (name: string) =>
      seq(whitespacedColon, () =>
        seq(fieldModifiers, (mods) => {
          if (mods.length > 1) {
            return fail();
          }
          // This will need to change on stuff.
          return map((reference: Reference) => ({
            name,
            optional: mods.includes("optional"),
            baseType: reference,
          }))(apFirst(seq(nonNewlineSpace, () => eolf))(refParser));
        })
      )
    )
);

export const varDeclParser = (keyword: string) =>
  apFirst(lineEndingColon)(
    seq(
      seq(string(keyword), () => nonNewlineSpace1),
      () => identifierParser
    )
  );

export const structParser: Parser<string, VariableDeclaration<Reference>> = seq(
  varDeclParser("struct"),
  (name: string) => {
    return map((fields: Array<Field<Reference>>) => {
      const struct: StructType<Reference> = {
        type: "struct",
        fields,
      };
      return {
        name,
        value: struct,
      };
    })(many(fieldParser));
  }
);

function parse(contents: string): SurpcFile<Reference> {
  throw "not implemented";
}

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
