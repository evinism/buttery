# Buttery: Minimalistic language for defining HTTP(s) APIs

[![Build Status](https://travis-ci.com/evinism/buttery.svg?branch=master)](https://travis-ci.com/evinism/buttery)

_Warning: Buttery is still in alpha and is not (yet) suitable for production use. It CAN be used for side projects and game jams._

Buttery aims to be a minimalistic cross-platform language for defining type-safe RPCs and websockets. Buttery provides codegen and runtimes for browsers and node.js, with the intent of expanding to other platforms.

- [Detailed language reference](docs/language-reference.md)
- [`node` target reference](docs/buttery-node.md)
- [`browser` target reference (incomplete)](docs/buttery-browser.md)
- [Snailbook: an example nodejs app built on Buttery](examples/snailbook/)

### Example

Let's say we're building a basic chat app over websockets.

We define the interface in a `.butt` (or alternatively `.buttery`) file:

```
# chat.butt
service ChatService:
  struct SendMessage:
    timestamp: integer
    content: string

  struct NewMessageUpdate:
    timestamp: integer
    author: string
    content: string

  channel Chat:
    incoming: SendMessage
    outgoing: NewMessageUpdate
```

And consume the generated files in a sample client and server:

```ts
// client.ts on the frontend
import { ChatService } from "./buttery-genfiles/chat.browser";

const client = new ChatService("https://example.com");
const chatConnection = client.Chat();

chatConnection.listen((msg) => {
  console.log(msg.content);
});

chatConnection.send({ timestamp: Date.now(), content: "Hello, world!" });
```

```ts
// server.ts on the backend
import {ButteryServer} from 'buttery-node';
import {ChatService} from './buttery-genfiles/chat.node'

const butteryServer = new ButteryServer();
butteryServer.implement(ChatService, "Chat", (connection) => {
  connection.listen(msg => {
    connection.send({
      timetamp: Date.now(),
      author: "Server"
      content: 'Thanks for sending me a message!'
    });
  });
});
butteryServer.createServer().listen(8080);

```

### Installation:

Installation via npm, e.g. `npm install -g buttery-cli`

### CLI:

Buttery's CLI is very simple right now:

`buttery generate <target environment> -f [files]`

As an example call:

`buttery generate browser -f ./path/to/file.butt`

By default, this creates generated files in the `buttery-genfiles` directory. This can be changed via the `-o [path]` parameter. It's probably a good idea to gitignore that directory.

### Buttery Target Support

Buttery Clients
| Target | Target Description | Support |
|---|---|---|
| browser | Generated Typescript for use in browsers | Full Support |
| python-client | Generated code for Python Client | None |

Buttery Servers
| Target | Target Description | Support |
|---|---|---|
| node | Generated Typescript for use in express backends | Full Support |
| django | Generated code for use in Django backends | None |

### Scope of Buttery

Buttery aims to provide:

1. A lightweight language for defining over-the-network APIs.
2. First-class support for full duplex communication.
3. Codegen for clients and servers in a variety of languages.
4. Parsing and validation of requests and responses.
5. (when applicable) Cross-language, cross network boundary type safety.
6. Basic reliability abstractions, such as retries and message buffers for 2-way
   connections

Buttery does not aim to provide:

1. Strong protections against version skew of specific definitions.
2. Highly size-optimized over-the-wire encodings -- Buttery messages are valid JSON
3. Support for non-evergreen browsers

### Sample patterns of places where Buttery could be used:

- Backend to backend RPCs
- Frontend requests to backend services
- As a wrapper around websockets for server push
- Easy multiplexing of multiple services through a single host

### Comparison to other solutions

Depending on your background, you might find one of these comparisons useful:

- A lightweight replacement for gRPC / protos, but over http(s) and websockets
- [Twirp](https://github.com/twitchtv/twirp), but without all the baggage of protos, providing first-class support for browser -> backend comms, and bidi communication
- A lightweight replacement for swagger codegen, with bidi communication
- JSON-RPC-like specification, but paired with a small domain specific language for definitions and bidi communication
