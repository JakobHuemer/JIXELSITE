const fs = require('fs');
const { REST } = require('@discordjs/rest');
const { Routes, InteractionType } = require('discord-api-types/v10');
const { Client, Collection } = require('discord.js');
let cfgData = require('./config.json');


// const formatDate = (date) => `${ date.getFullYear() }-${ (date.getMonth() + 1).toString().padStart(2, '0') }-${ date.getDate().toString().padStart(2, '0') } ${ date.getHours().toString().padStart(2, '0') }:${ date.getMinutes().toString().padStart(2, '0') }:${ date.getSeconds().toString().padStart(2, '0') }:${ date.getMilliseconds().toString().padStart(3, '0') }`;
const { formatDate } = require('../../server');


const stroke = '---------------------------------------------------------------------------';
const strokeX = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';

function loadAppCommands(discordBot1) {

    let commands = [];

    try {

        fs.readdirSync('./backend/discordbot/src/cogs/').forEach((subFolder) => {
            if (fs.readdirSync('./backend/discordbot/src/cogs/' + subFolder).length !== 0) {
                fs.readdirSync(`./backend/discordbot/src/cogs/${ subFolder }`).forEach((commandFile) => {
                    const command = require(`./cogs/${ subFolder }/${ commandFile }`);

                    discordBot1.log(`Loading command ${ commandFile }`, 'SYSTEM C');
                    discordBot1.client.commands.set(command.data.name, command);
                    commands.push(command.data.toJSON());
                });
            }
        });

        discordBot1.log('✅ Commands loaded!', 'load commands');

    } catch (e) {
        console.log(strokeX);
        discordBot1.logErr('❌ Commands NOT loaded!', 'load commands');
        console.log(strokeX);
    }


    return commands;
}

function regAppCommands(discordBot1) {
    let commands = discordBot1.commands,
        TOKEN = discordBot1.TOKEN,
        APP_ID = discordBot1.APPLICATION_ID,
        GUILD_ID = discordBot1.GUILD_ID;
    //registering commands
    const rest = new REST({ version: '10' }).setToken(TOKEN);


    (async applicationId => {
        try {
            discordBot1.log('🟠 Started refreshing application (/) commands.', 'comm handler');

            await rest.put(Routes.applicationCommands(APP_ID, GUILD_ID), {
                body: commands,
            });

            discordBot1.log('🟢 Successfully reloaded application (/) commands.', 'comm handler');
        } catch (err) {
            console.error('ERROR: ', err);
        }
    })();
}


function botReady(discordBot1) {
    discordBot1.client.once('ready', () => {
        discordBot1.log(`🥾 [${ discordBot1.client.user.tag }] successfully booted on {${ discordBot1.client.guilds.cache.size }} server(s) and is ready for use!`, 'login');

        discordBot1.client.user.setActivity('v1.0.0	', { type: 3 });
    });
}

function commandHandler(discordBot1) {

    discordBot1.client.on('interactionCreate', async (interaction) => {
        // Autocomplete
        if (interaction.type === InteractionType.ApplicationCommandAutocomplete) {

            const { commands } = discordBot1.client;
            const { commandName } = interaction;
            const command = discordBot1.commands.get(commandName);
            if (!command) return;

            try {
                await command.autocomplete(interaction, discordBot1.client);
            } catch (err) {
                console.error(err);
            }
        }

        if (interaction.type !== InteractionType.ApplicationCommand) return;

        const command = discordBot1.client.commands.get(interaction.commandName);

        discordBot1.log(`🔎 [${ interaction.user.tag }] used command [${ interaction.commandName }]`, 'comm');

//     Execute command if it is
        if (command) {
            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(error);
                // console.error("ERROR ---------------------------------------------------------");

                if (interaction.deferred || interaction.replied) {
                    discordBot1.log(`⚠️ [${ interaction.user.tag }] failed command [${ command.data.name }]`);

                    await interaction.editReply({
                        content: ':x: Ops, seems something went wrong!', ephemeral: true,
                    });
                } else {
                    discordBot1.log(`⚠️ [${ interaction.user.tag }] failed command [${ command.data.name }]`);
                    await interaction.reply({
                        content: ':x: Ops, seems something went wrong!', ephemeral: true,
                    });
                }
            }
        } else {
            await interaction.reply({
                content: ':x: Ops, seems this command doesn\'t exist!', ephemeral: true,
            });
        }
    });
}

