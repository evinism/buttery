## surpc

Simple, universal rpc definition

constraints...

```


// basic types:
// ---
// integer
// boolean
// double
// string
// Map<key, value>
// List<param>

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
