const {SlashCommandBuilder} = require('discord.js');
const {InteractionResponseType} = require('discord-api-types/v10');

let { pLog, pLogErr, cfgData, discordBot} = require('../../index.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName("clear")
        .setDescription("clears given amount of messages in (opional) given channel from (optional) given user")
        .addIntegerOption((option) => option.setName("amount").setDescription("Amount of messages getting cleared").setRequired(true))
        .addChannelOption((option) => option.setName("channel").setDescription("Delete messages in specific channel").setRequired(false))
    ,

    async execute(interaction) {
        const amount = interaction.options.getInteger("amount");
        const channel = interaction.options.getChannel("channel");


    }
}
