const stats = ['strength', 'accuracy', 'wisdom'];

module.exports = function (player1, player2, rounds = 3) {

    let result = {
        winner: 0,
        rounds: [],
        wins: {
            p1: 0,
            tie: 0,
            p2: 0
        }
    };

    while (rounds > 0) {

        // Pick a stat
        let stat = stats[Math.floor(Math.random() * 3)];

        // Roll for player one
        let p1StatRoll = Math.round(Math.random() * player1[stat]);
        let p1Bonus = Math.round(Math.random() * 15) + 3; // to keep it interesting
        let p1Roll = p1StatRoll + p1Bonus;

        // Roll for player two
        let p2StatRoll = Math.round(Math.random() * player2[stat]);
        let p2Bonus = Math.round(Math.random() * 15) + 3; // to keep it interesting
        let p2Roll = p2StatRoll + p2Bonus;


        // build round info
        let roundResult = {
            stat: stat,
            player1: {
                base: player1[stat],
                statRoll: p1StatRoll,
                bonusRoll: p1Bonus,
                roll: p1Roll
            },
            player2: {
                base: player2[stat],
                statRoll: p2StatRoll,
                bonusRoll: p2Bonus,
                roll: p2Roll
            }
        };

        // Player1 wins round
        if (p1Roll > p2Roll) {
            result.winner -= 1;
            result.wins.p1 += 1;
            roundResult.winner = 'player1';

        // Player2 wins round
        } else if (p1Roll < p2Roll) {
            result.winner += 1;
            result.wins.p2 += 1;
            roundResult.winner = 'player2';

        // Tie round
        } else {
            result.wins.tie += 1;
            roundResult.winner = 'tie';
        }

        // store round info
        result.rounds.push(roundResult);

        // log for interest
        console.log(`Round #${rounds} - ${stat}: ${p1Roll} vs ${p2Roll}`);

        rounds -= 1;
    }

    // Delete potions if equiped
    try {
        player1.equiped.potion.unequip();
    } catch (e) {} // eslint-disable-line no-empty
    try {
        player2.equiped.potion.unequip();
    } catch (e) {} // eslint-disable-line no-empty

    // return battle result
    return result;
};