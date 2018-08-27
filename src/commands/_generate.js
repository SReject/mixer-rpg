// custom module imports
const {pick} = require('../misc/util.js');

// data imports
const items = require('../data/items.json');
const monsters = require('../data/monsters.json');

const generateItem = (...args) => {
    let attr1 = pick(args[0]),
        attr2 = pick(args[1]),
        attr3 = pick(args[2]);

    return {
        name: `${attr1.name} ${attr2.name} ${attr3.name}`.trim(),
        strength: attr1.strength + attr2.strength + attr3.strength,
        accuracy: attr1.accuracy + attr2.accuracy + attr3.accuracy,
        wisdom: attr1.wisdom + attr2.wisdom + attr3.wisdom
    };
};

let defList = [{name: '', strength: 0, accuracy: 0, wisom: 0}];

module.exports = {

    // coins
    coins: () => pick(items.currency),

    // equipables
    title: () => generateItem(items.titleType, items.title, defList),
    melee: () => generateItem(items.weaponTypeOne, items.weaponTypeTwo, items.meleeWeapon),
    ranged: () => generateItem(items.weaponTypeOne, items.weaponTypeTwo, items.rangedWeapon),
    magic: () => generateItem(items.magicType, items.elements, items.magicSpell),
    armor: () => generateItem(items.weaponTypeOne, items.resourceType, items.armor),
    mount: () => generateItem(items.weaponTypeOne, items.creatureAttribute, items.creatureName),
    companion: () => generateItem(items.weaponTypeOne, items.creatureAttribute, items.companion),
    potion: () => generateItem(items.potionTypeOne, items.potionTypeTwo, items.potionTypeThree),
    trophy: () => generateItem(items.trophy, defList, defList),

    // Monsters
    monster: () => {
        return {
            name: `${pick(monsters.creatureAttribute)} ${pick(monsters.monster)}`,
            strength: Math.floor(Math.pickom() * 46) + 9, // 9d6
            accuracy: Math.floor(Math.pickom() * 46) + 9, // 9d6
            wisdom: Math.floor(Math.pickom() * 46) + 9 // 9d6
        };
    },

    // todo
    boss: function () {
        let attr = pick(monsters.createAttribute);
        let monster = pick(monsters.bossFight);
        return {
            name: `${attr} ${monster.name}`,
            trophy: monster.trophy,
            difficulty: monster.difficulty || 1,
            reward: monster.reward || 0
        };
    },
    raid: function () {
    }
};