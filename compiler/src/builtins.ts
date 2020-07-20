import { Representable, Primitive } from "./ast";

// Refactoring to shim in basic lexical scope whatever.
export const ListEntry = (resolvedTypeArgs: Representable[]) => {
  if (resolvedTypeArgs.length !== 1) {
    throw `Wrong number of type arguments for a List (expected 1, got ${resolvedTypeArgs.length})`;
  }
  return {
    type: "list" as "list",
    value: resolvedTypeArgs[0],
  };
};

const validMapKey = (key: unknown): key is Primitive => {
  const lookup: unknown[] = [
    Primitive.boolean,
    Primitive.double,
    Primitive.integer,
    Primitive.string,
  ];
  return lookup.includes(key);
};

export const MapEntry = (resolvedTypeArgs: Representable[]) => {
  if (resolvedTypeArgs.length !== 2) {
    throw `Wrong number of type arguments for a Map (expected 2, got ${resolvedTypeArgs.length})`;
  }

  const mapKey = resolvedTypeArgs[0].type;
  const isValidMapKey = validMapKey(mapKey);
  if (!isValidMapKey) {
    throw "Can only use one of {string, double, integer, boolean} as a key for map";
  }
  return {
    type: "map" as "map",
    key: mapKey as Primitive, // No clue why this is necessary, it seems like typeguard above should catch it.
    value: resolvedTypeArgs[1],
  };
};

export const OptionalEntry = (resolvedTypeArgs: Representable[]) => {
  if (resolvedTypeArgs.length !== 1) {
    throw `Wrong number of type arguments for a Optional (expected 1, got ${resolvedTypeArgs.length})`;
  }

  return {
    type: "optional" as "optional",
    value: resolvedTypeArgs[0],
  };
};
