// Primitives!!
export enum Primitive {
  integer = "integer",
  double = "double",
  boolean = "boolean",
  string = "string",
  null = "null",
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

interface NullType {
  type: Primitive.null;
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

interface OptionalType<T> {
  type: "optional";
  value: T;
}

export interface Field<T> {
  name: string;
  baseType: T;
}

interface Genericizable {
  // Should probably be augmented to be resolvable.
  typeParams: string[];
}

export interface StructType<T> extends Genericizable {
  type: "struct";
  fields: Array<Field<T>>;
}

export interface OneOfType<T> extends Genericizable {
  type: "oneof";
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

export interface Import {
  type: "import";
  import: string;
  path: string;
}

export type VarRHS<T> =
  | Channel<T>
  | RPC<T>
  | StructType<T>
  | OneOfType<T>
  | Service<T>
  | Import;

export interface VariableDeclaration<T> {
  statementType: "declaration";
  name: string;
  value: VarRHS<T>;
}

export type Statement<T> = VariableDeclaration<T>;

// The two types of leaf nodes:
// Representable types
export type Representable =
  | IntegerType
  | DoubleType
  | BooleanType
  | StringType
  | NullType
  | MapType<Representable>
  | ListType<Representable>
  | OptionalType<Representable>
  | StructType<Representable>
  | OneOfType<Representable>;

// Or references
export interface Reference {
  ref: string;
  namespace?: string; // Everything before a dot.
  typeArgs: Reference[];
}

// Is polymorphic in whether it's a reference ast or a fully qualified ast
// TODO: Remove path
export interface ButteryFile<T> {
  path: string;
  variables: Array<VariableDeclaration<T>>;
}
