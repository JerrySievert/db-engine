// a very simple index, for testing and the ilk

function SimpleIndex ( ) {
  // public for inspection
  this.entries = { };
  this.constructor = 'SimpleIndex';
}

SimpleIndex.prototype.add = function (value, id, callback) {
  if (this.entries[value] === undefined) {
    this.entries[value] = [ ];
  }

  this.entries[value].push(id);

  if (callback) {
    callback();
  }
};

SimpleIndex.prototype.remove = function (value, id, callback) {
  if (this.entries[value]) {
    var index = this.entries[value].indexOf(id);

    if (index !== -1) {
      this.entries[value].splice(index, 1);

      if (this.entries[value].length === 0) {
        delete this.entries[value];
      }
    }
  }

  if (callback) {
    callback();
  }
};

SimpleIndex.prototype.equals = function (value, callback) {
  if (callback) {
    callback(null, this.entries[value]);
  } else {
    return this.entries[value];
  }
};

exports.SimpleIndex = SimpleIndex;
