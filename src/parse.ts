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
  sepBy,
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
import {
  Token,
  tokenize,
  BasicToken,
  NameToken,
  OpenBracketToken,
  CloseBracketToken,
  CommaToken,
  ColonToken,
  IndentToken,
  NewLineToken,
  OptionalToken,
  StructToken,
  RPCToken,
  ChannelToken,
  ImportToken,
  QuotedStringToken,
  FromToken,
} from "./tokenize";
import { isRight } from "fp-ts/lib/Either";

// Dangerous function because casted
const matchToken = <T extends BasicToken<unknown>>(tokenName: T["token"]) =>
  map((x) => x as T)(
    sat<Token>(({ token }: Token) => {
      return token === tokenName;
    })
  );

export const refParser: Parser<Token, Reference> = seq(
  matchToken<NameToken>("name"),
  (token) =>
    map((typeArgs: Array<Reference>) => ({
      ref: token.name,
      typeArgs,
    }))(
      maybe(getMonoid<Reference>())(
        apFirst(matchToken<CloseBracketToken>("closebracket"))(
          seq(matchToken<OpenBracketToken>("openbracket"), () =>
            sepBy1(matchToken<CommaToken>("comma"), refParser)
          )
        )
      )
    )
);

// Right now, hardcoding set of field modifiers to 'optional'
//const fieldModifiers = succeed<string, string[]>([]);
const fieldModifiers = many(matchToken<OptionalToken>("optional"));

export const fieldParser: Parser<Token, Field<Reference>> = seq(
  matchToken<NameToken>("name"),
  ({ name }) =>
    seq(matchToken<ColonToken>("colon"), () =>
      seq(fieldModifiers, (mods) => {
        if (mods.length > 1) {
          return fail();
        }
        // This will need to change on stuff.
        return map((reference: Reference) => ({
          name,
          optional: !!mods.find((mod) => mod.token === "optional"),
          baseType: reference,
        }))(refParser);
      })
    )
);

export const fieldLineParser = seq(
  seq(matchToken<NewLineToken>("newline"), () =>
    matchToken<IndentToken>("indent")
  ),
  () => fieldParser
);

const structDeclParser = seq(matchToken<StructToken>("struct"), () =>
  apFirst(matchToken<ColonToken>("colon"))(matchToken<NameToken>("name"))
);

export const structParser: Parser<Token, VariableDeclaration<Reference>> = seq(
  structDeclParser,
  ({ name }) => {
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
    })(many(fieldLineParser));
  }
);

const rpcDeclParser = seq(matchToken<RPCToken>("rpc"), () =>
  apFirst(matchToken<ColonToken>("colon"))(matchToken<NameToken>("name"))
);

export const rpcParser: Parser<Token, VariableDeclaration<Reference>> = seq(
  rpcDeclParser,
  ({ name }) => {
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
    })(many(fieldLineParser));
  }
);

const channelDeclParser = seq(matchToken<ChannelToken>("channel"), () =>
  apFirst(matchToken<ColonToken>("colon"))(matchToken<NameToken>("name"))
);

export const channelParser: Parser<Token, VariableDeclaration<Reference>> = seq(
  channelDeclParser,
  ({ name }) => {
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
    })(many(fieldLineParser));
  }
);

export const importParser: Parser<Token, ImportStatement> = seq(
  matchToken<ImportToken>("import"),
  () =>
    seq(
      sepBy1(matchToken<CommaToken>("comma"), matchToken<NameToken>("name")),
      (imports) => {
        return map(({ contents }: QuotedStringToken) => {
          const importStatement: ImportStatement = {
            statementType: "import",
            path: contents,
            imports: imports.map(({ name }) => name),
          };
          return importStatement;
        })(
          seq(matchToken<FromToken>("from"), () =>
            matchToken<QuotedStringToken>("quotedString")
          )
        );
      }
    )
);

const statementParser: Parser<Token, Statement<Reference>> = either<
  Token,
  Statement<Reference>
>(importParser, () =>
  either(structParser, () => either(rpcParser, () => channelParser))
);

export const fileParser: (
  path: string
) => Parser<Token, SurpcFile<Reference>> = (path) =>
  apFirst<Token, void>(eof())(
    seq(many(matchToken<NewLineToken>("newline")), () =>
      map((statements: Array<Statement<Reference>>) => ({
        path,
        imports: statements.filter(
          ({ statementType }) => statementType === "import"
        ) as ImportStatement[],
        variables: statements.filter(
          ({ statementType }) => statementType === "declaration"
        ) as VariableDeclaration<Reference>[],
      }))(sepBy(matchToken<NewLineToken>("newline"), statementParser))
    )
  );

export function badParse(contents: string, fname: string) {
  const tokenized = tokenize(stream(contents.split(""), 0));
  if (!isRight(tokenized)) {
    throw "tokenizer error!";
  }
  return fileParser(fname)(stream(tokenized.right.value, 0));
}

function parse(contents: string): SurpcFile<Reference> {
  throw "not implemented";
}
