const {players, push, pull} = require('../misc/db.js');

module.exports = function factorySeen(player) {
    let id = player.id,
        seen;

    Object.defineProperty(player, 'seen', {
        enumerable: true,

        get () {
            if (seen === undefined) {
                seen = pull(players, `/${id}/seen`, {
                    default: {},
                    write: true
                });
            }

            return {

                // seen.created
                get created() {
                    if (seen.created === undefined) {
                        seen.created = pull(players, `/${id}/seen/created`, {
                            default: Date.now(),
                            write: true,
                            wrote: () => player.seen.updated = Date.now()
                        });
                    }
                    return seen.created;
                },


                // seen.updated
                get updated() {
                    if (seen.updated === undefined) {
                        seen.updated = pull(players, `/${id}/seen/updated`, {
                            default: Date.now(),
                            write: true
                        });
                    }
                    return seen.updated;
                },
                set updated(value) {
                    push(players, `/${id}/seen/updated`, value);
                    seen.updated = value;
                },


                // seen.active
                get active() {
                    if (seen.active === undefined) {
                        seen.active = pull(players, `/${id}/seen/active`, {
                            default: this.created,
                            write: true,
                            wrote: () => player.seen.updated = Date.now()
                        });
                    }
                    return seen.active;
                },
                set active(value) {
                    push(players, `/${id}/seen/active`, value);
                    seen.updated = value;

                    player.seen.updated = Date.now();
                }
            };
        }
    });
};