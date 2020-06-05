// Nodes for Sur
// Consumed via ts-client and ts-express in a very ad-hoc method.

export interface SurNode<R> {
  validate: (toValidate: unknown) => toValidate is R;
  serialize: (r: R) => string | undefined;
  deserialize: (data: string) => R | undefined;
}

export interface RPCNode<Req, Res> {
  type: "rpcNode";
  name: string;
  request: SurNode<Req>;
  response: SurNode<Res>;
}

export interface ChannelNode<Send, Recv> {
  type: "channelNode";
  name: string;
  send: Send;
  recv: Recv;
}

export function structNode<R extends {}>(
  decl: { [key in keyof R]: SurNode<R[key]> }
): SurNode<R> {
  const entries = Object.entries(decl) as Array<[keyof R, SurNode<unknown>]>;

  const validate = (toValidate: unknown): toValidate is R => {
    if (typeof toValidate !== "object" || toValidate === null) {
      return false;
    }

    // No extra keys
    const toValidateEntries = Object.entries(toValidate);
    for (let [key] of toValidateEntries) {
      if (decl[key] === undefined) {
        console.warn(`Unexpected key ${key} in struct!`);
        return false;
      }
    }

    // all existing keys are valid
    for (let [key] of entries) {
      const keyIsValid = decl[key].validate(toValidate[key as string]);
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

  const deserialize = (data: string): R => {
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

export function listNode<R>(valueDefn: SurNode<R>): SurNode<R[]> {
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

  const deserialize = (data: string): R[] => {
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

type KeyType = "string" | "integer" | "double";

export function mapNode<R>(
  valueDefn: SurNode<R>,
  keyType: KeyType
): SurNode<{ [key: string]: R }> {
  throw "Not implemented!";
}

// Primitive nodes!
// Lots of these can be reduced down.
export function integerNode(): SurNode<number> {
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

  const deserialize = (data: string): number => {
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

export function doubleNode(): SurNode<number> {
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

  const deserialize = (data: string): number => {
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

export function stringNode(): SurNode<string> {
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

  const deserialize = (data: string): string => {
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

export function booleanNode(): SurNode<boolean> {
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

  const deserialize = (data: string): boolean => {
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

export function nullNode(): SurNode<boolean> {
  const validate = (toValidate: unknown): toValidate is null => {
    const isNull = toValidate === null;
    if (!isNull) {
      console.warn(`Expected null, got ${toValidate}`);
    }
    return isNull;
  };
  const serialize = (r: null) => {
    if (!validate(r)) {
      return;
    }
    return r;
  };

  const deserialize = (data: string): null => {
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
