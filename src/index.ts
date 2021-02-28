import { Db } from 'mongodb';
import { Context, MiddlewareFn } from 'telegraf';
import { getSessionKey, SessionKeyFunction } from './keys';

export type SessionOptions = {
    sessionName: string;
    collectionName: string;
    sessionKeyFn: SessionKeyFunction;
};

export const session = <C extends Context = Context>(db: Db, sessionOptions?: Partial<SessionOptions>): MiddlewareFn<C> => {
    const options: SessionOptions = { 
        sessionName: 'session', 
        collectionName: 'sessions', 
        sessionKeyFn: getSessionKey,
        ...sessionOptions 
    };

    const collection = db.collection(options.collectionName);

    const saveSession = (key: string, data: any) => collection.updateOne({ key }, { $set: { data } }, { upsert: true });
    const getSession = async (key: string) => (await collection.findOne({ key }))?.data ?? {};

    const { sessionKeyFn: getKey, sessionName } = options;

    return async (ctx: Context, next) => {
        const key = getKey(ctx);
        const data = key == null ? undefined : await getSession(key);

        ctx[sessionName] = data;

        await next();

        if (ctx[sessionName] != null) {
            await saveSession(key, ctx[sessionName]);
        }
    };
}