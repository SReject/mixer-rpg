const {players, push, pull} = require('../misc/db.js');

module.exports = function factoryGroups(player) {
    let groups;

    Object.defineProperty(player, 'groups', {
        enumerable: true,
        get () {
            if (groups == null) {
                groups = pull(players, `/${player.id}/groups`, {
                    default: [],
                    write: true,
                    wrote: () => player.seen.updated = Date.now()
                });
            }
            return groups;
        },
        set (groups) {
            push(players, `/${player.id}/groups`, groups || []);
        }
    });
};