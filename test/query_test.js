var vows = require('vows');
var assert = require('assert');

var query = require('../lib/query');
var IndexStore = require('../lib/index');

var SimpleIndex = require('./helpers/simple_index').SimpleIndex;
var SimpleStore = require('./helpers/simple_store').SimpleStore;

vows.describe('query.js').addBatch({
  "Given three arrays": {
    topic: function ( ) {
      return [ [ 1, 2, 3, 4 ], [ 2, 3, 4, 5, 6 ], [ 3, 4, 5, 6, 7 ] ];
    },
    "Running OR": {
      topic: function (topic) {
        return query.or.apply(null, topic);
      },
      "should return the correct results": function (topic) {
        assert.deepEqual(topic, [ 1, 2, 3, 4, 5, 6, 7 ]);
      }
    },
    "Running AND": {
      topic: function (topic) {
        return query.and.apply(null, topic);
      },
      "should return the correct results": function (topic) {
        assert.deepEqual(topic, [ 3, 4 ]);
      }
    }
  },
  "Given two arrays": {
    topic: function ( ) {
      return [ [ 1, 2, 3 ], [ 2, 3, 4, 5, 6 ] ];
    },
    "Running OR": {
      topic: function (topic) {
        return query.or(topic[0], topic[1]);
      },
      "should return the correct results": function (topic) {
        assert.deepEqual(topic, [ 1, 2, 3, 4, 5, 6 ]);
      }
    },
    "Running AND": {
      topic: function (topic) {
        return query.and(topic[0], topic[1]);
      },
      "should return the correct results": function (topic) {
        assert.deepEqual(topic, [ 2, 3 ]);
      }
    }
  },
  "Given one array": {
    topic: function ( ) {
      return [ 1, 2, 3 ];
    },
    "Running OR": {
      topic: function (topic) {
        return query.or(topic);
      },
      "should return the correct results": function (topic) {
        assert.deepEqual(topic, [ 1, 2, 3 ]);
      }
    },
    "Running AND": {
      topic: function (topic) {
        return query.and(topic);
      },
      "should return the correct results": function (topic) {
        assert.deepEqual(topic, [ 1, 2, 3 ]);
      }
    }
  },
  "Given no arrays": {
    "Running OR": {
      topic: function ( ) {
        return query.or();
      },
      "should return an empty array": function (topic) {
        assert.deepEqual(topic, [ ]);
      }
    },
    "Running AND": {
      topic: function ( ) {
        return query.and();
      },
      "should return an empty array": function (topic) {
        assert.deepEqual(topic, [ ]);
      }
    }
  },
  "When parsing a complex query": {
    topic: function ( ) {
      return query.parseQuery({
        "$and": [
          {
            "$or": [
              {
                "name": {
                  "equals": "Main"
                }
              },
              {
                "crime.type": {
                  "equals": "Arson"
                }
              }
            ]
          },
          {
            "date": {
              "between": [ '2013-11-30', '2014-01-01' ]
            }
          }
        ]
      });
    },
    "the correct results should be returned": function (topic) {
      assert.deepEqual(topic, {
        operand: "$and",
        value: [
          {
            operand: "$or",
            value: [
              {
                operand: "equals",
                key: "name",
                value: "Main"
              },
              {
                operand: "equals",
                key: "crime.type",
                value: "Arson"
              }
            ]
          },
          {
            operand: "between",
            key: "date",
            value: [ '2013-11-30', '2014-01-01' ]
          }
        ]
      });
    }
  },
  "When a simple query is parsed": {
    topic: function ( ) {
      return query.parseQuery({
        "foo": "bar"
      });
    },
    "the correct results should be returned": function (topic) {
      assert.deepEqual(topic, {
        operand: "equals",
        key: "foo",
        value: "bar"
      });
    }
  },
  "When a query with too many keys is parsed": {
    topic: function ( ) {
      try {
        query.parseQuery({
          "foo": "bar",
          "bar": "baz"
        });
      } catch (err) {
        return err;
      }
    },
    "an error is thrown": function (topic) {
      assert.throws(topic, Error);
    }
  },
  "When a query with incorrect arguments to $and is parsed": {
    topic: function ( ) {
      try {
        query.parseQuery({
          "$and": "bar"
        });
      } catch (err) {
        return err;
      }
    },
    "an error is thrown": function (topic) {
      assert.throws(topic, Error);
    }
  },
  "When a query with an array argument to the key is parsed": {
    topic: function ( ) {
      try {
        query.parseQuery({
          "foo": [ 1, 2 ]
        });
      } catch (err) {
        return err;
      }
    },
    "an error is thrown": function (topic) {
      assert.throws(topic, Error);
    }
  },
  "When a query with any other type of argument to the key is parsed": {
    topic: function ( ) {
      try {
        query.parseQuery({
          "foo": true
        });
      } catch (err) {
        return err;
      }
    },
    "an error is thrown": function (topic) {
      assert.throws(topic, Error);
    }
  },
  "When a query with an empty object argument to the key is parsed": {
    topic: function ( ) {
      try {
        query.parseQuery({
          "foo": { }
        });
      } catch (err) {
        return err;
      }
    },
    "an error is thrown": function (topic) {
      assert.throws(topic, Error);
    }
  },
  "When an index and store are created and have data populated in an index": {
    topic: function ( ) {
      var store = new SimpleStore();
      var ind = new IndexStore();
      var si = new SimpleIndex();
      var cb = this.callback;

      ind.setBackingStore(store);

      store.add(1, { "foo": "bar" });
      store.add(2, { "foo": "baz" });
      store.add(3, { "foo": "foo" });
      store.add(4, { "foo": "baz", "bar": "baz" });
      ind.setBackingStore(store);

      return { store: store, index: ind };
    },
    "and a query that should return something runs": {
      topic: function (topic) {
        query.runQuery(
          {
            operand: "equals",
            key: "foo",
            value: "foo"
          },
          topic.index,
          topic.store,
          this.callback
        );
      },
      "there should be a single result": function (err, results) {
        assert.isNull(err);
        assert.equal(results.length, 1);
        assert.equal(results[0], 3);
      }
    },
    "and a query that should return nothing runs": {
      topic: function (topic) {
        query.runQuery(
          {
            operand: "equals",
            key: "baz",
            value: "foo"
          },
          topic.index,
          topic.store,
          this.callback
        );
      },
      "there should be no results": function (err, results) {
        assert.isNull(err);
        assert.equal(results.length, 0);
      }
    },
    "and a complex query that should return something runs": {
      topic: function (topic) {
        query.runQuery(
          {
            operand: "$and",
            value: [
              {
                operand: "equals",
                key: "foo",
                value: "baz"
              },
              {
                operand: "equals",
                key: "bar",
                value: "baz"
              }
            ]
          },
          topic.index,
          topic.store,
          this.callback
        );
      },
      "there should be a single result": function (err, results) {
        assert.isNull(err);
        assert.equal(results.length, 1);
        assert.equal(results[0], 4);
      }
    }
  },
  "When an index and store are created and have data": {
    topic: function ( ) {
      var store = new SimpleStore();
      var ind = new IndexStore();
      var si = new SimpleIndex();
      var cb = this.callback;

      ind.setBackingStore(store);
      store.add(1, { "foo": "bar" });
      store.add(2, { "foo": "baz" });
      store.add(3, { "foo": "foo" });
      store.add(4, { "foo": "baz", "bar": "baz" });

      ind.addIndex({ name: "Simple Index", property: "foo", index: si }, function ( ) {
        ind.add(1, { "foo": "bar" }, function () {
          ind.add(2, { "foo": "baz" }, function () {
            ind.add(3, { "foo": "foo" }, function () {
              ind.add(4, { "foo": "baz", "bar": "baz" }, function ( ) { cb (null, { store: store, index: ind }); });
            });
          });
        });
      });

    },
    "and a query that should return something runs": {
      topic: function (topic) {
        query.runQuery(
          {
            operand: "equals",
            key: "foo",
            value: "foo"
          },
          topic.index,
          topic.store,
          this.callback
        );
      },
      "there should be a single result": function (err, results) {
        assert.isNull(err);
        assert.equal(results.length, 1);
        assert.equal(results[0], 3);
      }
    },
    "and a query that should return nothing runs": {
      topic: function (topic) {
        query.runQuery(
          {
            operand: "equals",
            key: "baz",
            value: "foo"
          },
          topic.index,
          topic.store,
          this.callback
        );
      },
      "there should be no results": function (err, results) {
        assert.isNull(err);
        assert.equal(results.length, 0);
      }
    },
    "and a complex query that should return something runs": {
      topic: function (topic) {
        query.runQuery(
          {
            operand: "$and",
            value: [
              {
                operand: "equals",
                key: "foo",
                value: "baz"
              },
              {
                operand: "equals",
                key: "bar",
                value: "baz"
              }
            ]
          },
          topic.index,
          topic.store,
          this.callback
        );
      },
      "there should be a single result": function (err, results) {
        assert.isNull(err);
        assert.equal(results.length, 1);
        assert.equal(results[0], 4);
      }
    }
  }
}).export(module);
