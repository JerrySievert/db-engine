var utils = require('./utils');

var indexes = [ ];
var ids = [ ];
var store;


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
function addIndex (index, callback) {
  // create all entries in the index
  if (ids.length) {
    var count = 0;

    // loop through all of the id's in the store already there, and add them
    for (var i = 0; i < ids.length; i++) {
      store.get(ids[i], function (err, data, id) {
        if (!err) {
          // if the property exists in the data, add it to the index
          var property = data ? utils.propertyFromData(data, index.property) : undefined;
          count++;

          // don't index on objects specifically
          if (property !== undefined && typeof property !== 'object') {
            index.index.add(property, id, function (err, data) {
              if (count === ids.length) {
                indexes.push(index);
                callback();
              }
            });
          } else {
            if (count === ids.length) {
              indexes.push(index);
              callback();
            }
          }
        }
      });
    }
  } else {
    indexes.push(index);
    callback();
  }
}



// search a single index, return any results plus the metrics for the query
function searchIndex (index, value, query, callback) {
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
}

// search all indexes in parallel, when all of the results are ready,
// return the output from all of the indexes as a single array,
// along with metrics from the run
function searchIndexes (query, callback) {
  var results = { };
  var indexesToQuery = [ ];
  var metrics = [ ];

  for (var i = 0; i < indexes.length; i++) {
    if (indexes[i].property === query.key && indexes[i].index[query.type]) {
      indexesToQuery.push(indexes[i]);
    }
  }

  // if there are no indexes to query against, simply return, nothing to do
  if (indexesToQuery.length === 0) {
    callback();
  } else {
    var count = 0;

    for (var j = 0; j < indexesToQuery.length; j++) {
      searchIndex(indexesToQuery[j].index, query.value, query.type, function (err, r, m) {
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
}

// sets the backing store that is in use for retrieving data
function setBackingStore (backingstore) {
  store = backingstore;
}

// add data to indexes
function add (id, entry, callback) {
  if (ids.indexOf(id) === -1) {
    ids.push(id);
  }

  if (indexes.length === 0) {
    callback();
    return;
  }

  var count = 0;

  for (var i = 0; i < indexes.length; i++) {
    var index = indexes[i];

    // if the property exists in the data, add it to the index
    var property = utils.propertyFromData(entry, index.property);

    count++;

    if (property !== undefined && typeof property !== 'object') {
      index.index.add(property, id, function (err, data) {
        if (count === indexes.length) {
          callback();
        }
      });
    } else {
      if (count === indexes.length) {
        callback();
      }
    }
  }
}

// remove data from indexes.  this needs to be the original record,
// not just an id.  updates should occur outside of this interface
// by removing then re-adding records.
function remove (id, entry, callback) {
  if (ids.indexOf(id) !== -1) {
    ids.splice(ids.indexOf(id), 1);
  }

  if (indexes.length === 0) {
    callback();
    return;
  }

  var count = 0;

  for (var i = 0; i < indexes.length; i++) {
    var index = indexes[i];

    // if the property exists in the data, add it to the index
    var property = utils.propertyFromData(entry, index.property);
    count++;

    if (property !== undefined && typeof property !== 'object') {
      index.index.remove(property, id, function (err, data) {
        if (count === indexes.length) {
          callback();
        }
      });
    } else {
      if (count === indexes.length) {
        callback();
      }
    }
  }
}





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
