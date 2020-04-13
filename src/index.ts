import Telegraf, { ContextMessageUpdate } from 'telegraf';
import { MongoClient, Db, Collection } from 'mongodb';

export interface ISessionOptions {
  sessionName: string;
  collectionName: string;
};

export interface ICollectionObject<T> {
  key: string;
  data: T;
};

export class TelegrafMongoSession<T = any> {
  public options: ISessionOptions;
  public db: Db;
  public collection: Collection<ICollectionObject<T>>;

  constructor(db: Db, options: Partial<ISessionOptions>) {
    this.options = Object.assign({
      sessionName: 'session',
      collectionName: 'sessions',
    }, options);
    this.db = db;
    this.collection = db.collection(this.options.collectionName);
  }

  async saveSession(key: string, session: T) {
    return await this.collection.updateOne({ key }, { $set: { data: session } }, { upsert: true });
  }

  async getSession(key) {
    const doc = await this.collection.findOne({ key });
    return doc ? doc.data : {};
  }

  getSessionKey(ctx) {
    // if ctx has chat object, we use chat.id
    // if ctx has callbackquery object, we use cb.chat_instance
    // if ctx does not have any of the fields mentioned above, we use from.id

    const id = ctx.chat ? ctx.chat.id : (ctx.callbackQuery ? ctx.callbackQuery.chat_instance : ctx.from.id);
    return `${id}:${ctx.from.id}`;
  }

  async middleware(ctx, next) {
    const key = this.getSessionKey(ctx);
    const session = await this.getSession(key);

    ctx[this.options.sessionName] = session;

    await next();
    await this.saveSession(key, ctx[this.options.sessionName] ?? {});
  }

  public static async setup(bot: Telegraf<ContextMessageUpdate>, mongoUrl: string, options?: Partial<ISessionOptions>){
    let session: TelegrafMongoSession;
    bot.use((...args) => session.middleware(...args));

    const client = await MongoClient.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    const db = client.db();

    session = new TelegrafMongoSession(db, options);

    return client;
  }
};
