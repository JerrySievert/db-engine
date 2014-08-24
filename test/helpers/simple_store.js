var Readable = require('stream').Readable;
var util = require('util');

// implementation of a simple stream
util.inherits(SimpleStream, Readable);

function SimpleStream (opt) {
  Readable.call(this, opt);
  this._store = opt.store;
  this._keys = Object.keys(this._store);
  this._current = 0;
}

SimpleStream.prototype._read = function() {
  if (this._current === this._keys.length) {
    this.push(null);
  } else {
    var key = this._keys[this._current];
    var value = this._store[key];

    this._current++;
    this.push({ key: key, value: value });
  }
};



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

SimpleStore.prototype.createReadStream = function ( ) {
  var stream = new SimpleStream({ objectMode: true, store: this.store });

  return stream;
};

exports.SimpleStore = SimpleStore;
