# Browser Target reference

## Generation

Generate files via `buttery generate browser -f ./path/to/api.butt`

## Usage

After generation, you can import the service as a named import from the generated file. Instantiate a client for a service via the `new` keyword:

```ts
import { ApiService } from "./buttery-genfiles/api.browser";
const client = new ApiService();
```

Providing configuration is as easy as passing the first parameter.

```ts
const config = {...};
const client = new ApiService(config);
```

### Constructor Options

| Option name      | Description                                                                                                                                                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| rpc              | Options for RPCs (see below)                                                                                                                                                                                                               |
| rpc.requester    | The transport-layer function that is used. Interface is `(string, RpcConfig) => Promise<string>`, and defaults to a small wrapper around the [fetch API](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch) |
| rpc.[all others] | Configurations passed into [`fetch()`](https://developer.mozilla.org/en-US/docs/Web/API/WindowOrWorkerGlobalScope/fetch), via the `init` property                                                                                          |

### RPCs

RPCs are fields on the client class. To trigger an RPC, simply call the function with the correct parameter as specified in the buttery file. RPCs are then-able, e.g.

```ts
client.SomeRpc(requestData).then((responseData) => {
  ...
})
```

### Channels

Channels are defined on the client class, and are instantiated by calling the method with no arguments, e.g.

```ts
const feedConnection = client.Feed();
```

Channel requests return a `ButteryChannelConnection`. ButteryChannelConnection is not intended to be instantiated by the developer.

Class methods:
| Method | Signature | Description |
|---|---|---|
|send| `(Incoming)` => void | Sends a message over the channel |
| listen | `((Outgoing) => any) => void` | Subscribes a listener to a channel |
| unlisten | `((Outgoing) => any) => void` | Unsubscribes a listener to a channel |
| onClose | `(('closed'\|'broken') => any) => void` | Callback to be called when the socket closes or breaks |
| removeOnClose | `(('closed'\|'broken') => any) => void` | Remove the above callback |
| close | `(code: number = 100) => any` | Close the socket with the above code |
