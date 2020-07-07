# Buttery Language Reference

## Syntax

Buttery's `.butt` or `.buttery` files have a very simple syntax:

```
# This is a comment
import NameOne, NameTwo, NameThree from "./path/to/other/file.butt"

type_of_thing NameOfThing:
  fieldOne: FieldTypeOne
  fieldTwo: FieldTypeTwo

service NameOfService:
  type_of_thing NestedDeclaration:
    fieldOne: FieldTypeOne
    fieldTwo: FieldTypeTwo
```

### Indentation

Hierarchy is denoted via indentation.

Right now, indentation can either be 2 spaces or a single tab. I want to support more than that but just haven't gotten around to it. Sorry!

## General concepts

### Names

Names can only be alphanumeric + underscore. This may be extended in the future, but likely not substantially, as we want to keep names consistent across programming languages.

Names in buttery are capitalized by convention. There's nothing enforcing that, but that's to keep in line with the common practice of capitalizing type names.

### Generics

Certain builtins are generic types, and support type arguments.

The syntax is: `SomeGenericType<TypeArgOne, TypeArgTwo, TypeArgThree>`

For example: `List<number>` defines a list of numbers.

Buttery is likely going to support user-defined generic types in the future, as that's an awesome abstraction to have, and is not excessively complex. It's already in the language, all we need to do is allow developers the option to use it.

### Constraints on Generics

Right now, the only constraint on generics that exist in the language is the `Map<key, value>` generic. The key can only be a primitive type. The compiler hard-codes this constraint for this particular built-in. It may be useful to add this as a core language feature, but frankly, I think that might be more trouble than it's worth for such a simple language.

## Buitlin Reference

These are the things that are built into the language.

### Primitives

There are N primitives in Buttery:

- `integer`: A non-decimal integer (+/-). Represented in JSON as a number, but might convert this to a string in later versions, because of limitations on the size of the integer inherent in JSON.
- `boolean`: A true/false value. Represented in JSON as a true/false.
- `double`: A double-precision floating-point number. Represented in JSON as a number.
- `string`: A string of characters. Represented in JSON as a string.
- `null`: A non-value. Represented in JSON as `null`. This is very likely going to be renamed `empty` before `0.1.0`.

### Structs

Structs are defined via the `struct` declaration. Structs are a heterogeneous set of static keys and values. In JSON, structs are represented as simple objects.

Example:

```
struct Bean:
  name: string
  tastiness: double
  weight: double

```

### OneOfs

OneOfs are defined via the `oneof` declaration. OneOfs are heterogeneous tagged unions. In JSON, oneofs are represented as objects with the form: `{tag: "fieldName", data: [whatever data]}`

Example:

```
oneof CurrencyAmount:
  dollar: DollarAmount
  euro: EuroAmount

```

### Lists

Lists are a builtin generic type implicitly defined everywhere. They represent a homogenously typed array. They are represented in JSON as standard arrays.

Lists take one generic argument, e.g. the type of value.

Example:

```
struct Foo:
  bar: List<Baz>
```

### Maps

Maps are a builtin generic type implicitly defined everywhere. They represent a homogenously typed map with dynamic keys. They are represented in JSON as simple objects.

Maps take two generic arguments, namely the key type and the value type. While the value type is unrestricted, the key type MUST be a primitive or a compiler error is thrown.

Example:

```
struct Foo:
  bar: Map<boolean, Baz>
```

### Optionals

Optionals are a builtin generic type implicitly defined everywhere. They represent a possibly missing value. In JSON they're represented as either the underlying type or a `null`. To provide a path of backwards compatibility between required and optional types, it's almost certain that optionals as fields to structs will be allowed to be undefined.

Lists take one generic argument, e.g. the type of value.

Example:

```
struct Foo:
  bar: Optional<Baz>
```

## Leaf constructs

These are constructs that cannot be referenced as types, but instead define the interfaces we care about in the first place.

### Rpcs

RPCs represent one-off requests, and are represented through HTTP(S) requests. They are defined using the `rpc` keyword. RPCs must be declared within services (detailed below).

RPCs require exactly two fields, `request` and `response`. Failing to leave either of these out results in a compilation error.

Defining the Bar rpc:

```
service Foo:
  rpc Bar:
    request: string
    response: boolean
```

### Channels

Channels represent a continuous bidirectiona channel, and are represented through websockets. They are defined using the `channel` keyword. Like RPCs, they can only be defined within services.

RPCs require exactly two fields, `incoming` and `outgoing`. Failing to leave either of these out results in a compilation error.
These names are relative to the buttery server. If this gets confusing, I can be convinced to provide `sico` and `soci` ("Server in, client out" and "Server out, client in") as aliases.

Defining the Baz channel:

```
service Foo:
  channel Baz:
    incoming: string
    outgoing: boolean
```

### Services

Services are a special kind of annotation that support nested declarations. Currently, services are the only type of construction that can allow this kind of thing.

Services can nest data types, such as `struct`s and `oneof`s, e.g.

```
service Foo:
  # Nested declaration below!!
  struct Bar:
    baz: string
    blep: integer

  rpc MakeRequest:
    request: Bar
    response: null

```

### Dot Syntax / Namespaces

If a `struct` or `oneof` named `Foo` is defined within a service named `ServiceName`, it can be referenced from outside the service via `ServiceName.Foo`, assuming `ServiceName` is in scope.

```
service Foo:
  # Nested declaration below!!
  struct Bar:
    baz: string
    blep: integer

struct OutsideOfFoo:
  bar: Bar # !!! ERRORS !!!

struct OutsideOfFooTwo:
  bar: Foo.Bar # Works
```

When dealing with imports, one can:

1. Import the whole service namespace, e.g.

```
import Foo from "./fooservice.butt"

struct Baz:
  bar: Foo.Bar
```

2. Import just the individual data structure (This one might not work before 0.1.0):

```
import Foo.Bar from "./fooservice.butt"

struct Baz:
  bar: Bar
```
