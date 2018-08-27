// native module imports
const PATH = require('path');

// dependency module imports
const JsonDb = require('node-json-db');


const dbdir = PATH.join(__dirname, '../../db/');

// database instances
module.exports.players = new JsonDb(PATH.join(dbdir, 'players.json'), true, true);
module.exports.settings = new JsonDb(PATH.join(dbdir, 'settings.json'), true, true);
module.exports.game = new JsonDb(PATH.join(dbdir, 'game.json'), true, true);


module.exports.push = function push(db, path, value) {
    db.push(path, value);
};

module.exports.pull = function pull(db, path, opts = {}) {
    try {
        return db.getData(path);

    } catch (e) {
        if (opts.default !== undefined && e.name === 'DataError' && /^Can't find dataPath:/.test(e.message)) {
            if (opts.write) {
                db.push(path, opts.default);

                if (opts.wrote) {
                    opts.wrote(opts.default);
                }
            }
            return opts.default;
        }
        throw e;
    }
};



