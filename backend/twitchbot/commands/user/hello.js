const {sendMsg} = require("../../twitchbot")

module.exports = {
    name: 'hello',
    description: 'Hello!',
    label: "hello",
    valid_args: [-1],

    execute(command, conn) {

        let channel = command.command.channel
        sendMsg(`Hello @${command.source.nick}!`, conn)
    },

    help(command, conn) {
        let channel = command.command.channel
        sendMsg(`Usage: !hello`, conn)
    }
}