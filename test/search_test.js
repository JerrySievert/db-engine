var vows = require('vows');
var assert = require('assert');

var index = require('../lib/index');
var testIndex = require('./helpers/simple_index').SimpleIndex;
var testStore = require('./helpers/simple_store').SimpleStore;

vows.describe('searching').addBatch({
  "When searching multiple indexes": {
    topic: function ( ) {
      var self = this;

      index.addIndex({ property: "foo", index: new testIndex() }, function ( ) {
        index.addIndex({ property: "foo", index: new testIndex() }, function ( ) {
          index.add(1, { "foo": "bar" }, function ( ) {
            index.add(2, { "foo": "baz" }, function ( ) {
              index.searchIndexes({ "key": "foo", "value": "bar", "type": "equals" }, self.callback);
            });
          });
        });
      });
    },
    "the correct entry is returned": function (err, topic, metrics) {
      assert.equal(topic[0], 1);
    }
  }
}).export(module);
