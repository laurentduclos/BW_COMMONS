'use strict';
import chai from "chai";
import sinon from 'sinon';
const expect = chai.expect;

const getPoolMock = () => ({collection: collectionMock});
const collectionMock = () => collection;
const collection = {
  findById:()=> {},
  insert: ()=> {},
  find: ()=> {},
  remove:()=> {}
}

import Repo from "../../../repos/Repo";

//require('../../../bw_commons/services/mongoDBConnector');

const repo = new Repo(getPoolMock, 'test');

describe("Repo master class", function() {
  beforeEach((done) => {
    // mockery.enable();
    // mockery.registerMock('../bw_commons/services/mongoDBConnector', () => {collection});
    done()
  })
  // afterEach((done) => {
  //  mockery.disable();
  //  done();
  // })
  it ("should store a reference to the collection on the collection property", function (done) {
    expect(repo.collection).to.deep.equal(collection);
    done()
  });
  it("should have a 'findById' method", function(done) {
    expect(repo.findById).to.be.a('function');
    done();
  });
  it("should have an 'insert' method to insert a document", function(done) {
    expect(repo.insert).to.be.a('function');
    done();
  });
  it("should have an 'all' method to retrve all documents", function(done) {
    expect(repo.all).to.be.a('function');
    done();
  });
  it("should have an 'all' method to retrve all documents", function(done) {
    expect(repo.all).to.be.a('function');
    done();
  });
  describe("should have a 'remove'", function() {
    let spy = sinon.spy(collection, 'remove');
    it("that destroys documents selected form query", function(done) {
      repo.remove({"_id": 1});
      expect(spy.calledWith({"_id": 1})).to.equal(true);
      done();
    });
    it("that destroys all documents if no query is passed", function(done) {
      repo.remove();
      expect(spy.calledWith({})).to.equal(true);
      done();
    });
  });
})

const makeClass = (rules) => {
  class Test extends Repo {
    constructor() {
      super();
      this.rules = rules
    }
  }
  return new Test();
}

describe("Repo validation", function() {
  it ("Should throw if no rules have been defined", function (done) {
    const test = makeClass();
    test.validate()
      .then(() => done( new Error('Fail test')))
      .catch( e => {
        expect(e.message).to.equal('No validation rule are present on the model');
        done()
      })
  });

  it ("Should pass if rules array is empty", function (done) {
    const test = makeClass({});
    test.validate({}).then((res) => {
      expect(res).to.equal(true);
      done();
    })
  });

  it ("Should throw an error containing error data when validation fails", function () {
    const test = makeClass({name: 'required|alpha'});
    return test.validate({name:null}).catch(function(e) {
      expect(e.message).to.equal('notifications.validation_failed');
    });
  });

  it ("the error object should hold the informations about the errros and be properly formated", function () {
    const test = makeClass({name: 'required|alpha'});
    return test.validate({name: null}).catch((error) => {
      expect(error.meta['name'].errors.length).to.equal(1);
      expect(error.meta['name'].errors[0]).to.equal('alpha validation failed on name');
    })
  });
})