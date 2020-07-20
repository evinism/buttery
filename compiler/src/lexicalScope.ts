import { Representable, Primitive } from "./ast";
import { ListEntry, MapEntry, OptionalEntry } from "./builtins";

export type ResolveFn = (resolvedTypeArgs: Representable[]) => Representable;
export type LexicalScope = { [key: string]: ResolveFn }[];

export const defaultLexicalScope: { [key: string]: ResolveFn }[] = [
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

// Lookup by lexical scope!!!
export function getInLexicalScope(
  name: string,
  resolvedTypeArgs: Representable[],
  lexicalScope: LexicalScope
): Representable | undefined {
  const resolveFn = lexicalScope.reduceRight(
    (acc: ResolveFn | undefined, cur) => acc || cur[name],
    undefined
  );
  if (!resolveFn) {
    return undefined;
  }
  return resolveFn(resolvedTypeArgs);
}
