## Sur TypeScript client

Once implemented, the TypeScript client should work as follows:

```
import SurClient from './generatedFile';

const client = new Client('https://www.example.com');

client.fire(aJsonObject).then(() => {

});

```
