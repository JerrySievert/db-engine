var utils = require('./utils');


/**
 * IndexStore.
 * @constructor
 * @param {Object} [options={ }] - Connection options.
 * @param options.permanentStore {Object} - Permanent store.
 */
function IndexStore (options) {
  this.indexes = [ ];
  this.ids     = [ ];
  this.store   = null;
  this.options = options || { };
}



/*
{
  property: "crime",
  index: new BTree()
}

Adds an index to the database.

If there are already entries in the database, loop through the entries and add
them to the index.

Only add the index to the list once the index is complete and ready to go.
*/

/**
 * Adds an {@link Index} to the store.
 * @param {Object} [index] Index to add.
 * @param index.name {String} Index name.
 * @param index.property {String} Property to index on.
 * @param index.index {Object} Index to use.
 * @param callback {Function} callback to execute.
 */
IndexStore.prototype.addIndex = function (index, callback) {
  // create all entries in the index
  if (this.ids.length) {
    var count = 0;
    var self = this;

    // loop through all of the id's in the store already there, and add them
    for (var i = 0; i < this.ids.length; i++) {
      this.store.get(this.ids[i], function (err, data, id) {
        if (!err) {
          // if the property exists in the data, add it to the index
          var property = data ? utils.propertyFromData(data, index.property) : undefined;
          count++;

          // don't index on objects specifically
          if (property !== undefined && typeof property !== 'object') {
            index.index.add(property, id, function (err, data) {
              if (count === self.ids.length) {
                self.indexes.push(index);
                callback();
              }
            });
          } else {
            if (count === this.ids.length) {
              this.indexes.push(index);
              callback();
            }
          }
        }
      });
    }
  } else {
    this.indexes.push(index);
    callback();
  }
};



/**
 * Searches a single {@link Index} and calls back with any results plus metrics.
 * @param index {Index} Index to query.
 * @param value {String|Number|Object|Array} value to query against.
 * @param query {String} method to use for the query.
 * @param callback {Function} callback to execute.
 */
IndexStore.prototype.searchIndex = function (index, value, query, callback) {
  var startTime = Date.now();

  index[query](value, function (err, results) {
    callback(err,
      results, {
      indexType: index.constructor,
      operand: query,
      key: value,
      startTime: startTime,
      endTime: Date.now(),
      resultsFound: results ? results.length : 0
    });
  });
};


/**
 * Searches every {@link Index} in parallel and calls back with an array of results and metrics.
 * @param query {Query} Query to execute.
 * @param query.key {String} Property to query on.
 * @param query.operand {String} method to use for the query.
 * @param query.value {String|Number|Object|Array} value to query against.
 * @param callback {Function} callback to execute.
 */
IndexStore.prototype.searchIndexes = function (query, callback) {
  var results = { };
  var indexesToQuery = [ ];
  var metrics = [ ];

  for (var i = 0; i < this.indexes.length; i++) {
    if (this.indexes[i].property === query.key && this.indexes[i].index[query.operand]) {
      indexesToQuery.push(this.indexes[i]);
    }
  }

  // if there are no indexes to query against, simply return, nothing to do
  if (indexesToQuery.length === 0) {
    callback("no indexes for query");
  } else {
    var count = 0;

    for (var j = 0; j < indexesToQuery.length; j++) {
      this.searchIndex(indexesToQuery[j].index, query.value, query.operand, function (err, r, m) {
        for (var k = 0; k < r.length; k++) {
          results[r[k]] = true;
        }

        metrics.push(m);
        count++;

        if (count === indexesToQuery.length) {
          callback(null, Object.keys(results), metrics);
        }
      });
    }
  }
};

/**
 * Sets the {@link Store} for retrieval of documents for when new indexes are added.
 * @param backingstore {Store} Backing store in use.
 */
IndexStore.prototype.setBackingStore = function (backingstore) {
  this.store = backingstore;
};

/**
 * Adds an entry to the indexes.
 * @param id {String|Number} ID of the entry.
 * @param entry {Object} Entry to be added to the indexes.
 * @param callback {Function} callback to execute.
 */
IndexStore.prototype.add = function (id, entry, callback) {
  if (this.ids.indexOf(id) === -1) {
    this.ids.push(id);
  }

  if (this.indexes.length === 0) {
    callback();
    return;
  }

  var count = 0;

  for (var i = 0; i < this.indexes.length; i++) {
    var index = this.indexes[i];

    // if the property exists in the data, add it to the index
    var property = utils.propertyFromData(entry, index.property);

    count++;

    var self = this;

    if (property !== undefined && typeof property !== 'object') {
      index.index.add(property, id, function (err, data) {
        if (count === self.indexes.length) {
          callback();
        }
      });
    } else {
      if (count === this.indexes.length) {
        callback();
      }
    }
  }
};

/**
 * Removes an entry from the indexes.  When doing an update, it is important
 * to remove the old entry, then add a new one.
 * @param id {String|Number} ID of the entry.
 * @param entry {Object} Entry to be removed from the indexes.
 * @param callback {Function} callback to execute.
 */
IndexStore.prototype.remove = function (id, entry, callback) {
  if (this.ids.indexOf(id) !== -1) {
    this.ids.splice(this.ids.indexOf(id), 1);
  }

  if (this.indexes.length === 0) {
    callback();
    return;
  }

  var count = 0;

  for (var i = 0; i < this.indexes.length; i++) {
    var index = this.indexes[i];

    // if the property exists in the data, add it to the index
    var property = utils.propertyFromData(entry, index.property);
    count++;

    var self = this;

    if (property !== undefined && typeof property !== 'object') {
      index.index.remove(property, id, function (err, data) {
        if (count === self.indexes.length) {
          callback();
        }
      });
    } else {
      if (count === this.indexes.length) {
        callback();
      }
    }
  }
};


module.exports = exports = IndexStore;
