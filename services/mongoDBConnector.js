/**
 * This openes and configure the conneciton to mongoDB.
 *
 * An application that relies on a MongoDB connection
 *
 * should be started from as follow: mongoInit().then(start())
 *
 */

'use strict';
import debug from 'debug';
const log = debug('kmc');
const mongo = require("mongodb");

// Notification for deprecated codebase
if ( ! ${process.env.MONGO_CONNECTION_STRING} ) {
  throw new Error('DB_PORT, DB_NAME, DB_HOST environment varialbes have been depreacted. Use MONGO_CONNECTION_STRING instread')
}

// Get mongo access URL from environment variables
const mongoUrl =
  `mongodb://${process.env.MONGO_CONNECTION_STRING}`

// Mongo configuration parameters
const native_parser = true;
const uri_decode_auth = true;
const poolSize = 10;

// A "static" reference to MongoDB pool connection
let _pool = null;

/**
 * This init the mongo connection.
 * @return {Promise} Application bootstrap should be made from then callback
 */
export const mongoInit = () => {
  return mongo.MongoClient.connect(mongoUrl, {
    server: {poolSize},
    native_parser,
    uri_decode_auth
  }).then((db) => {
    log('Connection to MongoDB opened');

    // Stores the pool staticly
    _pool = db;
    return db;
  }, (error) => {
    log('Database connection error: ', error);
    return false;
  })
}

/**
 * Get the connection pool
 * @return {MongoDB conection pool}
 */
export const getMongoPool = () => {
  return _pool;
}

/**
 * Closes the connection pool
 * @return {Boolean}
 */
export const mongoClose = () => {
  return _pool.close()
}

// DEPRECATED Place the pool on the context object via middleware
// Downstream middleware can now access mongo pool on the context object
// export default async function (ctx, next) {
//  ctx.mongo = _pool;
//  await next();
// }

/**
 * This was to manage mongo db connections pool with
 * the generic-pool npm package.
 * That does not seem to be needed anymore as mongoConnect
 * does that natively
 */
// const max = 100;
// const min = 1;
// const timeout = 30000;
//
// const log = false;
//import poolModule from 'generic-pool';
// const mongoPool = poolModule.Pool({
//  name: 'mongodb',
//  create : (callback) => {
//    mongo.MongoClient.connect(mongoUrl, {
//      server: {poolSize},
//      native_parser,
//      uri_decode_auth
//    }, (err, client) => {
//        if (err) throw err;
//        callback(err, client);
//      });
//    },
//  destroy  : (client) => client.close(),
//  max, log, min,
//  idleTimeoutMillis : timeout
// });

// export default function * (next) {
//  this.mongo = await mongoPool.acquire;
//  if (!this.mongo) this.throw('Fail to acquire one mongo connection')
//  debug('Acquire one connection (min: %s, max: %s, poolSize: %s)', min, max, mongoPool.getPoolSize());

//  try {
//    yield* next;
//  } catch (e) {
//    throw e;
//  } finally {
//    mongoPool.release(this.mongo);
//    debug('Release one connection (min: %s, max: %s, poolSize: %s)', min, max, mongoPool.getPoolSize());
//  }
// }