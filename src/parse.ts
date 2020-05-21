import {
  SurpcFile,
  StructType,
  Field,
  Reference,
  VariableDeclaration,
  RPC,
  Channel,
  ImportStatement,
  Statement,
} from "./ast";
import { alphanum, char } from "parser-ts/lib/char";
import {
  string,
  spaces1,
  spaces,
  many1 as stringMany1,
  doubleQuotedString,
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
  many1,
  sat,
  either,
  eof,
} from "parser-ts/lib/Parser";
import { getMonoid } from "fp-ts/lib/Array";
import { NonEmptyArray } from "fp-ts/lib/NonEmptyArray";
import { stream } from "parser-ts/lib/Stream";

const identifierParser = stringMany1(alphanum);
const toss = map(() => {});
const eolf = either<string, void>(toss(char("\n")), () => eof());
const spaceRe = /^\s$/;

/* TODO: Remove EOLF as a concept. Statements should be joined by whitespace
    with a newline somewhere in it.*/
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
      const decl: VariableDeclaration<Reference> = {
        statementType: "declaration",
        name,
        value: struct,
      };
      return decl;
    })(many(fieldParser));
  }
);

export const rpcParser: Parser<string, VariableDeclaration<Reference>> = seq(
  varDeclParser("rpc"),
  (name: string) => {
    return map((fields: Array<Field<Reference>>) => {
      // Bad way of ensuring required fields!
      const request = fields.find((field) => field.name === "request");
      const response = fields.find((field) => field.name === "response");
      if (!request) {
        throw "Missing request!";
      }
      if (!response) {
        throw "Missing response!";
      }
      if (fields.length > 2) {
        throw "Too many fields!";
      }

      const rpc: RPC<Reference> = {
        type: "rpc",
        name: name,
        request,
        response,
      };

      const decl: VariableDeclaration<Reference> = {
        statementType: "declaration",
        name,
        value: rpc,
      };
      return decl;
    })(many(fieldParser));
  }
);

export const channelParser: Parser<
  string,
  VariableDeclaration<Reference>
> = seq(varDeclParser("channel"), (name: string) => {
  return map((fields: Array<Field<Reference>>) => {
    // Bad way of ensuring required fields!
    const incoming = fields.find((field) => field.name === "incoming");
    const outgoing = fields.find((field) => field.name === "outgoing");
    if (!incoming) {
      throw "Missing request!";
    }
    if (!outgoing) {
      throw "Missing response!";
    }
    if (fields.length > 2) {
      throw "Too many fields!";
    }

    const rpc: Channel<Reference> = {
      type: "channel",
      name: name,
      incoming,
      outgoing,
    };

    const decl: VariableDeclaration<Reference> = {
      statementType: "declaration",
      name,
      value: rpc,
    };
    return decl;
  })(many(fieldParser));
});

export const importParser: Parser<string, ImportStatement> = seq(
  seq(string("import"), () => spaces1),
  () =>
    seq(
      sepBy1(
        seq(char(","), () => spaces),
        identifierParser
      ),
      (imports) => {
        return map((path: string) => {
          const importStatement: ImportStatement = {
            statementType: "import",
            path,
            imports,
          };
          return importStatement;
        })(
          seq(
            seq(
              seq(spaces1, () => string("from")),
              () => spaces1
            ),
            () => apFirst(seq(nonNewlineSpace, () => eolf))(doubleQuotedString)
          )
        );
      }
    )
);

const statementParser: Parser<string, Statement<Reference>> = either<
  string,
  Statement<Reference>
>(importParser, () =>
  either(structParser, () => either(rpcParser, () => channelParser))
);

export const fileParser: (
  path: string
) => Parser<string, SurpcFile<Reference>> = (path) =>
  apFirst<string, void>(eof())(
    seq(spaces, () =>
      map((statements: Array<Statement<Reference>>) => ({
        path,
        imports: statements.filter(
          ({ statementType }) => statementType === "import"
        ) as ImportStatement[],
        variables: statements.filter(
          ({ statementType }) => statementType === "declaration"
        ) as VariableDeclaration<Reference>[],
      }))(many(apFirst(spaces)(statementParser)))
    )
  );

export function badParse(contents: string, fname: string) {
  return fileParser(fname)(stream(contents.split(""), 0));
}

function parse(contents: string): SurpcFile<Reference> {
  throw "not implemented";
}
