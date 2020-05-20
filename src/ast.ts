// Primitives!!
export enum Primitive {
  integer = "integer",
  double = "double",
  boolean = "boolean",
  string = "string",
}

// Types!!
interface IntegerType {
  type: Primitive.integer;
}

interface DoubleType {
  type: Primitive.double;
}

interface BooleanType {
  type: Primitive.boolean;
}

interface StringType {
  type: Primitive.string;
}

interface SymbolType {
  type: "symbol";
  member: string;
}

interface MapType<T> {
  type: "map";
  key: Primitive;
  value: T;
}

interface ListType<T> {
  type: "list";
  value: T;
}

interface Field<T> {
  name: string;
  optional: boolean;
  baseType: T;
}

interface StructType<T> {
  type: "struct";
  fields: Array<Field<T>>;
}

// Variables!!

interface Channel<T> {
  type: "channel";
  namespace: SymbolType;
  name: string;
  incoming: T;
  outgoing: T;
}

interface RPC<T> {
  type: "rpc";
  namespace: SymbolType;
  name: string;
  request: T;
  response: T;
}

export type VarRHS<T> = Channel<T> | RPC<T> | StructType<T>;

export interface VariableDeclaration<T> {
  name: string;
  value: VarRHS<T>;
}

interface ImportStatement {
  imports: Array<string>;
  path: string;
}

// The two types of leaf nodes:
// Representable types
export type Representable =
  | IntegerType
  | DoubleType
  | BooleanType
  | StringType
  | MapType<Representable>
  | ListType<Representable>
  | StructType<Representable>;

// Or references
export interface Reference {
  ref: string;
}

// Is polymorphic in whether it's a reference ast or a fully qualified ast
export interface SurpcFile<T> {
  path: string;
  imports: Array<ImportStatement>;
  variables: Array<VariableDeclaration<T>>;
}
