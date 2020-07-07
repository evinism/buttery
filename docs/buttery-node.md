# Node target reference

Generate the types for nodejs via:

`buttery generate node -f ./path/to/api.butt`

This generates the typescript files, then instantly compiles the typescript files down to cjs + d.ts files. This is obviously inefficient, but should be sufficient for alpha release.

## `buttery-node` runtime

The `buttery-node` runtime is installed via `npm install --save buttery-node`.

`buttery-node` exports a named export `ButteryServer`.

## Buttery server instantiation

Instantiation via `new` keyword, e.g.

```
import { ButteryServer } from 'buttery-node';

const options = {...};
const server = new ButteryServer(options);
```

### Constructor Options

| Option name | Req'd? | Description                                                                                                                                                                              | Example                                |
| ----------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| rpc         |        | Options for RPCs (see below)                                                                                                                                                             |                                        |
| rpc.headers |        | Headers returned after an RPC. Map of strings to strings                                                                                                                                 | `{"x-Powered-By": "Buttery"}`          |
| https       |        | If defined, buttery creates an https server                                                                                                                                              | `{key: "fake_key", cert: "fake_cert"}` |
| https.key   | x      | Key passed to https.Server() constructor                                                                                                                                                 | `"fake_key"`                           |
| https.cert  | x      | Cert passed into https.Server() constructor                                                                                                                                              | `"fake_cert"`                          |
| baseHandler |        | Handler that handles non-buttery routes. If not specified, Buttery handles returning a 404 to the client when a non-buttery route is requested. Mutually exclusive to `express` property |                                        |

| express | | Existing express server that Buttery should utilize. If specified, all middleware applied to the express server also applies to Buttery routes | |

## Implementing RPCs and Channels

Channels and RPCs are implemented via the `.implement` class method on buttery servers.

### RPCs:

```ts
import { ButteryServer } from 'buttery-node';
import { SomeService } from './buttery-genfiles/api.node';

const server = new ButteryServer();

// Note that below is the first time we're referencing SomeService
server.implement(SomeService, "RpcName", (data, request) => {
  ...
});
```

The handler's signature is `(RequestData, http.IncomingRequest) => Promise<ResponseData>` where `RequestData` and `ResponseData` are the request and response types as declared in the `.butt` file, following the JSON object shapes declared in the [language reference](language-reference.md), and also in the generated type declarations. `http.IncomingRequest` is an `express` request object, which has all the properties that might have been added on via middleware.

### Channels:

```ts
import { ButteryServer } from 'buttery-node';
import { SomeService } from './buttery-genfiles/api.node';

const server = new ButteryServer();

// Note that below is the first time we're referencing SomeService
server.implement(SomeService, "ChannelName", (socket, request) => {
  ...
});
```

The handler's signature is `(ButterySocket<Incoming, Outgoing>, http.IncomingRequest) => void` where `Incoming` and `Outgoiing` are the incoming and outgoing types as declared in the `.butt` file, following the JSON object shapes declared in the [language reference](language-reference.md), and also in the generated type declarations. ButterySocket refers to [this class](https://github.com/evinism/buttery/blob/master/runtimes/buttery-node/src/channel.ts#L9). `http.IncomingRequest` is an `express` request object, which has all the properties that might have been added on via middleware.

### ButterySocket

ButterySocket represents a socket connection between the client and server. ButterySocket is not intended to be instantiated by the developer.

Class methods:
| Method | Signature | Description |
|---|---|---|
|send| (Outgoing) => void | Sends a message over the channel |
| listen | `((Incoming) => any) => void` | Subscribes a listener to a channel |
| unlisten | `((Incoming) => any) => void` | Unsubscribes a listener to a channel |

Currently there is no way to destroy the socket, which I consider to be a blocker to 0.1.0.

## Middleware

Since Buttery's node server is based on Express, most express-based middleware "should just work". This works even for channels (via a similar method to express-ws).

Middleware is added to a buttery server in a connect-style fashion via the `.use()` method, e.g.

```ts
server.use(middleware);
```

To narrow down middleware to a specific buttery service or path, use either of these signatures:

```ts
// Narrows down to all routes in SomeService
server.use(SomeService, middleware);
```

```ts
// Narrows down to only the "SomeRPC" rpc within SomeService
server.use(SomeService, "SomeRPC", middleware);
```

The only weird middleware (I know of) is `body-parser`. Buttery can handle `bodyparser.json({strict: false})` middleware in the chain, but no incompatible `body-parser` configurations are yet supported. If this is your use case, either eliminate body-parser middlware from buttery route, or contribute to buttery to fix this incompatibility.
