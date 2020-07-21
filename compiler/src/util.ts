import { either, fail, Parser } from "parser-ts/lib/Parser";

export const anyOf = <S, T>(parsers: Array<Parser<S, T>>) => {
  return parsers.reduceRight((acc, cur) => either(cur, () => acc), fail());
};
