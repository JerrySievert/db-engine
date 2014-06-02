/*
{
  "$and": {
    "$or": {
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
*/


/*
arguments -> array of objects
*/
function and ( ) {
  if (arguments.length === 0) {
    return { };
  } else if (arguments.length === 1) {
    return arguments[0];
  } else {
    var out = arguments[0];

    for (var i = 1; i < arguments.length; i++) {
      var keys = Object.keys(arguments[i]);

      for (var j = 0; j < keys.length; j++) {
        if (out[keys[j]] !== arguments[i][keys[j]]) {
          delete out[keys[j]];
        }
      }
    }

    return out;
  }
}

function or ( ) {
  if (arguments.length === 0) {
    return { };
  } else if (arguments.length === 1) {
    return arguments[0];
  } else {
    var out = arguments[0];

    for (var i = 1; i < arguments.length; i++) {
      var keys = Object.keys(arguments[i]);

      for (var j = 0; j < keys.length; j++) {
        out[keys[j]] = arguments[i][keys[j]];
      }
    }

    return out;
  }
}
