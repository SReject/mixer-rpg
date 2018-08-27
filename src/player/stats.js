// custom module imports
const {has} = require('../misc/util.js');

function calcStats(player, stat) {
    let res = 0;
    for (let item in player.equiped) {
        if (has(player.equiped, item)) {
            res += player.equiped[item][stat];
        }
    }
    res += player.prowess[stat];
    return res;
}


module.exports = function factoryStats(player) {
    Object.defineProperty(player, 'stats', {
        enumerable: true,
        value: Object.create(null, {
            strength: {
                enumerable: true,
                get () {
                    return calcStats(player, 'strength');
                }
            },

            accuracy: {
                enumerable: true,
                get () {
                    return calcStats(player, 'accuracy');
                }
            },

            wisdom: {
                enumerable: true,
                get () {
                    return calcStats(player, 'wisdom');
                }
            }
        })
    });
};