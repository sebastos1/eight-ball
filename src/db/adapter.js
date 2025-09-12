export class ExpressStoreAdapter {
    constructor(expressStore) {
        this.store = expressStore;
    }

    async set(key, value, ttlMs) {
        return new Promise((resolve, reject) => {
            this.store.set(key, value, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    async get(key) {
        return new Promise((resolve, reject) => {
            this.store.get(key, (err, session) => {
                if (err) reject(err);
                else resolve(session);
            });
        });
    }

    async delete(key) {
        return new Promise((resolve, reject) => {
            this.store.destroy(key, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
}