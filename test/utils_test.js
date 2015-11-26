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
  },
  "When using compare with equals": {
    topic: function ( ) {
      return {
        operand: "equals",
        key: "test",
        value: 123
      };
    },
    "something that is equal should return true": function (topic) {
      assert(utils.compare(topic, { "test": 123 }));
    },
    "something that is not equal should return false": function (topic) {
      assert.equal(utils.compare(topic, { "test": 456 }), false);
    }
  },
  "When using compare with gt": {
    topic: function ( ) {
      return {
        operand: "gt",
        key: "test",
        value: 123
      };
    },
    "something that is gt should return true": function (topic) {
      assert(utils.compare(topic, { "test": 124 }));
    },
    "something that is not gt should return false": function (topic) {
      assert.equal(utils.compare(topic, { "test": 122 }), false);
    },
    "something that is equal should return false": function (topic) {
      assert.equal(utils.compare(topic, { "test": 123 }), false);
    }
  },
  "When using compare with lt": {
    topic: function ( ) {
      return {
        operand: "lt",
        key: "test",
        value: 123
      };
    },
    "something that is lt should return true": function (topic) {
      assert(utils.compare(topic, { "test": 122 }));
    },
    "something that is not lt should return false": function (topic) {
      assert.equal(utils.compare(topic, { "test": 124 }), false);
    },
    "something that is equal should return false": function (topic) {
      assert.equal(utils.compare(topic, { "test": 123 }), false);
    }
  },
  "When using compare with gte": {
    topic: function ( ) {
      return {
        operand: "gte",
        key: "test",
        value: 123
      };
    },
    "something that is gte should return true": function (topic) {
      assert(utils.compare(topic, { "test": 124 }));
    },
    "something that is not get should return false": function (topic) {
      assert.equal(utils.compare(topic, { "test": 122 }), false);
    },
    "something that is equal should return true": function (topic) {
      assert(utils.compare(topic, { "test": 123 }));
    }
  },
  "When using compare with lte": {
    topic: function ( ) {
      return {
        operand: "lte",
        key: "test",
        value: 123
      };
    },
    "something that is lte should return true": function (topic) {
      assert(utils.compare(topic, { "test": 122 }));
    },
    "something that is not lte should return false": function (topic) {
      assert.equal(utils.compare(topic, { "test": 124 }), false);
    },
    "something that is equal should return true": function (topic) {
      assert(utils.compare(topic, { "test": 123 }));
    }
  },
  "When using compare with between": {
    topic: function ( ) {
      return {
        operand: "between",
        key: "test",
        value: [ 3, 6 ]
      };
    },
    "something that is between should return true": function (topic) {
      assert(utils.compare(topic, { "test": 4 }));
    },
    "something that is not between should return false": function (topic) {
      assert.equal(utils.compare(topic, { "test": 124 }), false);
    }
  },
  "When using compare with between in reverse": {
    topic: function ( ) {
      return {
        operand: "between",
        key: "test",
        value: [ 6, 3 ]
      };
    },
    "something that is between should return true": function (topic) {
      assert(utils.compare(topic, { "test": 4 }));
    },
    "something that is not between should return false": function (topic) {
      assert.equal(utils.compare(topic, { "test": 124 }), false);
    }
  },
  "When using compare with exists": {
    topic: function ( ) {
      return {
        operand: "exists",
        key: "test"
      };
    },
    "something that exists should be true": function (topic) {
      assert(utils.compare(topic, { "test": true }));
    }
  }


}).export(module);
