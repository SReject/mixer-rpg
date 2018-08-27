const {players, push, pull} = require('../misc/db.js');

const ftySeen = require('./seen.js');
const ftyCurrency = require('./currency.js');
const ftyDailyReward = require('./dailyreward.js');
const ftyProwess = require('./prowess.js');
const ftyEquiped = require('./equiped.js');
const ftyStats = require('./stats.js');
const ftyGroups = require('./groups.js');
const ftyBackpack = require('./backpack.js');

// filled in by mixer/simple-mixer-client.js
let request;

function ftyPlayer(id) {

    let player = {

        // player.id
        get id() {
            return id;
        },

        // player.username
        get username() {
            return pull(players, `/${id}/username`, {default: '[unknown]'});
        },
        set username(value) {
            this.seen.updated = Date.now();
            push(players, `/${id}/username`, value || '');
        }
    };

    // player.seen
    // Must happen first so default fills can update player.seen.updated
    ftySeen(player);

    // player.currency
    ftyCurrency(player);

    // player.dailyreward
    ftyDailyReward(player);

    // player.prowess
    ftyProwess(player);

    // player.equiped
    ftyEquiped(player);

    // player.stats
    ftyStats(player);

    // player.groups
    ftyGroups(player);

    // player.backpack
    ftyBackpack(player);

    // return player object
    return player;
}

module.exports = async function player(id, opts = {}) {

    // attempt to retrieve player info from database
    try {
        players.getData(`/${id}`);

    } catch (e) {

        // player doesn't exist
        if (e.name === 'DataError' && /^Can't find dataPath:/.test(e.message)) {
            if (opts.create !== true) {
                return;
            }

            let username = opts.username || '';
            if (opts.norequest !== true) {
                // attempt to retrieve user info from mixer api
                let user = await request('GET', `users/${id}`);
                if (user.statusCode !== 200) {
                    throw new Error(user.message);
                }
                username = user.username;
            }

            // create db entry for the user
            push(players, `/${id}`, {
                id: id,
                username: username
            });

        } else {

            // An error occured durring look up; rethrow error
            throw e;
        }
    }

    // call player factory function
    return ftyPlayer(id);
};

module.exports.setRequestRunner = function setRequestRunner(requestRunner) {
    request = requestRunner;
    delete module.exports.setRequestRunner;
};

module.exports.exists = function (userid) {
    return pull(players, `/${userid}`, {default: null}) !== null;
};