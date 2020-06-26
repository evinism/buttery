// Nodes for Buttery
// Consumed via ts-client and ts-express in a very ad-hoc method.

export interface ButteryNode<R> {
  validate: (toValidate: unknown) => toValidate is R;
  serialize: (r: R) => string | undefined;
  deserialize: (data: string) => R | undefined;
}

export interface RPCNode<Req, Res> {
  type: "rpcNode";
  name: string;
  request: ButteryNode<Req>;
  response: ButteryNode<Res>;
}

export interface ChannelNode<Incoming, Outgoing> {
  type: "channelNode";
  name: string;
  incoming: ButteryNode<Incoming>;
  outgoing: ButteryNode<Outgoing>;
}

export function structNode<R extends {}>(
  decl: { [key in keyof R]: ButteryNode<R[key]> }
): ButteryNode<R> {
  const entries = Object.entries(decl) as Array<
    [keyof R, ButteryNode<unknown>]
  >;

  const validate = (toValidate: unknown): toValidate is R => {
    if (typeof toValidate !== "object" || toValidate === null) {
      return false;
    }

    // No extra keys
    const toValidateEntries = Object.entries(toValidate);
    for (let [key] of toValidateEntries) {
      if ((decl as { [K: string]: unknown })[key] === undefined) {
        console.warn(`Unexpected key ${key} in struct!`);
        return false;
      }
    }

    // all existing keys are valid
    for (let [key] of entries) {
      const keyIsValid = decl[key].validate(
        (toValidate as { [K in keyof R]: unknown })[key]
      );
      if (!keyIsValid) {
        return false;
      }
    }
    return true;
  };

  const serialize = (r: R) => {
    if (!validate(r)) {
      return;
    }
    return (
      "{" +
      entries
        .map(([key, child]) => `"${key}": ${child.serialize(r[key])}`)
        .join(",") +
      "}"
    );
  };

  const deserialize = (data: string): R | undefined => {
    const parsed = JSON.parse(data) as unknown;
    if (!validate(parsed)) {
      return;
    }
    return parsed;
  };

  return {
    validate,
    serialize,
    deserialize,
  };
}

export function listNode<R>(valueDefn: ButteryNode<R>): ButteryNode<R[]> {
  const validate = (toValidate: unknown): toValidate is R[] => {
    if (!Array.isArray(toValidate)) {
      return false;
    }

    for (let entry of toValidate as unknown[]) {
      if (!valueDefn.validate(entry)) {
        return false;
      }
    }
    return true;
  };
  const serialize = (r: R[]) => {
    if (!validate(r)) {
      return;
    }
    return `[${r.map(valueDefn.serialize).join(",")}]`;
  };

  const deserialize = (data: string): R[] | undefined => {
    const parsed = JSON.parse(data) as unknown;
    if (!validate(parsed)) {
      return;
    }
    return parsed;
  };
  return {
    validate,
    serialize,
    deserialize,
  };
}

type KeyType = "string" | "integer" | "double" | "boolean";

const validateKey: { [type in KeyType]: (arg: string) => boolean } = {
  string: (key) => key !== "",
  integer: (key) => parseInt(key, 10).toString() === key,
  double: (key) => parseFloat(key).toString() === key,
  boolean: (key) => key === "true" || key === "false",
};

export function mapNode<R extends { [key: string]: ButteryNode<unknown> }>(
  valueDefn: R[string],
  keyType: KeyType
): ButteryNode<R> {
  const validate = (toValidate: unknown): toValidate is R => {
    if (typeof toValidate !== "object" || toValidate === null) {
      return false;
    }

    // Validate all keys
    const keysValid = Object.keys(toValidate)
      .map(validateKey[keyType])
      .every(Boolean);

    if (!keysValid) {
      return false;
    }

    // all existing keys are valid
    for (let value of Object.values(toValidate)) {
      const valueIsValid = valueDefn.validate(value);
      if (!valueIsValid) {
        return false;
      }
    }
    return true;
  };

  const serialize = (r: R) => {
    if (!validate(r)) {
      return;
    }
    const entries = Object.entries(r);
    return (
      "{" +
      entries
        .map(([key, value]) => `"${key}": ${value.serialize(r[key])}`)
        .join(",") +
      "}"
    );
  };

  const deserialize = (data: string): R | undefined => {
    const parsed = JSON.parse(data) as unknown;
    if (!validate(parsed)) {
      return;
    }
    return parsed;
  };

  return {
    validate,
    serialize,
    deserialize,
  };
}

