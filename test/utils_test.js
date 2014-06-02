var vows = require('vows');
var assert = require('assert');

var utils = require('../lib/utils');

vows.describe('utils.js').addBatch({
  "When a property does not exist": {
    topic: function ( ) {
      this.callback(null, utils.propertyFromData({ "foo": { "bar": "baz" } }, "foo.bar.baz"));
    },
    "undefined should be returned": function (data) {
      assert.equal(data, undefined);
    }
  },
  "When a property exists": {
    topic: function ( ) {
      this.callback(null, utils.propertyFromData({ "foo": { "bar": "baz" } }, "foo.bar"));
    },
    "the correct value should be returned": function (data) {
      assert.equal(data, "baz");
    }
  }
}).export(module);
