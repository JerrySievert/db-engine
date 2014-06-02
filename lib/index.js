var utils = require('./utils');

var indexes = [ ];
var ids = [ ];
var store;

/*

index search:
argument - 'Arson'
input - { 1, 4, 'abc' }
store - store for looking up values
optionalCallback - callback, or promise if no callback
index.equals(argument, input, store, optionalCallback) {
  if (!optionalCallback) {
    // use promise
  } else {
    optionalCallback(err, output);
  }
}
*/


/*
{
  property: "crime",
  index: new BTree()
}
*/
function addIndex (index, callback) {
  // create all entries in the index
  if (ids.length) {
    var count = 0;

    for (var i = 0; i < ids.length; i++) {
      store.get(ids[i], function (err, data, id) {
        if (!err) {
          // if the property exists in the data, add it to the index
          var property = data ? utils.propertyFromData(data, index.property) : undefined;
          count++;

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

/*
{
  "and": {
    "or": {
      "name": {
        "equals": "Main"
      },
      "crime.type": {
        "equals": "Arson"
      }
    },
    {
      "date": {
        "between": [ '2013-11-30', '2014-01-01' ]
      }
    }
  }
}

if the type isn't found, try a generic search against the backing store:

  store.equals(key, value)
  store.lt(key, value)
  store.lte(key, value)
  store.gt(key, value)
  store.gte(key, value)
  store.between(key, [ value1, value2 ])
  store.like(key, value)
  store.regex(key, value)

*/

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

function searchIndexes (query, callback) {
  var results = { };
  var indexesToQuery = [ ];
  var metrics = [ ];

  for (var i = 0; i < indexes.length; i++) {
    if (indexes[i].property === query.key && indexes[i].index[query.type]) {
      indexesToQuery.push(indexes[i]);
    }
  }

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

function setBackingStore (backingstore) {
  store = backingstore;
}

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
