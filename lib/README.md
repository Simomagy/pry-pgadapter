# pry-pgadapter — TypeScript/JS client for FiveM & RedM

PostgreSQL adapter for FiveM and RedM resources. Full TypeScript support with intellisense on the `pgadapter` object.

## Installation

```yaml
# With pnpm
pnpm add @prysmastudio/pgadapter

# With Yarn
yarn add @prysmastudio/pgadapter

# With npm
npm install @prysmastudio/pgadapter
```

## Usage

Import as module:

```js
import { pgadapter } from '@prysmastudio/pgadapter';
```

Import with require:

```js
const { pgadapter } = require('@prysmastudio/pgadapter');
```

## Documentation

[View documentation](https://prysma-studio.gitbook.io/pry-pgadapter/)

```js
pgadapter.scalar('SELECT username FROM users', (result) => {
    console.log(result)
}).catch(console.error)

pgadapter.scalar('SELECT username FROM users').then((result) => {
    console.log(result)
}).catch(console.error)

const result = await pgadapter.scalar('SELECT username FROM users').catch(console.error)
console.log(result)
```

## License

LGPL-3.0
