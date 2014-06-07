var utils = require('./utils');


function IndexStore ( ) {
  this.indexes = [ ];
  this.ids     = [ ];
  this.store   = null;
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



// search a single index, return any results plus the metrics for the query
IndexStore.prototype.searchIndex = function (index, value, query, callback) {
  var startTime = Date.now();

  index[query](value, function (err, results) {
    callback(err,
      results, {
      indexType: index.constructor,
      startTime: startTime,
      endTime: Date.now(),
      resultsFound: results ? results.length : 0
    });
  });
};

// search all indexes in parallel, when all of the results are ready,
// return the output from all of the indexes as a single array,
// along with metrics from the run
IndexStore.prototype.searchIndexes = function (query, callback) {
  var results = { };
  var indexesToQuery = [ ];
  var metrics = [ ];

  for (var i = 0; i < this.indexes.length; i++) {
    if (this.indexes[i].property === query.key && this.indexes[i].index[query.type]) {
      indexesToQuery.push(this.indexes[i]);
    }
  }

  // if there are no indexes to query against, simply return, nothing to do
  if (indexesToQuery.length === 0) {
    callback();
  } else {
    var count = 0;

    for (var j = 0; j < indexesToQuery.length; j++) {
      this.searchIndex(indexesToQuery[j].index, query.value, query.type, function (err, r, m) {
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

// sets the backing store that is in use for retrieving data
IndexStore.prototype.setBackingStore = function (backingstore) {
  this.store = backingstore;
};

// add data to indexes
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

// remove data from indexes.  this needs to be the original record,
// not just an id.  updates should occur outside of this interface
// by removing then re-adding records.
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

/*
module.exports = exports = {
  addIndex:         addIndex,
  indexes:          indexes,
  ids:              ids,
  add:              add,
  remove:           remove,
  setBackingStore:  setBackingStore,
  searchIndexes:    searchIndexes,
  searchIndex:      searchIndex
};
*/