function eventHandler(discordBot1) {
    fs.readdirSync('./backend/discordbot/src/events/').forEach((subFolder) => {
        if (fs.readdirSync('./backend/discordbot/src/events/' + subFolder).length !== 0) {
            fs.readdirSync(`./backend/discordbot/src/events/${ subFolder }`).forEach((eventFile) => {

                const event = require(`./events/${ subFolder }/${ eventFile }`);
                // const eventName = eventFile.split(".")[0];
                discordBot1.log(`Loading event ${ eventFile }`, 'event handler');
                discordBot1.client.on(event.name, (...args) => event.execute(...args));
            });
        }
    });

}

// async function newLogFile(SESSION) {
//     console.log("Creating new log file with session date: " + SESSION.toISOString());
//     await fs.writeFile(`./backend/discordbot/logs/(${SESSION.toISOString()})discord.log`, `Session ${SESSION} started at ${new Date().toISOString()}`, function (err) {
//         if (err) {
//             console.log("Error creating new log file: ");
//             throw err
//         }
//     })
// }

class DiscordBot {
    constructor(TOKEN, APPLICATION_ID, GUILD_ID, INTENTS = 32767) {
        this.TOKEN = TOKEN;
        this.APPLICATION_ID = APPLICATION_ID;
        this.GUILD_ID = GUILD_ID;
        this.INTENTS = INTENTS;
        this.client = new Client({
            intents: this.INTENTS,
        });

        this.client.commands = new Collection();
        this.commands = [];

        this.SESSION_DATE = new Date();
    }

    log(msg, dcProtocol) {
        // let date = new Date().toISOString();
        let date = new Date();
        dcProtocol = dcProtocol.toUpperCase().replace(' ', '-');

        console.log(`[${ formatDate(date) }] DC ${ dcProtocol }: ${ msg }`);

    }

    logErr(msg, dcProtocol) {
        let date = new Date().toISOString();
        dcProtocol = dcProtocol.toUpperCase();
        console.error(`[${ date }] DC ${ dcProtocol }: ${ msg }`);
    }


    async start() {
        this.SESSION_DATE = new Date();

        await this.log('Starting bot...', 'start');
        await this.client.login(this.TOKEN);

        botReady(this);
        commandHandler(this);
        eventHandler(this);
        await this.registerApplicationCommands();

    }


    async stop() {
        this.log('Stopping bot...', 'stop');
        await this.client.destroy();
        this.client = new Client({
            intents: this.INTENTS,
        });
        this.log('Bot stopped.', 'stop');
    }


    async restart() {
        this.log('Restarting bot...', 'restart');
        await this.stop();
        await this.start();
    }


    async registerApplicationCommands() {
        this.commands = loadAppCommands(this);
        regAppCommands(this);
    }


    intro() {

        console.log('   ___  _              _  ______         _   \n' +
            '  |_  |(_)            | | | ___ \\       | |  \n' +
            '    | | _ __  __  ___ | | | |_/ /  ___  | |_ \n' +
            '    | || |\\ \\/ / / _ \\| | | ___ \\ / _ \\ | __|\n' +
            '/\\__/ /| | >  < |  __/| | | |_/ /| (_) || |_ \n' +
            '\\____/ |_|/_/\\_\\ \\___||_| \\____/  \\___/  \\__|\n' +
            '                                             \n' +
            '                                             ');

    }
}


module.exports = { DiscordBot };
