// custom module imports
const {settings, pull} = require('../misc/db.js');
const {has} = require('../misc/util.js');

module.exports = (plugin, permissionGroups = {}, isWhisper = null) => {

    // Create base config
    let config = {
        disabled: false,
        response: pull(settings, '/whisperRequired', {default: isWhisper == null ? 'whisper' : 'broadcast'}),
        deleteCommand: pull(settings, '/deleteCommand', {default: false}),
        whisperRequired: pull(settings, '/whisperRequired', {default: false})
    };

    // Merge the plugin's config into the base
    config = Object.assign(
        config,
        plugin.config
    );

    // retrieve custom config and merge into base
    config = Object.assign(
        config,
        pull(settings, `/${plugin.name}`, {default: plugin.config, write: true})
    );

    // Retrieve glabal permission-groups overrides list
    pull(settings, '/overrides', {default: [], write: true})
        .forEach(override => {
            let name = override.name.toLowerCase();

            // if the user has the specified permission group
            // merge the override config into base
            if (has(permissionGroups, name)) {
                config = Object.assign(config, override.overrides);
            }
        });

    // Apply command-specific permission-group overrides to config
    if (has(config, 'overrides')) {
        config.overrides.forEach(override => {
            let name = override.name.toLowerCase();

            // If the user has the specified permission group
            // Merge the override config into base
            if (has(permissionGroups, name)) {
                config = Object.assign(config, override.overrides);
            }
        });
    }

    // return resulting config
    return config;
};