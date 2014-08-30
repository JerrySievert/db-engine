var vows = require('vows');
var assert = require('assert');

var query = require('../lib/query');

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
  }
}).export(module);
