# Sur: Simple, unadorned cross-language DSL for defining RPCs

Sur aims to be a minimalistic cross-language DSL for defining RPCs. It's
essentially a proto / grpc replacement for modern webstacks, with low barrier to
entry and easy integration into existing products. Sur is specialized for use
over http(s), but is technically transport-layer agnostic. Sur aims to ship with
http clients for several major programming languages and features.

### CLI:

Sur's CLI is very simple right now:

`sur generate <target environment> -f [files`

As an example call:

`sur generate ts-client -f ./path/to/file.sur`

### Syntax

```
/* Basic types:
 * ---
 * integer
 * boolean
 * double
 * string
 * Map<key, value>
 * List<param>
 *
 * To be specced out / implemented:
 * Enums
 * Services
 * OneOfs

import Bleep, BleepRequest from "./some/path"

struct People:
  name: string
  areTheyChill: boolean
  title: optional string

struct BleepRequest:
  whoIsBleeping: string
  whoAreTheyTargeting: List<People>

struct BleepResponse:
  didItWork: boolean
  wereTheySurprised: boolean

// for oneoff rpc
rpc Bleep:
  request: BleepRequest
  response: number

// for 2-way, continuous channel.
channel PeopleISee
  incoming: List<integer>,
  outgoing: People


```
