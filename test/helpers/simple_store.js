// add, get, update, remove

function SimpleStore ( ) {
  // public for inspection
  this.store = { };
}

SimpleStore.prototype.add = function (key, value, callback) {
  this.store[key] = value;

  if (callback) {
    callback();
  }
};

SimpleStore.prototype.update = SimpleStore.prototype.add;

SimpleStore.prototype.get = function (key, callback) {
  if (callback) {
    callback(null, this.store[key], key);
  } else {
    return this.store[key];
  }
};

SimpleStore.prototype.remove = function (key, callback) {
  delete this.store[key];

  if (callback) {
    callback();
  }
};

exports.SimpleStore = SimpleStore;
