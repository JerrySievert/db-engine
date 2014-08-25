function propertyFromData (data, key) {
  var parts = key.split('.');

  var part = parts.shift();
  while (part && (data = data[part]) !== undefined) {
    part = parts.shift();
  }

  return data;
}

function compare (operation, data) {
  /*
  {
    operand: "equals",
    key: "crime.type",
    value: "Arson"
  }
  */
  var key = operation.key;
  var value = operation.value;
  var operand = operation.operand;
  var against = propertyFromData(data, key);

  if (operand === 'equals') {
    if (value === against) {
      return true;
    }
  } else if (operand === 'gt') {
    if (against > value) {
      return true;
    }
  } else if (operand === 'gte') {
    if (against >= value) {
      return true;
    }
  } else if (operand === 'lt') {
    if (against < value) {
      return true;
    }
  } else if (operand === 'lte') {
    if (against <= value) {
      return true;
    }
  } else if (operand === 'between') {
    if (Array.isArray(value) && value.length === 2) {
      if (value[0] > value[1]) {
        if (against <= value[0] && against >= value[1]) {
          return true;
        }
      } else {
        if (against <= value[1] && against >= value[0]) {
          return true;
        }
      }
    }
  }

  return false;
}

exports.propertyFromData = propertyFromData;
exports.compare = compare;
