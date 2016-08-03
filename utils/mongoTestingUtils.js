import { mongoInit, mongoClose } from '../services/mongoDBConnector';
import migrate from 'migrate';
const set = migrate.load('migrations/.migrate-tests', 'migrations');

export function prepareMongo(done) {
  set.up(function (err) {
    if (err) throw done(err);
    done();
  });
}

export function cleanupMongo(done) {
  set.down(function (err) {
    if (err) throw done(err);
  });
  done();
}

/**
 * Prepare a mongoDB collection for test.
 *
 * Typically this is used in the beforeEach hook
 *
 * Example use:
 *
 * beforeEach(function(done) {
 *   setAndPrepareCollections(['todos'], () =>
 *     // Here the callback method SEED new data
 *     getMongoPool().collection('todos').insertOne(todoStub).then(res=>done())
 *   );
 * });
 *
 *
 * @param  {Array}   collections: The name of the collections to be cleared
 * @param  {Function} cb: Callback function that will be called after the DB has been setup
 * @return {Promise}
 */
export  function setAndPrepareCollections(collections, cb) {
  mongoInit().then((db) => {
    const deletes = collections.map((collection) => {
      return db.collection(collection).remove({});
    });
    Promise.all(deletes).then(function(err, res) {
      cb(db)
    });
  });
}