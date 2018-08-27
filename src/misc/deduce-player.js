const players = require('../player/index.js');

module.exports = async function getPlayerFromToken(mixer, player, token) {

    if (!token) {
        return player;
    }

    /* token is user tag */
    if (token.type === 'tag') {

        // tagged player exists
        if (players.exists(token.id)) {
            return players(token.id);
        }

        throw new Error(`${token.username} hasn't started playing`);
    }

    /* token is not text */
    if (token.type !== 'text') {
        throw new Error('invalid username specified');
    }

    // token was text
    // normalize the token
    token = token.text
        .trim()
        .replace(/^@+/, '')
        .toLowerCase();

    /* token is the issuer */
    if (player.username === token) {
        return player;
    }

    /* token contains illegal characters */
    if (/[\\/{}[\]?&:%*+@]/.test(token)) {
        throw new Error('Invalid username specified');
    }

    // trade token for id
    let user = await mixer.request('GET', `channels/${token}`);
    if (user.status !== 200) {
        throw new Error(`failed to retrieve user id for ${token}`);
    }

    // retrieve user data from response
    user = user.body.user;

    // channel id is that of the player
    // shouldn't happen but better to overbuild
    if (user.id === player.id) {
        return player;
    }

    // player exists in DB
    if (players.exists(user.id)) {
        return players(user.id);
    }

    throw new Error(`${token} hasn't started playing`);
};