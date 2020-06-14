import {
  SurFile,
  StructType,
  Field,
  Reference,
  VariableDeclaration,
  RPC,
  Channel,
  ImportStatement,
  Statement,
  Service,
} from "./ast";
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
  sat,
  either,
  eof,
} from "parser-ts/lib/Parser";
import { getMonoid } from "fp-ts/lib/Array";
import { stream } from "parser-ts/lib/Stream";
import {
  Token,
  lexer,
  BasicToken,
  NameToken,
  OpenBracketToken,
  CloseBracketToken,
  CommaToken,
  ColonToken,
  NewLineToken,
  OptionalToken,
  ImportToken,
  QuotedStringToken,
  FromToken,
  ShiftInToken,
  ShiftOutToken,
  PeriodToken,
} from "./lexer";
import { indentify } from "./indenter";
import { isLeft } from "fp-ts/lib/Either";
import { NonEmptyArray } from "fp-ts/lib/NonEmptyArray";
import { validate } from "./validator";
import { ParseError } from "parser-ts/lib/ParseResult";

const getParseErrorMessage = (error: ParseError<Token>) => {
  const errorChar = error.input.buffer[error.input.cursor].token;
  return `Parse Error: Expected ${error.expected}, but got ${errorChar}`;
};

const errorPadding = 30;
const getTokenizerErrorMessage = (error: ParseError<string>) => {
  const { buffer, cursor } = error.input;
  const start = Math.max(0, cursor - errorPadding);
  const end = Math.min(buffer.length - 1, cursor + errorPadding);

  const pre = buffer
    .slice(start, cursor)
    .join("")
    .replace(/^(.*\n)*\s*/g, "");
  const post = buffer
    .slice(cursor + 1, end)
    .join("")
    .replace(/(\n.*)*$/g, "");
  return `Tokenizer Error: Expected ${error.expected}, but got "${
    buffer[cursor]
  }":
${pre}${buffer[cursor]}${post}
${" ".repeat(pre.length)}^
`;
};

// Dangerous function because casted
const matchToken = <T extends BasicToken<unknown>>(tokenName: T["token"]) =>
  map((x) => x as T)(
    sat<Token>(({ token }: Token) => {
      return token === tokenName;
    })
  );

const refNameParser: Parser<Token, NonEmptyArray<NameToken>> = sepBy1(
  matchToken<PeriodToken>("period"),
  matchToken<NameToken>("name")
);

export const refParser: Parser<Token, Reference> = seq(
  refNameParser,
  (tokenArr) =>
    map((typeArgs: Array<Reference>) => {
      if (tokenArr.length > 2) {
        throw "References to namespaces of namespaces are not allowed";
      }
      const refToken = tokenArr.pop();
      const nsToken = tokenArr.pop();
      const ref: Reference = {
        ref: refToken.name,
        typeArgs,
      };
      if (nsToken) {
        ref.namespace = nsToken.name;
      }
      return ref;
    })(
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

const indentingDeclarationParser = <T>(
  keywordTokenType: Token["token"],
  innerParser: (
    name: NameToken
  ) => Parser<Token, VariableDeclaration<Reference>>
) => {
  const declStartParser = seq(matchToken<Token>(keywordTokenType), () =>
    apFirst(
      seq(matchToken<ColonToken>("colon"), () =>
        seq(matchToken<NewLineToken>("newline"), () =>
          matchToken<ShiftInToken>("shiftIn")
        )
      )
    )(matchToken<NameToken>("name"))
  );

  const declEndParser = matchToken<ShiftOutToken>("shiftOut");

  return apFirst(declEndParser)(seq(declStartParser, innerParser));
};

export const structParser = indentingDeclarationParser("struct", ({ name }) =>
  map((fields: Array<Field<Reference>>) => {
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
  })(sepBy1(matchToken<NewLineToken>("newline"), fieldParser))
);

export const rpcParser = indentingDeclarationParser("rpc", ({ name }) => {
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
  })(sepBy1(matchToken<NewLineToken>("newline"), fieldParser));
});

export const channelParser = indentingDeclarationParser(
  "channel",
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
    })(sepBy1(matchToken<NewLineToken>("newline"), fieldParser));
  }
);

export const serviceParser = indentingDeclarationParser(
  "service",
  ({ name }) => {
    return map((variables: NonEmptyArray<VariableDeclaration<Reference>>) => {
      const service: Service<Reference> = {
        type: "service",
        name,
        variables,
      };
      const decl: VariableDeclaration<Reference> = {
        statementType: "declaration",
        name,
        value: service,
      };
      return decl;
    })(
      sepBy1(
        matchToken<NewLineToken>("newline"),
        either(structParser, () => either(rpcParser, () => channelParser))
      )
    );
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
  either(structParser, () =>
    either(serviceParser, () => either(rpcParser, () => channelParser))
  )
);

export const fileParser: (path: string) => Parser<Token, SurFile<Reference>> = (
  path
) =>
  apFirst<Token, void>(
    seq(many(matchToken<NewLineToken>("newline")), () => eof())
  )(
    map((statements: Array<Statement<Reference>>) => ({
      path,
      imports: statements.filter(
        ({ statementType }) => statementType === "import"
      ) as ImportStatement[],
      variables: statements.filter(
        ({ statementType }) => statementType === "declaration"
      ) as VariableDeclaration<Reference>[],
    }))(sepBy(matchToken<NewLineToken>("newline"), statementParser))
  );

export function badParse(contents: string, fname: string) {
  const tokenized = lexer(stream(contents.split(""), 0));
  if (isLeft(tokenized)) {
    throw new Error(getTokenizerErrorMessage(tokenized.left));
  }
  const indented = indentify(tokenized.right.value);
  const parsed = fileParser(fname)(stream(indented, 0));
  if (isLeft(parsed)) {
    throw new Error(getParseErrorMessage(parsed.left));
  }
  const validated = validate(parsed.right.value);
  return validated;
}

export function parse(tokenStream: Token[], fname: string) {
  return fileParser(fname)(stream(tokenStream, 0));
}
