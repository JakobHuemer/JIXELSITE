const webSocketServer = require('websocket').server;
const eventEmitter = require('events');

export class WebsocketManager extends eventEmitter {
    constructor(port, wsProtocol) {
        super();
        this.PORT = port;
        this.WS_PROTOCOL = wsProtocol;
        this.websocketServer = new webSocketServer({
            httpServer: this.PORT,
        });
    }

    listen() {
        this.websocketServer.on('connect', (connection) => {
            this.connection = connection;

            this.connection.on('message', (message) => {
                this.connection = connection;
                this.emit('message', message);
            });
        });

        this.websocketServer.on('connectFailed', (error) => {
            this.emit('error', error);
        });
    }

    close() {
        this.websocketServer.close().catch((err) => {
            console.log('Error closing websocket: ', err);
        });
    }

    send(message) {
        this.connection.sendUTF(message).catch((err) => {
            console.log('Error sending message: ', err);
        });
    }
}