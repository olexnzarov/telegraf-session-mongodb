# MongoDB session middleware for Telegraf

MongoDB powered simple session middleware for [Telegraf 4.0](https://github.com/telegraf/telegraf) with TypeScript support.

## Installation

```js
$ npm install telegraf-session-mongodb
```

```js
$ yarn add telegraf-session-mongodb
```

## Example

```js
const { Telegraf } = require('telegraf');
const { MongoClient } = require('mongodb');
const { session } = require('telegraf-session-mongodb');

const bot = new Telegraf(process.env.BOT_TOKEN);

MongoClient.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(client => {
    const db = client.db();
    bot.use(session(db, { collectionName: 'sessions' }));
  });
```

## Example (TypeScript)

```ts
import { Context, Telegraf } from 'telegraf';
import { MongoClient } from 'mongodb';
import { session } from 'telegraf-session-mongodb';

export interface SessionContext extends Context {
  session: any;
};

const bot = new Telegraf<SessionContext>(process.env.BOT_TOKEN);

MongoClient.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(client => {
    const db = client.db();
    bot.use(session(db, { sessionName: 'session', collectionName: 'sessions' }));
  });
```

## API

### Options

* `collectionName`: name for MongoDB collection (default: `sessions`)
* `sessionName`: context property name (default: `session`)
* `sessionKeyFn`: function that generates the session key from the context
