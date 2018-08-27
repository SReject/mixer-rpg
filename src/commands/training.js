// custom module imports
const missions = require('../data/training.json');

module.exports = function factoryTraining(register) {
    register({
        name: 'training',
        help: 'Train for a chance to increase stats or find items',
        config: {
            command: '-train',
            response: 'whisper',
            cost: 250
        },
        handle: async function (manager, config, player) {

            if (player.currency < config.cost) {
                manager.whisper(`You do not have the ${config.cost} ${manager.currencyName} required to train`);

            } else {

                // retrieve random mission
                let mission = missions[Math.floor(Math.random() * missions.length)];

                // add bonuses to the player
                player.prowess.strength = Math.max(player.prowess.strength + mission.strength, 0);
                player.prowess.accuracy = Math.max(player.prowess.accuracy + mission.accuracy, 0);
                player.prowess.wisdom = Math.max(player.prowess.wisdom + mission.wisdom, 0);
                player.currency = Math.max(player.currency + mission.currency - config.cost, 0);

                // Output message
                let msg = `${mission.text} || Bonus: ${mission.strength}/${mission.accuracy}/${mission.wisdom} || ${mission.currency} ${manager.currencyName}`;
                manager.reply(msg);
            }
        }
    });
};