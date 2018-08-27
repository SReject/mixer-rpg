const hasOwnProperty = Object.prototype.hasOwnProperty;

module.exports.has = (obj, prop, nonull) => hasOwnProperty.call(obj, prop) && (nonull !== true || obj.prop != null);

module.exports.tokenize = (message) => {
    let tokens = [];

    message.forEach(part => {
        if (part.type !== 'text') {
            return tokens.push(part);
        }

        part.text
            .trim()
            .split(/\s+/g)
            .forEach(token => {
                tokens.push({type: 'text', data: token, text: token});
            });
    });

    return tokens;
};

module.exports.upperfirst = txt => txt.toLowerCase().replace(/((?:^| ).)/g, matched => matched.toUpperCase());

module.exports.pick = list => list[Math.floor(Math.random() * list.length)];