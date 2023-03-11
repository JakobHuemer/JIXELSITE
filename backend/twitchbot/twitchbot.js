const HtmlEscape = require("escape-html");

const WebSocketClient = require('websocket').client;

const client = new WebSocketClient();
const eventSub = new WebSocketClient()
const axios = require('axios');
const express = require('express');
const app = express();
const port = 6363;
app.use(express.json());
let {channel, clientId, clientSecrete, username, password} = require('./data/userdata.json');
const {parseMessage, parseTags, parseCommand, parseSource, parseParameters} = require('./ircParser');
const fs = require("fs");

const scopesString = "?scope=analytics:read:extensions+user:edit+user:read:email+clips:edit+bits:read+analytics:read:games+user:edit:broadcast+user:read:broadcast+chat:read+chat:edit+channel:moderate+channel:read:subscriptions+whispers:read+whispers:edit+moderation:read+channel:read:redemptions+channel:edit:commercial+channel:read:hype_train+channel:read:stream_key+channel:manage:extensions+channel:manage:broadcast+user:edit:follows+channel:manage:redemptions+channel:read:editors+channel:manage:videos+user:read:blocked_users+user:manage:blocked_users+user:read:subscriptions+user:read:follows+channel:manage:polls+channel:manage:predictions+channel:read:polls+channel:read:predictions+moderator:manage:automod+channel:manage:schedule+channel:read:goals+moderator:read:automod_settings+moderator:manage:automod_settings+moderator:manage:banned_users+moderator:read:blocked_terms+moderator:manage:blocked_terms+moderator:read:chat_settings+moderator:manage:chat_settings+channel:manage:raids+moderator:manage:announcements+moderator:manage:chat_messages+user:manage:chat_color+channel:manage:moderators+channel:read:vips+channel:manage:vips+user:manage:whispers+channel:read:charity+moderator:read:chatters+moderator:read:shield_mode+moderator:manage:shield_mode+moderator:read:shoutouts+moderator:manage:shoutouts+moderator:read:followers"

// Reset comments.json
fs.writeFileSync('./twitchbot/data/comments.json', "[]")


function sendMsg(msg, connection) {
    connection.sendUTF(`PRIVMSG #${channel} :${msg}`)
    addComment({
        "display-name": "jakkibot",
        parameters: msg,
        tags: {
            color: "#FF0000"
        }
    })
}


function addComment(parsedMessage) {
    let tempTime = new Date()
    let isBot = parsedMessage["display-name"] === "jakkibot"
    let isCommand = parsedMessage.parameters.startsWith("!")

    let commentData = JSON.parse(fs.readFileSync('./twitchbot/data/comments.json', 'utf8'));

    let comment = {
        author: parsedMessage["display-name"],
        message: parsedMessage.parameters,
        timestamp: `${tempTime.getHours()}:${tempTime.getMinutes()}`,
        color: parsedMessage.tags.color,
        bot: isBot,
        command: isCommand,
        index: commentData[commentData.length - 1]?.index + 1 || 0
    }


    commentData.push(comment)
    if (commentData.length > 100) {
        commentData.shift()
    }

    fs.writeFileSync('./twitchbot/data/comments.json', JSON.stringify(commentData, null, 4), 'utf8');

}

function twitchbot() {


// map commands from subfolders from commands folder
    const fs = require('fs');
    const commands = new Map();
    const subFolders = fs.readdirSync('./twitchbot/commands');
    for (const subFolder of subFolders) {
        const commandFiles = fs.readdirSync(`./twitchbot/commands/${subFolder}`);
        for (const file of commandFiles) {
            const command = require(`./commands/${subFolder}/${file}`);
            commands.set(command.name, command);
        }
    }

    function getOAuthToken() {
        axios.post(
            'https://id.twitch.tv/oauth2/token',
            `client_id=${clientId}&client_secret=${clientSecrete}&grant_type=client_credentials`,
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            }).then((res) => {
            console.log(res.data.access_token)
            return res.data.access_token
        }).catch((err) => {
            console.log(err)
        })
        return null
    }

