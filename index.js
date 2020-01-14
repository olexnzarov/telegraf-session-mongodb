class TelegrafMongoSession {
    constructor(db, options) {
        this.options = Object.assign({
            sessionName: 'session',
            collectionName: 'sessions'
        }, options);
        this.db = db;
        this.collection = db.collection(this.options.collectionName);
    }

    async saveSession(key, session) {
        return await this.collection.updateOne({ key: key }, { $set: { data: session } }, { upsert: true });
    }

    async getSession(key) {
        const doc = await this.collection.findOne({ key: key });
        return doc ? doc.data : {};
    }

    async middleware(ctx, next) {
        if (!ctx.from || (!ctx.chat && ['callback_query', 'inline_query'].indexOf(ctx.updateType) === -1)) {
            await next();
            return;
        }

        let chatId;
        if (ctx.chat) {
            chatId = ctx.chat.id;
        } else if (ctx.updateType === 'callback_query') {
            chatId = ctx.callbackQuery.chat_instance;
        } else if (ctx.updateType === 'inline_query') {
            chatId = ctx.from.id;
        }

        const key = `${chatId}:${ctx.from.id}`;
        const session = await this.getSession(key);

        ctx[this.options.sessionName] = session;

        await next();
        await this.saveSession(key, ctx[this.options.sessionName] || {});
    }

    static setup(bot, mongo_url, params = {}) {
        let session;
        bot.use((...args) => session.middleware(...args));

        const { MongoClient } = require('mongodb');
        return MongoClient.connect(mongo_url, { useNewUrlParser: true, useUnifiedTopology: true }).then((client) => {
            const db = client.db();
            session = new TelegrafMongoSession(db, params);
        }).catch((reason) => {
            console.log('telegraf-session-mongodb: failed to connect to the database, session saving will not work.')
            console.log(reason);

            session = { middleware: function(ctx, next) { next(); } }
        });
    }
}

exports.middleware = (db, options = {}) => {
    const telegrafSession = new TelegrafMongoSession(db, options);
    return telegrafSession.middleware;
}
exports.TelegrafMongoSession = TelegrafMongoSession;
