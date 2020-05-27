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

interface MapType<T> {
  type: "map";
  key: Primitive;
  value: T;
}

interface ListType<T> {
  type: "list";
  value: T;
}

export interface Field<T> {
  name: string;
  optional: boolean;
  baseType: T;
}

export interface StructType<T> {
  type: "struct";
  fields: Array<Field<T>>;
}

// Variables!!

export interface Channel<T> {
  type: "channel";
  name: string;
  incoming: Field<T>;
  outgoing: Field<T>;
}

export interface RPC<T> {
  type: "rpc";
  name: string;
  request: Field<T>;
  response: Field<T>;
}

export interface Service<T> {
  type: "service";
  name: string;
  variables: Array<VariableDeclaration<T>>;
}

export type VarRHS<T> = Channel<T> | RPC<T> | StructType<T> | Service<T>;

export interface VariableDeclaration<T> {
  statementType: "declaration";
  name: string;
  value: VarRHS<T>;
}

export interface ImportStatement {
  statementType: "import";
  imports: Array<string>;
  path: string;
}

export type Statement<T> = VariableDeclaration<T> | ImportStatement;

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
  typeArgs: Reference[];
}

// Is polymorphic in whether it's a reference ast or a fully qualified ast
// TODO: Remove path
export interface SurpcFile<T> {
  path: string;
  imports: Array<ImportStatement>;
  variables: Array<VariableDeclaration<T>>;
}
