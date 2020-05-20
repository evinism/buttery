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
// symbol << This one's weird because it's a type with a single inhabitant, e.g.
//  "hi" represents a type hi with a single value "hi"
//  This is for defining namespaces and stuff.

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
  namespace: "string" // < can be omitted
  request: BleepRequest
  response: number

// for 2-way, continuous channel.
channel PeopleISee
  incoming: List<integer>,
  outgoing: People


```
