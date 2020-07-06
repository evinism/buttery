# Buttery
## Minimalistic language for defining HTTP(s) APIs

*Warning: Buttery is still in pre-alpha and is not (yet) suitable for production use. It CAN be used for side projects and game jams if you're feeling a hint brave.*

Buttery aims to be a minimalistic cross-platform language for defining type-safe RPCs and websockets. Buttery provides codegen and runtimes for browsers and node.js, with the intent of expanding to other platforms.

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

```
// client.ts on the frontend
import {ChatService} from './buttery-genfiles/chat.browser'


const client = new ChatService('https://example.com');
const chatConnection = client.Chat();

chatConnection.listen((msg) => {
  console.log(msg.content);
});

chatConnection.send({timestamp: Date.now(), content: 'Hello, world!'});

```

```
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


### Sample patterns of places where Buttery could be used:

- Backend to backend RPCs
- Frontend requests to backend services
- As a wrapper around websockets for server push
- Easy multiplexing of multiple services through a single host

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


### Comparison to other solutions

Depending on your background, you might find one of these comparisons useful:
- A lightweight replacement for gRPC / protos, but over http(s) and websockets
- [Twirp](https://github.com/twitchtv/twirp), but without all the baggage of protos, providing first-class support for browser -> backend comms, and bidi communication
- A lightweight replacement for swagger codegen, with bidi communication
- JSON-RPC-like specification, but paired with a small domain specific language for definitions and bidi communication


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

### Sample of features

Primitives:

- integer
- boolean
- double
- string
- null

Builtin Types:

- Map
- List
- Optional

Declarations:

- struct: static key-value maps
- oneof: tagged unions
- rpc: one-off communication from client to server, request / response.
- channel: bidirectional communication w/ server push
- service: Groupings of RPCs and Channels

```
# This is a comment!
# Imports can reference other files
import Bleep, BleepRequest from "./some/file.gen.ts"

# Structs can be declared either outside or within a service
struct People:
  name: string
  areTheyChill: boolean
  title: string

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
