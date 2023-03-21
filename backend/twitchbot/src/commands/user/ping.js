module.exports = {
    name: 'ping',
    description: 'Ping!',
    label: 'ping',
    valid_args: [-1],

    execute(command, twitchBot1) {
        let channel = command.command.channel;
        twitchBot1.sendTwitchMessage(`Pong @${ command.source.nick }!`, this.label);
    },

    help(command, twitchBot1) {
        let channel = command.command.channel;
        twitchBot1.sendTwitchMessage(`Usage: !ping`, this.label);
    }
};