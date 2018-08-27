const {players, push, pull} = require('../misc/db.js');

module.exports = function factoryDailyReward(player) {
    let id = player.id;

    let dailyreward;

    Object.defineProperty(player, 'dailyreward', {
        enumerable: true,

        get () {
            if (dailyreward === undefined) {
                dailyreward = pull(players, `/${id}/dailyreward`, {
                    default: 0,
                    write: true,
                    wrote: () => player.seen.updated = Date.now()
                });
            }

            return dailyreward;
        },
        set (value) {
            push(players, `/${id}/dailyreward`, value);
            dailyreward = value;
            player.seen.updated = Date.now();
        }
    });
};