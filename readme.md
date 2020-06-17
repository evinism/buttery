# Butter: Minimalistic cross-language DSL for defining RPCs

### Warning: Butter is still in pre-alpha and is not (yet) suitable for production use. It CAN be used for side projects and game jams if you're feeling a hint brave.

Butter aims to be a minimalistic cross-language DSL for defining RPCs and channels.
It's essentially a proto / grpc replacement for modern webstacks, with low
barrier to entry and easy integration into existing products. Butter is specialized
for use over http(s) and websockets, but should technically be transport-layer
agnostic.

### Scope of Butter

Butter aims to provide:

1. A lightweight language for defining over-the-network APIs.
2. First-class support for full duplex communication.
3. Codegen for clients and servers in a variety of languages.
4. Parsing and validation of requests and responses.
5. (when applicable) Cross-language, cross network boundary type safety.
6. Basic reliability abstractions, such as retries and message buffers for 2-way
   connections

Butter does not aim to provide:

1. Strong protections against version skew of specific definitions.
2. Highly size-optimized over-the-wire encodings -- Butter messages are valid JSON
3. Support for non-evergreen browsers

### Installation:

Installation via npm, e.g. `npm install -g butter-cli`

### A simple example:

Let's say we're building a basic chat app over websockets.

We can define the interface as follows:

```
# chat.butter
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
import {ChatService} from './butter-genfiles/chat.gen.ts'


const client = new ChatService('https://example.com');
const chatConnection = client.Chat();

chatConnection.listen((msg) => {
  console.log(msg.content);
});

chatConnection.send({timestamp: Date.now(), content: 'Hello, world!'});

```

```
// server.ts on the backend
import {ButterServer} from 'butter-node';
import {ChatService} from './butter-genfiles/chat.gen.ts'

const butterServer = new ButterServer(ChatService);
butterServer.implement("Chat", (connection) => {
  connection.listen(msg => {
    connection.send({
      timetamp: Date.now(),
      author: "Server"
      content: 'Thanks for sending me a message!'
    });
  });
});
butterServer.createHttpServer().listen(8080);

```

### Sample patterns of places where Butter could be used:

- Backend to backend RPCs
- Frontend requests to backend services
- As a wrapper around websockets for server push
- Easy multiplexing of multiple services through a single host

### CLI:

Butter's CLI is very simple right now:

`butter generate <target environment> -f [files]`

As an example call:

`butter generate browser -f ./path/to/file.butter`

### Butter Target Support

Butter Clients
| Target | Target Description | Support |
|---|---|---|
| browser | Generated Typescript for use in browsers | Mostly Supported |
| python-client | Generated code for Python Client | None |

Butter Servers
| Target | Target Description | Support |
|---|---|---|
| node | Generated Typescript for use in express backends | Mostly Supported |
| django | Generated code for use in Django backends | None |

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
import Bleep, BleepRequest from "./some/file.butter"

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
