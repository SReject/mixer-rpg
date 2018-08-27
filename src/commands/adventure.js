// custom module imports
const generate = require('./_generate.js');
const battle = require('./_battle.js');

module.exports = function factoryAdeventure(register) {

    // !rpg-adventure
    register({
        name: 'adventure',
        help: 'The player goes exploring with the chance to encounter monsters or find equipables',
        format: '',
        config: {
            command: '-adventure',
            response: 'broadcast',
            cost: 250,
            monsterReward: 1000
        },
        handle: async function (manager, config, player) {

            // make sure user has enough $$ to adventure
            if (player.currency < config.cost) {
                manager.whisper(`You do not have enough ${manager.currencyName} to go exploring.`);
            }

            // remove adventure cost
            player.currency -= config.cost;

            // pick a random event
            let msgBase, type, monster, fight, gen;
            switch (Math.floor(Math.random() * 20)) {

            // Title
            case 0:
            case 1:
                msgBase = 'won a title';
                type = 'title';
                break;

            // Melee Weapon
            case 2:
            case 3:
                msgBase = 'found a melee weapon';
                type = 'melee';
                break;

            // Ranged Weapon
            case 4:
            case 5:
                msgBase = 'found a ranged weapon';
                type = 'ranged';
                break;

            // Magic Spell
            case 6:
            case 7:
                msgBase = 'found a magic scroll';
                type = 'magic';
                break;

            // Armor
            case 8:
            case 9:
                msgBase = 'found some armor';
                type = 'armor';
                break;

            // Mount
            case 10:
            case 11:
                msgBase = 'tamed a mount';
                type = 'mount';
                break;

            // companion
            case 14:
                msgBase = 'discovered a companion';
                type = 'companion';
                break;

            // Potion
            case 12:
            case 13:
                msgBase = 'distilled a potion';
                type = 'potion';
                break;

            // Monster
            case 15:
            case 16:
                monster = generate.monster();
                fight = battle(player.stats, monster);

                // player won or tied
                if (fight.winner <= 0) {
                    player.currency += config.monsterReward;
                    manager.reply(`${player.username} defated a ${monster} and looted ${config.monsterReward} ${manager.currencyName}`);

                // monster won
                } else {
                    manager.reply(`${player.username} was defated by a ${monster}`);
                }
                return;

            // coins
            default:
                gen = generate.coins();
                player.currency += gen;
                manager.reply(`You found ${gen} ${manager.currencyName}!`);
                return;
            }

            // Generate Item
            let item = generate[type]();
            let id = player.backpack.store({
                type: type,
                item: item
            });

            manager.reply(`${player.username} ${msgBase}: ${item.name} (${item.strength}/${item.accuracy}/${item.wisdom}). To Equip: ${manager.equipCommand} ${id} - To Sell: ${manager.sellCommand} ${id}`);
        }
    });
};