// native module imports
const {randomBytes} = require('crypto');

// custom module imports
const generate = require('./_generate.js');
const battle = require('./_battle.js');
const {game, push, pull} = require('../misc/db.js');
const players = require('../player/index.js');


function genStats(total) {
    let stats = {
        strength: 0,
        accuracy: 0,
        wisdom: 0
    };

    // calculate strength: 25-50% of total
    stats.strength = Math.ceil(((Math.floor(Math.random() * 25) + 25) / 100) * total);
    total -= stats.strength;

    // calculate boss accuracy: 25-75% of remaining total
    stats.accuracy = Math.ceil(((Math.floor(Math.random() * 50) + 25) / 100) * total);
    total -= stats.accuracy;

    // wisdom is whatever is left over
    stats.wisdom = total;

    // return stats
    return stats;
}


let boss,
    mixer,
    equipCommand,
    sellCommand,
    currencyName;

function bossBattle() {
    game.delete('/boss');

    // Expired while chat was not connected or no players joined
    if (!boss || !mixer) {
        return;
    }

    // calculate total player stats
    let playerList,
        playerStats = {
            strength: 0,
            accuracy: 0,
            wisdom: 0
        };

    boss.players.forEach(id => {
        if (players.exists(id)) {
            let player = players(id);
            playerList.push(player);
            playerStats.strength += player.stats.strength;
            playerStats.accuracy += player.stats.accuracy;
            playerStats.wisdom += player.stats.wisdom;


            // now that the player's stats have been added, remove the player's potion
            try {
                player.equiped.potion.unequip();
            } catch (ignore) {} // eslint-disable-line no-empty
        }
    });

    // valid players were found
    if (playerList.length) {

        // calcuate the total stats sum for the boss
        let bStatsTotal = Math.ceil(playerList.length * 30 * 7);
        bStatsTotal = Math.max(bStatsTotal, boss.minstats);
        bStatsTotal *= (boss.difficulty || 1);

        // time to battle!
        let result = battle(genStats(bStatsTotal), playerStats, 5);

        // boss won
        if (result.winner < 0) {
            mixer.broadcast(`The party of viewers failed to defeat the ${boss.name} (${result.wins.p2}-${result.wins.ties}-${result.wins.p1})`);

        // tie or players won
        } else {

            // generate trophy
            let trophy = Object.assign({
                type: 'trophy',
                name: boss.trophy || 'Gold Statue',
                id: `t${randomBytes(2).toString('hex')}`
            }, genStats(40));

            // Give each player their trophy and reward currency
            playerList.forEach(player => {
                player.backpack.store(trophy, {forcedId: trophy.id});
                if (boss.reward > 0) {
                    player.currency += boss.reward;
                }
            });

            // build second message to broad cast
            let msg2 = `Each player found a ${trophy.name}`;
            if (boss.reward > 0) {
                msg2 += ` and ${boss.reward} ${currencyName}`;
            }
            msg2 += `! To equip: ${equipCommand} ${trophy.id} To Sell: ${sellCommand} ${trophy.id}`;

            // broadcast victory messages
            mixer.broadcast(`The party of viewers defeated the ${boss.name} (${result.wins.p2}-${result.wins.ties}-${result.wins.p1})`);
            mixer.boardcast(msg2);
        }

        // clear the boss data
        boss = null;
    }
}

module.exports = function factoryBoss(register) {

    sellCommand = register.sellCommand;
    equipCommand = register.equipCommand;
    currencyName = register.currencyName;

    boss = pull(game, '/boss', {default: null});

    if (boss != null) {

        // boss expired while boss was down; cleanup
        if (boss.expires < Date.now()) {
            game.delete('/boss');
            boss = null;


        } else {
            setTimeout(bossBattle, boss.expires - Date.now());
        }
    }

    // !rpg-boss
    register({
        name: 'boss',
        help: 'Joins a boss battle',
        isJoinBossCommand: true,
        config: {
            command: '-boss',
            disabled: false
        },
        handle: function handleCommandBoss(manager, config, player, msgdata) {
            mixer = manager.mixer;

            let params = msgdata.message.tokens;
            if (params.length > 1) {
                manager.whisper(`${manager.command}: Too many parameters`);

            } else if (!boss) {
                manager.whisper(`${manager.command}: There isn't a pending boss fight`);

            } else {
                boss.players.push(player.id);
                manager.reply('You have joined the boss fight!');

            }
        }
    });

    register({
        name: 'bossstart',
        help: 'Starts a boss battle',
        format: '[duration]',
        config: {
            command: '-bossstart',
            disabled: true,
            duration: 300,
            minstats: 1050,
            overrides: [
                {
                    name: 'role:mod',
                    disabled: false
                },
                {
                    name: 'role:owner',
                    disabled: false
                }
            ]
        },
        handle: function handleCommandBossStart(manager, config, player, msgdata) {
            mixer = manager.mixer;


            let params = msgdata.message.tokens;
            if (params.length > 2) {
                manager.whisper(`${manager.command}: Too many parameters`);

            } else if (boss) {
                manager.whisper(`${manager.command}: There is already a pending boss fight`);

            } else {

                // deduce duration
                let duration = params.length === 2 ? params[1].text : config.duration;
                duration = Number(String(duration).trim().toLowerCase());

                // validate duration
                if (
                    isNaN(duration) ||
                    !isFinite(duration) ||
                    parseInt(duration) !== duration ||
                    duration < 60
                ) {
                    manager.whisper(`${manager.command}: Invalid duration for the boss fight; must be atleast 60s`);

                // generate the boss
                } else {

                    // generate the boss
                    let genBoss = generate.boss();
                    boss = {

                        minstats: config.minstats || 1050,
                        duration: duration,
                        expires: Date.now() + (duration * 1000),

                        name: genBoss.name,
                        trophy: genBoss.trophy,
                        difficulty: genBoss.difficulty,
                        reward: genBoss.reward || 500,

                        players: []
                    };

                    // store it
                    push(game, '/boss', boss);

                    // Start timeout of when the boss battle will be decided
                    setTimeout(bossBattle, duration * 1000);

                    // broadcast the approach
                    manager.broadcase(`A ${boss.name} is approaching! Use ${register.joinBossCommand} to join the battle`);
                }
            }
        }
    });
};