const {players, push, pull} = require('../misc/db.js');

module.exports = function factoryProwess(player) {
    let id = player.id,
        prowess;

    Object.defineProperty(player, 'prowess', {
        enumerable: true,
        get() {
            if (prowess === undefined) {
                prowess = pull(players, `/${id}/prowess`, {
                    default: {},
                    write: true,
                    wrote: () => player.seen.updated = Date.now()
                });
            }

            return {

                // prowess.strength
                get strength() {
                    if (prowess.strength === undefined) {
                        prowess.strength = pull(players, `/${id}/prowess/strength`, {
                            default: 0,
                            write: true,
                            wrote: () => player.seen.updated = Date.now()
                        });
                    }

                    return prowess.strength;
                },
                set strength(value) {
                    push(players, `/${id}/prowess/strength`, value);
                    prowess.strength = value;

                    player.seen.updated = Date.now();
                },

                // prowess.accuracy
                get accuracy() {
                    if (prowess.accuracy === undefined) {
                        prowess.accuracy = pull(players, `/${id}/prowess/accuracy`, {
                            default: 0,
                            write: true,
                            wrote: () => player.seen.updated = Date.now()
                        });
                    }

                    return prowess.accuracy;
                },
                set accuracy(value) {
                    push(players, `/${id}/prowess/accuracy`, value);
                    prowess.accuracy = value;

                    player.seen.updated = Date.now();
                },

                // prowess.wisdom
                get wisdom() {
                    if (prowess.wisdom === undefined) {
                        prowess.wisdom = pull(players, `/${id}/prowess/wisdom`, {
                            default: 0,
                            write: true,
                            wrote: () => player.seen.updated = Date.now()
                        });
                    }

                    return prowess.wisdom;
                },
                set wisdom(value) {
                    push(players, `/${id}/prowess/wisdom`, value);
                    prowess.wisdom = value;

                    player.seen.updated = Date.now();
                }

            };
        }
    });
};