class TelegrafMongoSession {
    constructor(db, options) {
        this.options = Object.assign({
            sessionName: 'session',
            collectionName: 'sessions',
            sessionKeyFn: null
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

    getSessionKey(ctx) {
        const sessionKeyFn = this.options.sessionKeyFn;
        
        if (sessionKeyFn != null) {
            return sessionKeyFn(ctx);
        }

        // if ctx has chat object, we use chat.id
        // if ctx has callbackquery object, we use cb.chat_instance
        // if ctx does not have any of the fields mentioned above, we use from.id
        const { chat, callbackQuery, from } = ctx;

        if (chat && chat.type === 'channel' && !from) {
            return `ch:${chat.id}`;
        }

        const id = chat ? chat.id : (callbackQuery ? callbackQuery.chat_instance : from.id);
        return `${id}:${from.id}`;
    }

    async middleware(ctx, next) {
        const key = this.getSessionKey(ctx);
        const session = await this.getSession(key);

        ctx[this.options.sessionName] = session;

        await next();
        await this.saveSession(key, ctx[this.options.sessionName] || {});
    }

    static async setup(bot, mongo_url, params = {}) {
        let session;
        bot.use((...args) => session.middleware(...args));

        const { MongoClient } = require('mongodb');
        const client = await MongoClient.connect(mongo_url, { useNewUrlParser: true, useUnifiedTopology: true });
        const db = client.db();

        session = new TelegrafMongoSession(db, params);

        return client;
    }
}

exports.middleware = (db, options = {}) => {
    const telegrafSession = new TelegrafMongoSession(db, options);
    return telegrafSession.middleware;
}
exports.TelegrafMongoSession = TelegrafMongoSession;
