# Sur: Simple, unadorned cross-language DSL for defining RPCs

Sur aims to be a minimalistic cross-language DSL for defining RPCs and channels.
It's essentially a proto / grpc replacement for modern webstacks, with low
barrier to entry and easy integration into existing products. Sur is specialized
for use over http(s) and websockets, but should technically be transport-layer
agnostic.

### Scope of Sur

Sur aims to provide:

1. A lightweight language for defining over-the-network APIs.
2. Codegen for clients and servers in a variety of languages.
3. Parsing and validation of requests and responses.
4. Basic reliability abstractions, such as retries and message buffers for 2-way
   connections
5. (when applicable) Cross-language, cross network boundary type safety.

Sur does not aim to provide:

1. Strong protections against version skew of specific definitions.
2. Highly size-optimized over-the-wire encodings -- Sur messages are valid JSON
3. Support for non-evergreen browsers

### Sur Target Support

Sur Clients
| Target | Target Description | Support |
|---|---|---|
| ts-client | Generated Typescript for use in browsers | Partial |
| python-client | Generated code for Python Client | None |

Sur Servers
| Target | Target Description | Support |
|---|---|---|
| ts-express | Generated Typescript for use in express backends | None |
| django | Generated code for use in Django backends | None |

### A simple example:

Let's say we're building a basic chat app over websockets.

We can define the interface as follows:

```
# chat.sur
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

```
// client.ts on the frontend
import {ChatService} from './sur/chat.gen.ts'


const client = new ChatService('https://example.com');
const chatConnection = client.Chat();

chatConnection.onMessage((msg) => {
  console.log(msg.content);
});

chatConnection.send({timestamp: Date.now(), content: 'Hello, world!'});

```

```
// routes.ts on the backend (with Express)

// [tbd]
```

### Sample patterns of places where Sur could be used:

- Backend to backend RPCs
- Frontend requests to backend services
- As a wrapper around websockets for server push
- Easy multiplexing of multiple services through a single host

### CLI:

Installation via npm, e.g. `npm install -g surpc`

Sur's CLI is very simple right now:

`sur generate <target environment> -f [files`

As an example call:

`sur generate ts-client -f ./path/to/file.sur`

### Sample of features

Primitives:

- integer
- boolean
- double
- string
- null

Builtin Types:

- Map:
- List

Declarations:

- struct: static key-value maps
- oneof: tagged unions
- service: Groupings of RPCs and Channels
- rpc
- channel

```
# This is a comment!
# Imports can reference other files
import Bleep, BleepRequest from "./some/file.sur"

# Structs can be declared either outside or within a service
struct People:
  name: string
  areTheyChill: boolean
  title: optional string

service BleepService:
  struct BleepRequest:
    whoIsBleeping: string
    whoAreTheyTargeting: List<People>

  struct BleepResponse:
    didItWork: boolean
    wereTheySurprised: boolean

  # for oneoff request / response pairs.
  rpc Bleep:
    request: BleepRequest
    response: number

  # for 2-way, continuous channel.
  channel PeopleISee
    incoming: List<integer>,
    outgoing: People

```
