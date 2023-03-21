module.exports = {
    name: 'hello',
    description: 'Hello!',
    label: 'hello',
    valid_args: [-1],

    execute(command, twitchBot1) {

        let channel = command.command.channel;
        twitchBot1.sendTwitchMessage(`Hello @${ command.source.nick }!`, this.label);
    },

    help(command, twitchBot1) {
        let channel = command.command.channel;
        twitchBot1.sendTwitchMessage(`Usage: !hello`, this.label);
    }
};