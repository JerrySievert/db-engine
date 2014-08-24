
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



function parseQuery (query) {
  var keys = Object.keys(query);
  var operand;

  if (keys.length > 1) {
    throw new Error("Parse Error: More than one operation");
  }

  if (keys[0] === "$and" || keys[0] === "$or") {
    operand = {
      operand: keys[0],
      value: [ ]
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
        value: query[keys[0]]
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
        value: query[keys[0]][innerKeys[0]]
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

function runQuery (tree, index, store, callback) {
  var keys = Object.keys(tree);
  var key = keys[0];

  if (key === "$and" || key === "$or") {
    var len = tree[key].length;
    var done = 0;

    for (var i = 0; i < len; i++) {

    }
  } else {
    index.searchIndexes(tree[key], function (err, results, metrics) {
      if (err === "no indexes for query") {
        // simplistic version - this needs to be refactored to do a single
        // table scan for all clauses

        // need to do a full table scan
      } else {
        callback(null, results, metrics);
      }
    });
  }
}


exports.and = and;
exports.or  = or;
exports.parseQuery = parseQuery;
