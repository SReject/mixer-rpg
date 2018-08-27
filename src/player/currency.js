const {players, push, pull} = require('../misc/db.js');

module.exports = function factoryCurrency(player) {
    let id = player.id;
    let currency;

    Object.defineProperty(player, 'currency', {
        enumerable: true,
        get () {
            if (currency !== undefined) {
                return currency;
            }

            return currency = pull(players, `/${id}/currency`, {
                default: 0,
                write: true,
                wrote: () => player.seen.updated = Date.now()
            });
        },
        set (value) {
            push(players, `/${id}/currency`, value);
            currency = value;

            player.seen.updated = Date.now();
        }
    });
};