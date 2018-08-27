// navtive module imports
const PATH = require('path');

// dep module imports
const mixerClient = require('beam-client-node');
const {ShortcodeAuthClient, LocalTokenStore} = require('mixer-shortcode-oauth');

// custom module imports
const {settings, pull} = require('../misc/db.js');
const SimpleMixerClient = require('./simple-mixer-client.js');


module.exports = async function SimpleMixerClientFactory() {
    let clientId,
        channelId,
        mixer,
        scAuth;

    // Retrieve clientId
    clientId = pull(settings, '/clientId', {default: null});
    if (typeof clientId !== 'string') {
        throw new Error('Auth Error: clientId was not a string');
    }

    // Attempt to retrieve and validate
    channelId = pull(settings, '/channelId', {default: null});
    if (channelId != null && isNaN(channelId)) {
        throw new TypeError('invalid channel id');
    }

    // setup mixer client
    mixer = new mixerClient.Client(new mixerClient.DefaultRequestRunner());

    // setup shortcode auth client
    scAuth = new ShortcodeAuthClient(
        {
            'client_id': clientId,
            'scopes': [
                'chat:bypass_slowchat',
                'chat:bypass_links',
                'chat:bypass_filter',
                'chat:bypass_catbot',
                'chat:chat',
                'chat:connect',
                'chat:remove_message',
                'chat:whisper'
            ]
        },
        new LocalTokenStore(PATH.join(__dirname, '../../db/authtokens-DoNotShow.json'))
    );

    // Return a promise that will resolve to a SimpleMixerClient instance once
    // authorization has been completed
    return new Promise((resolve, reject) => {

        // Hook failure events so the promise is rejected on failure
        scAuth.on('expired', () => {
            reject(new Error('auth_expired'));
        });
        scAuth.on('declined', () => {
            reject(new Error('auth_declined'));
        });
        scAuth.on('error', (e) => {
            reject(e);
        });

        // Hook code event
        scAuth.on('code', code => {
            console.log(`Navigate to https://mixer.com/go?code=${code}`);
            console.log(`   Please Enter the following code: ${code}`);
        });

        // Hook authoriation event
        scAuth.on('authorized', token => {

            console.log('[Mixer Auth] Authorized');

            // Wire up oauthprovider with retrieved token
            mixer.use(new mixerClient.OAuthProvider(mixer.client, {
                clientId: clientId,
                tokens: {
                    access: token.access_token,
                    refresh: token.refrsh_token,
                    expires: token.expires_at
                }
            }));

            console.log('[Mixer Auth] Getting Current User');

            // we need user id
            mixer.request('GET', 'users/current').then(user => {

                console.log('[Mixer Auth] Current user recieved');
                let userId = user.body.id;


                // No channel id specified, use current user's
                if (!channelId) {
                    resolve(new SimpleMixerClient(mixer, clientId, userId, user.body.channel.id));

                // Otherwise, verify channel id
                } else {
                    mixer.request('GET', `channels/${channelId}`).then(channel => {
                        channelId = channel.body.id;
                        resolve(new SimpleMixerClient(mixer, clientId, userId, channelId));
                    });
                }
            });
        });

        console.log('[Mixer Auth] Beginning Authorization');

        // begin authorization
        scAuth.doAuth();
    });
};