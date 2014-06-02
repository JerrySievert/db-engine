function propertyFromData (data, key) {
  var parts = key.split('.');

  var part = parts.shift();
  while (part && (data = data[part]) !== undefined) {
    part = parts.shift();
  }

  return data;
}

exports.propertyFromData = propertyFromData;
