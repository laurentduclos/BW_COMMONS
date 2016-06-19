'use strict';
import {ObjectID} from 'mongodb';
import {ValidationError} from '../errors';
import Promise from 'bluebird';
import { utils as fp } from 'jsfp';
import indicative from 'indicative';
import {RepoMalformedError} from '../errors';

/**
 * Base class for all repositories that need access mongoDB.
 *
 * use:
 *
 * class MyRepo extend Repo {
 *   ...
 * }
 *
 */
class Repo {
  /**
   * Expect to receive the MongoDB connection end point as well as the collection name
   *
   * @param  {function} getMongoPool   Retreived the mongo connection
   * @param  {string} collectionName Name of the mongo collection
   *
   *
   */
  constructor(getMongoPool, collectionName) {
    // Make sure that we have the mongoDB pool and the collction name
    if ( ! getMongoPool ) {
      throw new RepoMalformedError('Missing the mongoDB object');
    }

    if ( ! collectionName ) {
      throw new RepoMalformedError('Missing the collection name for this repo');
    }

    // Save those references
    this.collectionName = collectionName;
    this.getMongoPool = getMongoPool;
    this.errors = [];
  }

  /**
   * Return a MongoDB NodeJS Connection Pool
   *
   * Learn more about pool here http://blog.mlab.com/2013/11/deep-dive-into-connection-pooling/
   *
   * @return {MongoDB Pool}
   *
   */
  get db() {
    return this.getMongoPool();
  }

  /**
   * Return a mongoDB collection based on this.collectionName
   *
   * @return {Promise}
   *
   */
  get collection() {
    return this.getMongoPool().collection(this.collectionName);
  }

  /**
   * Get all documents from collection
   *
   * @return {Promise}
   */
  all() {
    return this.collection.find({}, this.getHiddenProjectionObject()).toArray();
  }

  /**
   * Count all in collection
   *
   * @return {Promise}
   */
  count() {
    return this.collection.count();
  }


  /**
   * Find documents that match query
   *
   * @return {Promise => cursor }
   */
  find(query) {
    return this._find(this.collection, query);
  }


  /**
   * Rerteive the first item that match a query
   *
   * @param  {Object} MongoDB query
   * @return {Promise}
   */
  findOne(query) {
    return this.collection.findOne(query);
  }

  /**
   * Remove all items that match the query
   *
   * @param  {Object} MongoDB query
   * @return {Promise}
   */
  remove(query, justOne) {
    query = query || {};
    return this._remove(query, justOne);
  }


  /**
   * Remove an Item from it's ID
   *
   * @param  {String} Document ID
   * @return {Promise}
   */
  removeByID(ID) {
    const idO = new ObjectID(ID);
    return this._remove({_id: idO}, justOne);
  }

  /**
   * Add one document to the collection
   *
   * @param  {Object} data: Document to be added
   * @param  {Boolean} noGuard: Wehter or not guarded field (aka. mass assignement protection) should be lifted
   * @return {Promise}
   */
  insert(data, noGuard) {
    return this._insert(this.collection, data, false, noGuard);
  }

  /**
   * Update all documents that match the query with the replace data
   *
   * @param  {Object} query: MongoDB query object
   * @param  {Object} replace: Data to replace document with
   * @param  {Boolean} noGuard: Wehter or not guarded field (aka. mass assignement protection) should be lifted
   * @param {Boolean} updateTime: Should updated_at field refresh
   * @return {Promise}
   */
  update(query, replace, updateTime = true, noGard) {
    return this._update(this.collection, query, replace, updateTime, noGard?[]:false );
  }

  /**
   * Unset a field form document
   *
   * @param  {Object} query: MongoDB query object
   * @param  {String} field: Field name
   * @return {Promise}
   */
  unset(query, field) {
    query = typeof query == 'object' ? query : {'_id': new ObjectID(query) };
    replace = {
      $unser: { [field]: "" }
    }
    return this.collection.findAndModify(query, replace);
  }


  /**
   * Update all documents that match the query with the replace data
   *
   * @param  {Object} query: MongoDB query object
   * @param  {Object} replace: Data to replace document with
   * @param  {Boolean} noGuard: Wehter or not guarded field (aka. mass assignement protection) should be lifted
   * @param {Boolean} updateTime: Should updated_at field refresh
   * @return {Promise}
   */
  fullUpdate(query, replace, updateTime = true) {
    query = typeof query == 'object' ? query : {'_id': new ObjectID(query) };
    replace = {
      replace,
      $currentDate: { updated_at: updateTime }
    }
    return this.collection.findAndModify(query, replace);
  }


