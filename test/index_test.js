var vows = require('vows'),
    assert = require('assert');

var index = require('../lib/index');
var testIndex = require('./helpers/simple_index').SimpleIndex;
var testStore = require('./helpers/simple_store').SimpleStore;

vows.describe('index.js').addBatch({
  "When an index is added": {
    topic: function ( ) {
      index.addIndex({ property: "test", index: new testIndex() }, this.callback);
    },
    "the index count is one": function ( ) {
      assert.equal(index.indexes.length, 1);
    }
  },
  "When data is added to an index": {
    topic: function ( ) {
      index.add(1, { test: "foo" }, this.callback);
    },
    "the index will contain the entry": function ( ) {
      assert.equal(Object.keys(index.indexes[0].index.entries).length, 1);
      assert.equal(index.indexes[0].index.entries.foo[0], 1);
    },
    "When data is removed from an index": {
      topic: function ( ) {
        index.remove(1, { test: "foo" }, this.callback);
      },
      "the index will no longer contain the entry": function ( ) {
        assert.equal(Object.keys(index.indexes[0].index.entries).length, 0);
      }
    },
    "When data is already there and an index is added": {
      topic: function ( ) {
        var store = new testStore();
        index.setBackingStore(store);
        store.add(1, { foo: "bar" });
        index.add(1, { foo: "bar" }, function ( ) { });
        index.addIndex({ property: "foo", index: new testIndex() }, this.callback);
      },
      "the new index will contain the entry": function ( ) {
        assert.equal(Object.keys(index.indexes[1].index.entries).length, 1);
      }
    }
  },
  "When searching with an index": {
    topic: function ( ) {
      var simple = new testIndex();

      simple.add("foo", 1);
      index.searchIndex(simple, 'foo', 'equals', this.callback);
    }, "the correct results should be returned": function (err, results, topic) {
      assert.equal(results.length, 1);
      assert.equal(topic.indexType, "SimpleIndex");
      assert.equal(topic.resultsFound, 1);
    }
  }
}).export(module);
