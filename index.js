var index = require('./lib/index');
var query = require('./lib/query');

function Database (/* store, indexes, callback */) {
  var args = Array.prototype.slice.call(arguments);

  this.store = args.shift();
  this.index = new index();

  var callback = args.pop();

  var keys = [ ];

  var stream = this.store.createReadStream();
  var self = this;

  stream.on('data', function streamData (data) {
    keys.push(data.key);
  });

  stream.on('end', function streamEnd ( ) {
    self.index.keys = keys;

    if (args.length === 1) {
      var indexes = args.unshift();
      var count = 0;

      for (var i = 0; i < indexes.length; i++) {
        self.index.addIndex(indexes[i], function indexCallback ( ) {
          count++;

          if (count === indexes.length) {
            callback();
          }
        });
      }
    } else {
      callback();
    }
  });
}

Database.prototype.addIndex = function addIndex (index, callback) {
  this.index.addIndex(index, callback);
};

Database.prototype.add = function add (key, value, callback) {
  var self = this;

  this.store.add(key, value, function addCallback (err) {
    if (err) {
      callback(err);
    } else {
      self.index.add(key, value, callback);
    }
  });
};

Database.prototype.remove = function remove (key, callback) {
  var self = this;

  this.index.remove(key, function removeCallback (err) {
    if (err) {
      callback(err);
    } else {
      self.store.remove(key, callback);
    }
  });
};

Database.prototype.parseQuery = function parseQuery (search) {
  return query.parseQuery(search);
};

Database.prototype.query = function query (tree, callback) {
  query.runQuery(tree, callback);
};

module.exports = exports = Database;