  /**
   * Create a mongoDB projection object based on the `hidden` fields property
   *
   * So in order to "hide" some field from the JSON response on a repository
   *
   * just make sure to add them to the `hidden` property array
   *
   * @return Object
   */
  getHiddenProjectionObject() {

    // if no hidden property array is specified then return a plain object
    // Like this there will be no projection field
    if (!this.hidden) return {};

    // otherwise just proceed
    return this.hidden.reduce((acc, field) => {
      acc[field] = 0;
      return acc;
    }, {})
  }

  /**
   * Retreive one item in the colleciton based on
   * it's mongodDB ObjectID
   *
   * @param  {[type]} id [description]
   * @return {[type]}    [description]
   */
  findById(id) {
    return this._findById(this.collection, id);
  }



  /**
   * Only get a scpecific field from the first document
   *
   * that matches the query object
   *
   * @param  {string} id: Will be conversted to ObjectID
   * @param {string} fieldName: The fieldname that you want to retreive
   * @return {Promise}
   */
  getField(id, fieldName) {
    const idO = new ObjectID(id);
    return this.collection.findOne({_id: idO}, {[fieldName]: 1, "_id": 0});
  }

  /**
   * Add one element to the array field of the first
   *
   * document that match the query
   *
   * @param  {Object}  query: The mongoDB query
   * @param  {String, Object, Int}  value: The value to be added to the array
   * @param  {String}  fieldName: The array field name
   * @param  {Boolean} updateTime: Should the document updated_at time refresh
   * @return {Promise}
   */
  pushToArray( query, value, fieldName, updateTime = true ) {
    return this._pushToArray(this.collection, query, value, fieldName, updateTime)
  }


  /**
   * Remove on element form the specified array field on the first document matched
   *
   * @param  {Object}  query: The mongoDB query
   * @param  {Object}  removalQuery: The mongoDB query
   * @param  {String}  fieldName: The array field name
   * @return {Promise}
   */
  pullFromArray( query, removalQuery, fieldName ) {
    query = typeof query == 'object' ? query : {'_id': new ObjectID(query) };
    const data = {
      $pull: { [fieldName]: removalQuery },
      $currentDate: { updated_at: true }
    }
    return this.collection.findAndModify(query, [['_id',1]], data, {new:true});
  }


  /**
   * Validation method based on indicative NodeJS validation library
   * http://indicative.adonisjs.com/
   *
   * @param  {[type]} data         [description]
   * @param  {Array}  exclude      [description]
   * @param  {[type]} rulesOveride [description]
   * @return {[type]}              [description]
   */
  validate(data, exclude = [], rulesOveride) {
    // Add unique validation rule
    indicative.extend('or', or.bind(this))

    // Add custome validaiton method defined on repos
    if (this.customValidationMethod) {
      this.customValidationMethod.map(method =>
        indicative.extend(this.constructor.name || this.name, method.bind(this))
      )
    }

    // Add unique validation rule
    indicative.extend('unique', unique.bind(this))
    if (!this.rules && !rulesOveride) throw new Error('No validation rule are present on the model');

    // allow to overide rules
    let rules = rulesOveride ? rulesOveride : this.rules;

    // Exclude some fields from validation. Useful for unique checks when updating a resources
    rules = fp.filtero((v, k) => {
      return exclude.indexOf(k) === -1
    }, rules);

    return indicative
      .validateAll(data, rules)
      .then(() => { console.log('passed'); return true})
      .catch((errors) => {
        this.__errors = errors;
        const error = new ValidationError("notifications.validation_failed");
        error.status = 422;
        error.meta = this.formatErrors();
        throw (error);
      })
  }

  /**
   * Formats error to match API error generated by:
   *
   * https://github.com/m4nuC/koa-json-api-response/blob/master/src/index.js
   *
   * @return {Object} Formated error object
   *
   */
  formatErrors() {
    const formated = this.__errors.reduce((prev, next) => {
      prev[next.field] = [next.message];
      return prev;
    }, {})
    return formated;
  }



  /**
   * Find documents that match query on given collection
   *
   * @return {Promise => Cursor}
   */
  _find(collection, query, projections = this.getHiddenProjectionObject()) {
    return collection.find(query, projections);
  }

  /**
   * Retreive one item on given collection
   * it's mongodDB ObjectID
   *
   * @param  {[type]} id [description]
   * @return {[type]}    [description]
   */
  _findById(collection, id) {
    const idO = new ObjectID(id);
    return collection.findOne({_id: idO}, this.getHiddenProjectionObject());
  }


