const axios = require('axios');
const { formatDate } = require('../../server');

const WebSocketClient = require('websocket').client;

const scopesString = 'analytics:read:extensions+user:edit+user:read:email+clips:edit+bits:read+analytics:read:games+user:edit:broadcast+user:read:broadcast+chat:read+chat:edit+channel:moderate+channel:read:subscriptions+whispers:read+whispers:edit+moderation:read+channel:read:redemptions+channel:edit:commercial+channel:read:hype_train+channel:read:stream_key+channel:manage:extensions+channel:manage:broadcast+user:edit:follows+channel:manage:redemptions+channel:read:editors+channel:manage:videos+user:read:blocked_users+user:manage:blocked_users+user:read:subscriptions+user:read:follows+channel:manage:polls+channel:manage:predictions+channel:read:polls+channel:read:predictions+moderator:manage:automod+channel:manage:schedule+channel:read:goals+moderator:read:automod_settings+moderator:manage:automod_settings+moderator:manage:banned_users+moderator:read:blocked_terms+moderator:manage:blocked_terms+moderator:read:chat_settings+moderator:manage:chat_settings+channel:manage:raids+moderator:manage:announcements+moderator:manage:chat_messages+user:manage:chat_color+channel:manage:moderators+channel:read:vips+channel:manage:vips+user:manage:whispers+channel:read:charity+moderator:read:chatters+moderator:read:shield_mode+moderator:manage:shield_mode+moderator:read:shoutouts+moderator:manage:shoutouts+moderator:read:followers';


class TwitchEventSub {
    constructor(TWITCH_CLIENT_ID, TWITCH_CLIENT_SECRET, TWITCH_EVENT_USER, TWITCH_EVENT_USER_ACCESS_TOKEN) {
        this.TWITCH_CLIENT_ID = TWITCH_CLIENT_ID;
        this.TWITCH_CLIENT_SECRET = TWITCH_CLIENT_SECRET;
        this.TWITCH_EVENT_USER = TWITCH_EVENT_USER;
        this.TWITCH_EVENT_USER_ACCESS_TOKEN = TWITCH_EVENT_USER_ACCESS_TOKEN;
        this.keepAliveCount = 0;
        this.pingCount = 0;
        this.SESSION_ID = null;

        this.eventSubClient = new WebSocketClient();
    }

    async stop() {
        this.eventSubClient.abort();
        this.eventSubClient = new WebSocketClient();
        this.log('WebSocket Client Closed', 'EventSub');
    }

    async restart() {
        await this.stop();
        await this.start();
    }

    async start() {

        this.eventSubClient.on('connectFailed', (error) => {
            this.log('Connect Error: ' + error.toString(), 'conn');
        });

        this.eventSubClient.on('connect', (connection) => {

            this.log('WebSocket Client Connected', 'conn');

            connection.on('error', (error) => {
                this.log('Connection went wrong and closed: ' + error.toString(), 'conn');
            });


            connection.on('message', async (msg) => {

                switch (JSON.parse(msg.utf8Data).metadata.message_type) {
                    case 'session_welcome':

                        let userid = await this.getUserId(this.TWITCH_EVENT_USER);

                        this.SESSION_ID = JSON.parse(msg.utf8Data).payload.session.id;
                        await this.requestHooks(userid, this.SESSION_ID);
                        break;

                    case 'notification':
                        // console.log('EVENT:', JSON.parse(msg.utf8Data).metadata.subscription_type);
                        this.log(JSON.parse(msg.utf8Data).metadata.subscription_type, 'E');
                        break;

                    case 'session_keepalive':
                        if (this.keepAliveCount % 30 === 0) {
                            // console.log((this.keepAliveCount / 30) + ': KEEPALIVE');
                            this.log(`(${ this.keepAliveCount / 30 }) KEEPALIVE`, 'KeepAlive');
                        }
                        this.keepAliveCount++;
                        break;

                    case 'session_reconnect':
                        // console.log('Dropped Connection!');
                        this.log('Dropped Connection! Reconnecting . . .', 'conn');
                        this.restart();
                        break;

                    case 'revocation':
                        // console.log('Revoked!');
                        this.log('Revoked!', 'conn');
                        break;

                    default:
                        // console.log('Unknown Message:' + JSON.parse(msg.utf8Data).metadata.message_type);
                        this.log('Unknown Message:' + JSON.parse(msg.utf8Data).metadata.message_type, 'msg');
                        break;
                }
            });

        });

        this.eventSubClient.connect('wss://eventsub-beta.wss.twitch.tv/ws');
    }

    log(msg, protocol) {
        let date = new Date();
        console.log(`[${ formatDate(date) }] TTV EVENT ${ protocol.toUpperCase().replace(' ', '-') }: ${ msg }`);
    }

    async getBearerToken() {
        // this.log('Fetching Bearer Token . . .', 'Bearer');
        const res = await axios.post(
            'https://id.twitch.tv/oauth2/token',
            new URLSearchParams({
                'client_id': this.TWITCH_CLIENT_ID,
                'client_secret': this.TWITCH_CLIENT_SECRET,
                'grant_type': 'client_credentials'
            })
        );
        // this.log('Returning Bearer Token . . .', 'Bearer');
        return res.data.access_token;
    }

    async getUserId(username) {
        const response = await axios.get('https://api.twitch.tv/helix/users', {
            params: {
                'login': username
            },
            headers: {
                'Authorization': 'Bearer ' + await this.getBearerToken(),
                'Client-Id': this.TWITCH_CLIENT_ID,
                'Content-Type': 'application/json',
            }
        });

        return response.data.data[0].id;
    }


    async requestHooks(user_id, session_id) {


        let subscriptions = [
            {
                type: 'channel.follow',
                version: 2,
                condition: {
                    broadcaster_user_id: user_id,
                    moderator_user_id: user_id
                },
            }
        ];


        for (let sub of subscriptions) {

            let { type, version, condition } = sub;

            // console.log('Subscribing to ' + type + ' (version ' + version + ') . . .');
            this.log('Subscribing to ' + type + ' (version ' + version + ') . . .', 'EventSub Sub');
            // console.log(JSON.stringify(sub, null, 2))

            let response = await axios.post('https://api.twitch.tv/helix/eventsub/subscriptions',
                {
                    'type': type,
                    'version': version,
                    'condition': condition,
                    'transport': {
                        'method': 'websocket',
                        session_id,
                    }
                },
                {
                    headers: {
                        'Authorization': 'Bearer ' + this.TWITCH_EVENT_USER_ACCESS_TOKEN,
                        'Client-Id': this.TWITCH_CLIENT_ID,
                        'Content-Type': 'application/json'
                    }
                }).catch((error) => {
                console.log(error);
                // throw error;
            }).then((response) => {
                // console.log('✔ Subscribed to ' + type + ' (version ' + version + ')');
                this.log('✔ Subscribed to ' + type + ' (version ' + version + ')', 'EventSub Sub');
            });
        }
    }
}

module.exports = { TwitchEventSub };
