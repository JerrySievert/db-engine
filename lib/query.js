var utils = require('./utils');

/*
{
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
}

{
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
}

{
  "foo": "bar"
}

{
  operand: "equals",
  key: "foo",
  value: "bar"
}

{
  "crime.type": {
    equals: "Arson"
  }
}

{
  operand: "equals",
  key: "crime.type",
  value: "Arson"
}

*/


// parse the query, turn it into a tree
function parseQuery (query) {
  var keys = Object.keys(query);
  var operand;

  if (keys.length > 1) {
    throw new Error("Parse Error: More than one operation");
  }

  if (keys[0] === "$and" || keys[0] === "$or") {
    operand = {
      operand: keys[0],
      value: [ ],
      order: query.order
    };

    if (Array.isArray(query[keys[0]]) === false) {
      throw new Error("Parse Error: Argument to " + keys[0] + " should be an Array");
    }

    for (var i = 0; i < query[keys[0]].length; i++) {
      operand.value.push(parseQuery(query[keys[0]][i]));
    }
  } else {
    if (typeof query[keys[0]] === 'string') {
      operand = {
        operand: "equals",
        key: keys[0],
        value: query[keys[0]],
        order: query[keys[0]].order
      };
    } else if (typeof query[keys[0]] === 'object' && Array.isArray(query[keys[0]])) {
      throw new Error("Parse Error: Value of " + keys[0] + " should not be an Array");
    } else if (typeof query[keys[0]] !== 'object') {
      throw new Error("Parse Error: Value of " + keys[0] + " should not be " + typeof query[keys[0]]);
    } else {
      var innerKeys = Object.keys(query[keys[0]]);

      if (innerKeys.length !== 1) {
        throw new Error("Parse Error: Value of " + keys[0] + " should contain a single entry");
      }

      operand = {
        operand: innerKeys[0],
        key: keys[0],
        value: query[keys[0]][innerKeys[0]],
        order: query[keys[0]][innerKeys[0]].order
      };
    }
  }

  return operand;
}


/*
arguments -> array of keys
*/
function or ( ) {
  if (arguments.length === 0) {
    return [ ];
  } else if (arguments.length === 1) {
    return arguments[0];
  } else {
    var arr = [ ];
    var out = [ ];

    for (var i = 0; i < arguments.length; i++) {
      arr = arr.concat(arguments[i]);
    }

    var len = arr.length;

    while (len--) {
      var item = arr[len];

      if (out.indexOf(item) === -1) {
        out.unshift(item);
      }
    }

    return out;
  }
}

function and ( ) {
  var arr1, arr2;

  if (arguments.length === 0) {
    return [ ];
  } else if (arguments.length === 1) {
    return arguments[0];
  } else if (arguments.length === 2) {
    arr1 = arguments[0];
    arr2 = arguments[1];
    var out = [ ];

    // return only those elements in both arrays
    for (var i = 0; i < arr1.length; i++) {
      if (arr2.indexOf(arr1[i]) !== -1) {
        out.push(arr1[i]);
      }
    }

    return out;
  } else {
    // convenience of array is nice
    var args = Array.prototype.slice.call(arguments);

    arr1 = args.pop();
    arr2 = and.apply(null, args);

    return and(arr1, arr2);
  }
}

function sort (order, fields, metrics, callback) {
  // sort the array, with access to fields and order
  function compare (a, b) {
    for (var i = 0; i < fields.length; i++) {
      var field;
      var direction = 1;

      var tfield = String(fields[i]);
      if (tfield[0] === '+' || tfield[0] === '-') {
        field = tfield.substr(1);
        if (tfield[0] === '-') {
          direction = -1;
        }
      } else {
        field = tfield;
      }

      if (a.value[field] > b.value[field]) {
        return direction;
      } else if (a.value[field] < b.value[field]) {
        return -direction;
      }
    }

    return 0;
  }

  order = order.sort(compare);

  var ret = [ ];

  for (var i = 0; i < order.length; i++) {
    ret.push(order[i].key);
  }

  callback(null, ret, metrics);
}

function runQuery (tree, index, store, callback) {
  _internalQuery(tree, index, store, function internalQueryCallback (err, keys, metrics) {
    if (err) {
      return callback(err, keys, metrics);
    }

    // check for order by
    if (tree.order === undefined || tree.order.length === 0) {
      return callback(err, keys, metrics);
    }

    // select only the fields that we want to order by
    var order = [ ];
    var i;
    var count = 0;
    var fields = [ ];

    for (i = 0; i < tree.order.length; i++) {
      var field;

      var tfield = String(tree.order[i]);
      if (tfield[0] === '+' || tfield[0] === '-') {
        field = tfield.substr(1);
      } else {
        field = tfield;
      }

      fields.push(field);
    }

    for (var k = 0; k < keys.length; k++) {
      var cb = function (currentKey) {
        return function (err, data) {
          count++;

          var entry = {
            key: currentKey,
            value: { }
          };

          for (var i = 0; i < fields.length; i++) {
            entry.value[fields[i]] = utils.propertyFromData(data, fields[i]);
          }

          order.push(entry);

          if (count === keys.length) {
            sort (order, tree.order, metrics, callback);
          }
        };
      };

      store.get(keys[k], cb(keys[k]));
    }
  });
}

function _internalQuery (tree, index, store, callback) {
  if (tree.operand === "$and" || tree.operand === "$or") {
    var len = tree.value.length;
    var done = 0;
    keys = [ ];
    var compiledMetrics = [ ];
    var startTime = Date.now();

    // for every subquery in the query, run each branch recursively,
    // and deal with the results
    for (var i = 0; i < len; i++) {
      _internalQuery(tree.value[i], index, store, function queryCallback (err, results, metrics) {
        compiledMetrics = compiledMetrics.concat(metrics);

        if (results.length) {
          keys.push(results);
        }

        done++;
        if (done === len) {
          if (tree.operand === "$and") {
            results = and.apply(null, keys);
          } else {
            results = or.apply(null, keys);
          }

          metrics = {
            operand: tree.operand,
            startTime: startTime,
            endTime: Date.now(),
            resultsFound: results ? results.length : 0
          };

          compiledMetrics.push(metrics);

          callback(null, results, compiledMetrics);
        }
      });

    }
  } else {
    index.searchIndexes(tree, function indexCallback (err, results, metrics) {
      if (err === "no indexes for query") {
        // simplistic version - this needs to be refactored to do a single
        // table scan for all clauses

        // need to do a full table scan
        var startTime = Date.now();

        var stream = store.createReadStream();
        results = [ ];

        stream.on('data', function streamData (data) {
          var result = utils.compare(tree, data.value);
          if (result) {
            results.push(data.key);
          }
        });

        stream.on('end', function streamEnd ( ) {
          var metrics = {
            indexType: 'table scan',
            operand: tree.operand,
            key: tree.key,
            startTime: startTime,
            endTime: Date.now(),
            resultsFound: results ? results.length : 0
          };

          callback(null, results, [ metrics ]);
        });
      } else {
        callback(null, results, metrics);
      }
    });
  }
}


exports.and = and;
exports.or  = or;
exports.parseQuery = parseQuery;
exports.runQuery = runQuery;
