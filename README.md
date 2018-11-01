# MongoDB session middleware for Telegraf

MongoDB powered simple session middleware for [Telegraf](https://github.com/telegraf/telegraf).

## Installation

```js
$ npm install telegraf-session-mongodb
```

## Example

```js
const { TelegrafMongoSession } = require('telegraf-session-mongodb');
const { MongoClient } = require('mongodb');
const Telegraf = require('telegraf');
const bot = new Telegraf(process.env.TOKEN);

let session;
bot.use((...args) => session.middleware(...args));

MongoClient.connect(process.env.MONGODB_URI, { useNewUrlParser: true }).then((client) => {
    const db = client.db();
    session = new TelegrafMongoSession(db, {
      collectionName: 'sessions',
      sessionName: 'session'
    });
    bot.startPolling();
});
```

## API

### Options

* `collectionName`: name for MongoDB collection (default: `sessions`)
* `sessionName`: context property name (default: `session`)
