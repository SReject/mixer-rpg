const {game, push, pull} = require('../misc/db.js');

module.exports = function factoryDailyReward(register) {
    register({
        name: 'dailyreward',
        help: 'Gives the player a daily reward',
        config: {
            command: '-daily',
            deleteCommand: true,
            reward: 500,
            reset: 86400
        },
        handle: function (manager, config, player) {

            // Reset the global cool down if applicable
            let reset = pull(game, '/dailyreward/lastReset', {default: Date.now(), write: true});
            let nextReset = reset + (config.reset * 1000);

            if (Date.now() >= nextReset) {
                let reset = Date.now();
                push(game, '/dailyreward/lastReset', reset);
            }

            // retrieve the date of the last time the player collected the dailyreward
            // then calculate when they will be eligible for it again
            let last = player.dailyreward;
            let next = last + (config.reset * 1000);

            // if the last collection took place
            //   before the last reset OR
            //   the next time the user can collect has expired
            if (last < reset || next <= Date.now()) {
                player.dailyreward = Date.now();
                player.currency += config.reward;
                player.seen.active = Date.now();
                manager.reply(`Daily reward collected; You now have ${player.currency}${manager.currencyName}`);

            // Already collected
            } else {
                player.seen.active = Date.now();
                manager.whisper('You have already collected your daily reward');
            }
        }
    });

    register({
        name: 'dailyrewardreset',
        help: 'Resets the daily reward cooldown',
        config: {
            disabled: true,
            command: '-dailyreset',
            overrides: [
                {
                    name: 'role:owner',
                    disabled: false
                }
            ]
        },
        handle: function (manager) {
            push(game, '/dailyreward/lastReset', Date.now());
            manager.broadcast('RPG Daily reward cooldown has been reset');
        }
    });
};