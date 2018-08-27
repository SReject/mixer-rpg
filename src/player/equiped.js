const {players, push, pull} = require('../misc/db.js');

function ftyEquip(player, equips, base, type, defaultName) {

    let id = player.id,
        item = {};

    // no entry for equips[type]
    if (equips[type] === undefined) {

        // attempt to pull the value from the database
        equips[type] = pull(players, `/${id}/equiped/${type}`, {
            default: {
                type: type,
                name: defaultName || 'none',
                strength: 0,
                accuracy: 0,
                wisdom: 0
            },
            write: true,
            wrote: () => player.seen.updated = Date.now()
        });
    }

    Object.defineProperties(item, {
        name: {
            enumerable: true,
            get () {
                return equips[type].name;
            },
            set (value) {
                push(players, `/${id}/equiped/${type}/name`, value);
                equips[type].name = value;
                player.seen.updated = Date.now();
            }
        },

        strength: {
            enumerable: true,
            get () {
                return equips[type].strength;
            },
            set (value) {
                push(players, `/${id}/equiped/${type}/strength`, value);
                equips[type].strength = value;
                player.seen.updated = Date.now();
            }
        },

        accuracy: {
            enumerable: true,
            get () {
                return equips[type].accuracy;
            },
            set (value) {
                push(players, `/${id}/equiped/${type}/accuracy`, value);
                equips[type].accuracy = value;
                player.seen.updated = Date.now();
            }
        },

        wisdom: {
            enumerable: true,
            get () {
                return equips[type].wisdom;
            },
            set (value) {
                push(players, `/${id}/equiped/${type}/wisdom`, value);
                equips[type].wisdom = value;
                player.seen.updated = Date.now();
            }
        },

        equip: {
            enumerable: true,
            value: function equip(item) {
                item.type = type;

                equips[type] = item;
                push(players, `/${id}/equiped/${type}`, item);
                player.seen.updated = Date.now();
            }
        },

        unequip: {
            enumerable: true,
            value: function unequip() {
                // get equipped item to return
                let item = pull(players, `/${id}/equiped/${type}`, {defualt: {type: type, name: 'none', strength: 0, accuracy: 0, wisdom: 0}});
                this.equip({name: 'none', strength: 0, accuracy: 0, wisdom: 0});

                return item;
            }
        }
    });

    Object.defineProperty(base, type, {
        enumerable: true,
        value: item
    });
}

module.exports = function factoryEquiped(player) {
    let id = player.id,
        equips,
        equiped = {};

    equips = pull(players, `/${id}/equiped`, {
        default: {},
        write: true,
        wrote: () => player.seen.updated = Date.now()
    });

    // player.equiped.title
    ftyEquip(player, equips, equiped, 'title', 'Commoner');

    // player.equiped.melee
    ftyEquip(player, equips, equiped, 'melee');

    // player.equiped.ranged
    ftyEquip(player, equips, equiped, 'ranged');

    // player.equiped.magic
    ftyEquip(player, equips, equiped, 'magic');

    // player.equiped.armor
    ftyEquip(player, equips, equiped, 'armor');

    // player.equiped.mount
    ftyEquip(player, equips, equiped, 'mount');

    // player.equiped.companion
    ftyEquip(player, equips, equiped, 'companion');

    // player.equiped.potion
    ftyEquip(player, equips, equiped, 'potion');

    // player.equiped.trophy
    ftyEquip(player, equips, equiped, 'trophy');

    // player.equiped
    Object.defineProperty(player, 'equiped', {
        enumerable: true,
        value: equiped
    });
};