import {
  ButteryFile,
  StructType,
  OneOfType,
  Field,
  Reference,
  VariableDeclaration,
  RPC,
  Channel,
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
  sat,
  either,
  eof,
} from "parser-ts/lib/Parser";
import { getMonoid } from "fp-ts/lib/Array";
import { stream } from "parser-ts/lib/Stream";
import {
  Token,
  BasicToken,
  NameToken,
  OpenBracketToken,
  CloseBracketToken,
  CommaToken,
  ColonToken,
  NewLineToken,
  ImportToken,
  QuotedStringToken,
  FromToken,
  ShiftInToken,
  ShiftOutToken,
  PeriodToken,
  nameTokenParser,
} from "./lexer";
import { NonEmptyArray } from "fp-ts/lib/NonEmptyArray";
import { anyOf } from "./util";

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
      // Valid cast below because nonEmptyArray
      const refToken = tokenArr.pop()!;
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

export const fieldParser: Parser<Token, Field<Reference>> = seq(
  matchToken<NameToken>("name"),
  ({ name }) =>
    seq(matchToken<ColonToken>("colon"), () => {
      return map((reference: Reference) => ({
        name,
        baseType: reference,
      }))(refParser);
    })
);

// Intended to type args, e.g.
// <TypeArg1, TypeArg2>
const typeParamsParser = apFirst(matchToken<CloseBracketToken>("closebracket"))(
  seq(matchToken<OpenBracketToken>("openbracket"), () =>
    sepBy1(matchToken<CommaToken>("comma"), matchToken<NameToken>("name"))
  )
);
// maybe of above
const maybeTypeParamsParser = maybe(getMonoid<NameToken>())(typeParamsParser);

type IndentingDeclaration = VariableDeclaration<Reference>;

// [type] name<TypeArg1, TypeArg2>: \n
const indentingDeclarationParser = <T>(
  keywordTokenType: Token["token"],
  innerParser: (
    name: NameToken,
    typeParams: NameToken[]
  ) => Parser<Token, IndentingDeclaration>
) => {
  const declStartParser = seq(matchToken<Token>(keywordTokenType), () =>
    apFirst(
      seq(matchToken<ColonToken>("colon"), () =>
        seq(matchToken<NewLineToken>("newline"), () =>
          matchToken<ShiftInToken>("shiftIn")
        )
      )
    )(
      seq(matchToken<NameToken>("name"), (name) =>
        map<NameToken[], [NameToken, NameToken[]]>((typeParams) => {
          return [name, typeParams];
        })(maybeTypeParamsParser)
      )
    )
  );

  const declEndParser = matchToken<ShiftOutToken>("shiftOut");

  return apFirst(declEndParser)(
    seq(declStartParser, ([name, typeParams]) => innerParser(name, typeParams))
  );
};

export const structParser = indentingDeclarationParser(
  "struct",
  ({ name }, typeParams) =>
    map((fields: Array<Field<Reference>>) => {
      const struct: StructType<Reference> = {
        type: "struct",
        fields,
        typeParams: typeParams.map(({ name }) => name),
      };
      const decl: VariableDeclaration<Reference> = {
        statementType: "declaration",
        name,
        value: struct,
      };
      return decl;
    })(sepBy1(matchToken<NewLineToken>("newline"), fieldParser))
);

export const oneOfParser = indentingDeclarationParser(
  "oneof",
  ({ name }, typeParams) =>
    map((fields: Array<Field<Reference>>) => {
      const struct: OneOfType<Reference> = {
        type: "oneof",
        fields,
        typeParams: typeParams.map(({ name }) => name),
      };
      const decl: VariableDeclaration<Reference> = {
        statementType: "declaration",
        name,
        value: struct,
      };
      return decl;
    })(sepBy1(matchToken<NewLineToken>("newline"), fieldParser))
);

export const rpcParser = indentingDeclarationParser(
  "rpc",
  ({ name }, typeParams) => {
    return map((fields: Array<Field<Reference>>) => {
      if (typeParams.length !== 0) {
        throw "RPCs can't have type parameters";
      }

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
  }
);

export const channelParser = indentingDeclarationParser(
  "channel",
  ({ name }, typeParams) => {
    return map((fields: Array<Field<Reference>>) => {
      // Reject if ther are type args here
      if (typeParams.length !== 0) {
        throw "Channels can't have type arguments";
      }

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
  ({ name }, typeParams) => {
    return map((variables: NonEmptyArray<VariableDeclaration<Reference>>) => {
      if (typeParams.length !== 0) {
        throw "Services can't have type arguments";
      }

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
        anyOf([oneOfParser, structParser, rpcParser, channelParser])
      )
    );
  }
);

export const importParser: Parser<
  Token,
  VariableDeclaration<Reference>[]
> = seq(matchToken<ImportToken>("import"), () =>
  seq(
    sepBy1(matchToken<CommaToken>("comma"), matchToken<NameToken>("name")),
    (imports) => {
      return map(({ contents }: QuotedStringToken) => {
        const importDecls: VariableDeclaration<Reference>[] = imports.map(
          ({ name }) => ({
            statementType: "declaration",
            name,
            value: {
              type: "import",
              import: name,
              path: contents,
            },
          })
        );
        return importDecls;
      })(
        seq(matchToken<FromToken>("from"), () =>
          matchToken<QuotedStringToken>("quotedString")
        )
      );
    }
  )
);

const statementParser: Parser<Token, Statement<Reference>[]> = either<
  Token,
  Statement<Reference>[]
>(importParser, () =>
  map((a: Statement<Reference>) => [a])(
    anyOf([oneOfParser, structParser, serviceParser])
  )
);

const flatten = <T>(unflattened: Array<Array<T>>): Array<T> =>
  unflattened.reduce((acc, cur) => [...acc, ...cur], []);

const statementsToFile = (path: string) => (
  unflattened: Array<Array<Statement<Reference>>>
) => {
  const statements = flatten(unflattened);
  return {
    path,
    variables: statements.filter(
      ({ statementType }) => statementType === "declaration"
    ) as VariableDeclaration<Reference>[],
  };
};

export const fileParser: (
  path: string
) => Parser<Token, ButteryFile<Reference>> = (path) =>
  apFirst<Token, void>(eof())(
    map(statementsToFile(path))(
      sepBy(matchToken<NewLineToken>("newline"), statementParser)
    )
  );

export function parse(tokenStream: Token[], fname: string) {
  return fileParser(fname)(stream(tokenStream, 0));
}