// Primitive nodes!
// Lots of these can be reduced down.
export function integerNode(): ButteryNode<number> {
  const validate = (toValidate: unknown): toValidate is number => {
    const isInteger = typeof toValidate === "number" && toValidate % 1 === 0;
    if (!isInteger) {
      console.warn(`Expected integer, got ${toValidate}`);
    }
    return isInteger;
  };
  const serialize = (r: number) => {
    if (!validate(r)) {
      return;
    }
    return r.toString();
  };

  const deserialize = (data: string): number | undefined => {
    const parsed = JSON.parse(data) as unknown;
    if (!validate(parsed)) {
      return;
    }
    return parsed;
  };
  return {
    validate,
    serialize,
    deserialize,
  };
}

export function doubleNode(): ButteryNode<number> {
  const validate = (toValidate: unknown): toValidate is number => {
    const isDouble = typeof toValidate === "number";
    if (!isDouble) {
      console.warn(`Expected double, got ${toValidate}`);
    }
    return isDouble;
  };
  const serialize = (r: number) => {
    if (!validate(r)) {
      return;
    }
    return r.toString();
  };

  const deserialize = (data: string): number | undefined => {
    const parsed = JSON.parse(data) as unknown;
    if (!validate(parsed)) {
      return;
    }
    return parsed;
  };
  return {
    validate,
    serialize,
    deserialize,
  };
}

export function stringNode(): ButteryNode<string> {
  const validate = (toValidate: unknown): toValidate is string => {
    const isString = typeof toValidate === "string";
    if (!isString) {
      console.warn(`Expected string, got ${toValidate}`);
    }
    return isString;
  };
  const serialize = (r: string) => {
    if (!validate(r)) {
      return;
    }
    return JSON.stringify(r.toString());
  };

  const deserialize = (data: string): string | undefined => {
    const parsed = JSON.parse(data) as unknown;
    if (!validate(parsed)) {
      return;
    }
    return parsed;
  };
  return {
    validate,
    serialize,
    deserialize,
  };
}

export function booleanNode(): ButteryNode<boolean> {
  const validate = (toValidate: unknown): toValidate is boolean => {
    const isBoolean = typeof toValidate === "boolean";
    if (!isBoolean) {
      console.warn(`Expected boolean, got ${toValidate}`);
    }
    return isBoolean;
  };
  const serialize = (r: boolean) => {
    if (!validate(r)) {
      return;
    }
    return r.toString();
  };

  const deserialize = (data: string): boolean | undefined => {
    const parsed = JSON.parse(data) as unknown;
    if (!validate(parsed)) {
      return;
    }
    return parsed;
  };
  return {
    validate,
    serialize,
    deserialize,
  };
}

export function nullNode(): ButteryNode<null> {
  const validate = (toValidate: unknown): toValidate is null => {
    const isNull = toValidate === null;
    if (!isNull) {
      console.warn(`Expected null, got ${toValidate}`);
    }
    return isNull;
  };
  const serialize = (r: null): string | undefined => {
    if (!validate(r)) {
      return;
    }
    return "null";
  };

  const deserialize = (data: string): null | undefined => {
    const parsed = JSON.parse(data) as unknown;
    if (!validate(parsed)) {
      return;
    }
    return parsed;
  };
  return {
    validate,
    serialize,
    deserialize,
  };
}