  /**
   * Insert with in given collection
   * @param  {MongoCollection} collection    Can specify a colleciton on which to insert the data
   * @param  {Object} data          [description]
   * @param  {Array} fieldsOveride  When specifiying a collection, the `fields` property of the repo might not be relevant, so it can be overiden here
   * @param  {[type]} noGuard       [description]
   * @return {[type]}               [description]
   *
   */
  _insert(collection, data, fieldsOveride, noGuard) {
    const fields = fieldsOveride ? fieldsOveride : this.fields;

    let guarded = noGuard ? data : fp.filtero((v, k) => {
      return fields.indexOf(k) > -1
    }, data);

    if (Object.keys(guarded).length === 0)
      return Promise.reject(`Can not save resources, either ${this.constructor.name} repo was not specified a 'fields' property either no data was passed`);

    return collection.insert(guarded)
      .then((res) => new Promise ((resolve, reject) => {
        if (res.ops && res.ops[0] && res.ops[0]._id ) {
          return resolve(res.ops[0])
        }
        else {
          return reject('Response could not be parsed');
        }
      })
    )
  }

  /**
   * Delete document that match the query in given collection
   *
   * @param  {MongoCollection} collection: Can specify a colleciton on which to insert the data
   * @param  {Object}  query: The mongoDB query
   * @param  {Boolean} justOne:   Should we delete only one item
   * @return {Promise}
   *
   */
  _remove(collection, query, justOne = false) {
    const options = { justOne };
    return collection.remove(query, options);
  }


  /**
   * Push data to array field in the given collection
   *
   * @param  {MongoCollection} collection: Can specify a colleciton on which to perform the opperation
   * @param  {Object}  query: The mongoDB query
   * @param  {Any primitive}  value: the value to be pushed into the array
   * @param  {[type]}  fieldName: the field name that holds the array
   * @param  {Boolean} updateTime: should we update the updated_at field
   * @return {Promise}
   *
   */
  _pushToArray( collection, query, value, fieldName, updateTime = false) {
    query = typeof query == 'object' ? query : {'_id': new ObjectID(query) };
    const data = {
      $push: { [fieldName]: value },
      $currentDate: { updated_at: updateTime }
    }
    return collection.findAndModify(query, [['_id',1]], data, {new:true});
  }


  _update(collection, query, replace, updateTime = true, fieldsOveride ) {
    const fields = fieldsOveride ? fieldsOveride : this.fields;
    let guarded = fp.filtero((v, k) => {
      return fields.indexOf(k) > -1
    }, replace);
    // console.log(query, replace)
    // if (Object.keys(guarded).length === 0)
    //   return Promise.reject(`Can not save resources, either ${this.constructor.name} repo was not specified a 'fields' property either no data was passed`);

    query = typeof query == 'object' ? query : {'_id': new ObjectID(query) };

    updateTime && delete(replace.updated_at);
    replace = {
      $set: replace,
      $currentDate: { updated_at: updateTime }
    }
    return collection.findAndModify(query, [['_id',1]], replace, {upsert: true, new: true});
  }
}

/**
 * Existance check validator indicative:
 * http://indicative.adonisjs.com/docs/node-validation-rules
 *
 * Checks wether or not a document with give field already exist on the collection
 *
 * @param  {[type]} data    [description]
 * @param  {[type]} field   [description]
 * @param  {[type]} message [description]
 * @param  {[type]} args    [description]
 * @param  {[type]} get     [description]
 * @return {[type]}         [description]
 */
var unique = async function (data, field, message, args, get) {
  return new Promise ((resolve, reject) =>  {
    let value = get(data, field);

    if (! field) throw new error('No field was specified for unique checks');
    if (! value) reject(`${field} is required`);


    // if args is we need to change collection
    const collec = args[0] ? this.db.collection(args[0]) : this.collection;

    return collec.findOne({[field]: value})
      .then(res => {

        if (res === null) {
          return resolve('validation passed');
        }

        if (res._id) {
          value = value.number|| value;
          return reject(`${value} is already in use`)
        }

        return reject(`${value} is already in use`)
      })
      .catch(() => {
        throw new error('There was an error when checking for duplicates');
      });
  })
}

/**
 * Existance check validator indicative:
 * http://indicative.adonisjs.com/docs/node-validation-rules
 *
 * Checks wether or not a document with give field already exist on the collection
 *
 * @param  {[type]} data    [description]
 * @param  {[type]} field   [description]
 * @param  {[type]} message [description]
 * @param  {[type]} args    [description]
 * @param  {[type]} get     [description]
 * @return {[type]}         [description]
 */
var or = async function (data, field, message, args, get) {
  return new Promise ((resolve, reject) =>  {
    let value = get(data, field);

    if (! field) throw new error('No field was specified for unique checks');

    // if args is specified then check if present on data
    const orField = args.length ? get(data, args[0]) : false;

    if (indicative.is.existy(value)) {
      return resolve('validation passed');
    }
    if (indicative.is.existy(orField)) {
      return resolve('validation passed');
    } else {
      return reject(`Either ${field} or ${orField} should exist`)
    }
  })
}

export default Repo;
