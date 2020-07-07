# Snailbook: The social network for Snails!

Snailbook is an example Buttery app built on Create React App and NodeJS. Snailbook uses exclusively TypeScript. Snailbook uses passport local strategy for authentication, and a very basic in-memory store.

Snailbook _currently_ needs a few unpleasant workarounds to get working, but I'm actively trying to reduce these

- `client/src/setupProxy.js` is a workaround for CRA not forwarding channels effectively.
- `client/src/App.tsx` has an untyped field in the state, because it would be extremely unergonomic to type it well.
- `server/src/LogIn` requires introspection into the JSON structure of a Buttery message for username / password
- Neither client nor server compile on TS strict mode.
- `client` doesn't even `buttery generate` correctly, due to weirdness w/ the typescript compilation step.

... and a few other things.