//
// oauthToken = getOAuthToken();
// console.log(getAuthToken())
    oauthToken = "fa2njf8qip2rl9ll0cuttcnrlx84ml"

    client.on('connectFailed', function (error) {
        console.log('Connect Error: ' + error.toString());
    });

    client.on('connect', function (connection) {
        console.log('WebSocket Client Connected');

        // Send CAP (optional), PASS, and NICK messages
        connection.sendUTF("CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership");
        connection.sendUTF("PASS " + password);
        connection.sendUTF("NICK " + username);
        connection.sendUTF("JOIN #" + channel);

        // Send JOIN message
        connection.sendUTF("PRIVMSG #jakkibot :HalloHallo")


        connection.on('error', function (error) {
            console.log("Connection Error: " + error.toString());
        });


        connection.on("message", (ircMessage) => {

            if (ircMessage.type === 'utf8') {
                let rawIrcMessage = ircMessage.utf8Data.trimEnd();
                console.log(`Message received (${new Date().toISOString()}): '${rawIrcMessage}'\n`);

                let messages = rawIrcMessage.split('\r\n');  // The IRC message may contain one or more messages.
                messages.forEach(message => {
                    let parsedMessage = parseMessage(message);

                    if (parsedMessage) {


                        switch (parsedMessage.command.command) {
                            case 'PRIVMSG':
                                // Ignore all messages except the '!move' bot
                                // command. A user can post a !move command to change the
                                // interval for when the bot posts its move message.
                                let commandMessage = parsedMessage.parameters;

                                addComment(parsedMessage)

                                if (commandMessage.startsWith("!")) {
                                    //     Command Handler

                                    let commandName = parsedMessage.command.botCommand.toLocaleLowerCase()
                                    let args = 0
                                    if (parsedMessage.command.botCommandParams) {
                                        args = parsedMessage.command.botCommandParams.split(" ").length;
                                    }

                                    if (commands.has(commandName)) {
                                        let commandObj = commands.get(commandName);
                                        if (!commandObj.valid_args.includes(args) && !commandObj.valid_args.includes(-1)) {
                                            commandObj.help(parsedMessage, connection);
                                        } else {
                                            try {
                                                console.log(`COMMAND (${new Date().toISOString()}):`, commandObj.name.toUpperCase())
                                                commandObj.execute(parsedMessage, connection);
                                            } catch (err) {
                                                console.log("ERR:", err);
                                                connection.sendUTF(`@reply-parent-msg=${parsedMessage.tags.id} PRIVMSG ${channel} :Ups, something went wrong`);
                                            }

                                        }
                                    }
                                }

                                break;
                            case
                            'PING'
                            :
                                connection.sendUTF('PONG ' + parsedMessage.parameters);
                                break;
                            case
                            '001'
                            :
                                // Successfully logged in, so join the channel.
                                // connection.sendUTF("JOIN #" + channel);
                                break;
                            case
                            'JOIN'
                            :
                                // Send the initial move message. All other move messages are
                                // sent by the timer.
                                break;
                            case
                            'PART'
                            :
                                console.log('The channel must have banned (/ban) the bot.');
                                connection.close();
                                break;
                            case
                            'NOTICE'
                            :
                                // If the authentication failed, leave the channel.
                                // The server will close the connection.
                                if ('Login authentication failed' === parsedMessage.parameters) {
                                    console.log(`Authentication failed; left ${channel}`);
                                    connection.sendUTF(`PART ${channel}`);
                                } else if ('You don’t have permission to perform that action' === parsedMessage.parameters) {
                                    console.log(`No permission. Check if the access token is still valid. Left ${channel}`);
                                    connection.sendUTF(`PART ${channel}`);
                                }
                                break;
                            default:
                            // Ignore all other IRC messages.
                        }
                    }
                });
            }
        })
    });


// eventSub.on("connect", (connection) => {
//     connection.on("message", (message) => {
//         console.log("EVENTSUB MESSAGE:", JSON.parse(message.utf8Data, null, 2))
//     })
// });
//
// eventSub.connect("wss://eventsub-beta.wss.twitch.tv/ws")

    client.connect('ws://irc-ws.chat.twitch.tv:80');

}

module.exports = {twitchbot, sendMsg}