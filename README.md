# MongoDB session middleware for Telegraf

MongoDB powered simple session middleware for [Telegraf](https://github.com/telegraf/telegraf).

## Installation

```js
$ npm install telegraf-session-mongodb
```

## Example (Simple)

```js
const { TelegrafMongoSession } = require('telegraf-session-mongodb');
const Telegraf = require('telegraf');
const bot = new Telegraf(process.env.TOKEN);

TelegrafMongoSession.setup(bot, process.ENV.MONGODB_URI)
  .then((client) => bot.launch())
  .catch((err) => console.log(`Failed to connect to the database: ${err}`));
```

## Example (Advanced)

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

### Simple Setup

* TelegrafMongoSession.setup(_bot_, _mongodb\_url_, _options_)

### Options

* `collectionName`: name for MongoDB collection (default: `sessions`)
* `sessionName`: context property name (default: `session`)
* `sessionKeyFn`: function that generates the session key from the context ([default implementation](https://github.com/alexnzarov/telegraf-session-mongodb/blob/legacy/index.js#L21))
