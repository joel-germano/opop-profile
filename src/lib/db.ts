import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

// Cached on `global` so hot-reload in dev doesn't open a new connection on
// every module reload.
const globalForMongoose = globalThis as unknown as {
  mongoose?: MongooseCache;
};

const cache: MongooseCache = globalForMongoose.mongoose ?? {
  conn: null,
  promise: null,
};
globalForMongoose.mongoose = cache;

export async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI não está definida no .env");
  }

  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI, {
      dbName: "eu-apoio",
    });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
