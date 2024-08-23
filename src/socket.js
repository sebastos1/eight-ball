'use strict';

// Dependencies
const http = require('http');
const chalk = require('chalk');
const socket = require('socket.io');

// Imports
const Game = require('./game/Game');
const Queue = require('./game/Queue');
const Player = require('./game/Player');

// Constants
const TICKRATE = 60;

// Data structures
const games = new Map();
const players = new Map();
const queue = new Queue();

// Log function
const log = (string) => console.log(`${chalk.bold.underline.red(`GAME [${players.size}][${queue.size}][${games.size}]`)} ${chalk.yellow('»')} ${chalk.yellow(string)}`);

function emitOnlineUpdate(io) {
    io.emit('online-update', {
        playersOnline: Array.from(players.values()).map(player => ({
            id: player.id,
            username: player.username,
            country: player.country
        }))
    });
}

function emitQueueUpdate(io) {
    io.emit('queue-update', {
        playersInQueue: queue._queue.map(player => ({
            id: player.id,
            username: player.username,
            country: player.country
        }))
    });
}

// Socket events
const events = function (io) {
    // On socket connection
    io.on('connection', (socket) => {
        // check if authenticated
        if (!socket.request.session.authenticated) return;

        // Create new player or check if it already exists
        let player;
        const userId = socket.request.session.user.id;

        if (players.has(userId)) {
            player = players.get(userId);
            player.socket = socket;
        } else {
            player = new Player(socket);
            players.set(player.id, player);
        }
        log(`${player.username}#${player.id} has connected - ${players.size} player(s) online`);

        // Broadcast online update
        emitOnlineUpdate(io)

        // On socket disconnect
        socket.on('disconnect', () => {

            console.log(player.username, "left the game");

            // If player in queue, remove them from the queue
            if (player.inQueue) queue.remove(player);
            // If player in game, end the game with the opponent as the winner
            if (player.inGame) {
                const game = player.game;
                game.winner = (game.player1 === player ? game.player2 : game.player1);
                game.winReason = 3; // player disconnect code
                game.end(game.winner, game.winReason);
            }

            // Remove the player from players
            players.delete(player.id);
            log(`${player.username}#${player.id} has disconnected - ${players.size} player(s) online`);

            emitQueueUpdate(io)
            emitOnlineUpdate(io)
        });

        // On socket joining the queue
        socket.on('queue-join', (callback) => {
            if (player.inGame) {
                callback({
                    success: false,
                    message: "Previous game is still in progress!",
                });
            } else {
                queue.enqueue(player);
                callback({
                    success: true,
                    message: "You have successfully joined the queue.",
                });
                log(`${player.username}#${player.id} has joined the queue - ${queue.size} player(s) in queue`);

                emitQueueUpdate(io)
            }
        });

        // On socket leaving the queue
        socket.on('queue-leave', () => {
            if (!player.inQueue) return;

            queue.remove(player);
            log(`${player.username}#${player.id} has left the queue - ${queue.size} player(s) in queue`);

            emitQueueUpdate(io)
        });

        // On socket shooting the cue ball
        socket.on('shoot', (data) => {

            // Check that the player is in game and then call the shoot method on their game
            if (player.inGame) player.game.shoot(player, data.power, data.angle);
        });

        socket.on('requestOnlineUpdate', () => {
            emitOnlineUpdate(io);
            emitQueueUpdate(io);
        });
    });
};

// Main game loop
const gameLoop = setInterval(() => {

    // If the queue has two or more players
    if (queue.size >= 2) {

        // Remove two players from the front of the queue
        const player1 = queue.dequeue();
        const player2 = queue.dequeue();

        // Create a new game with the two players and add to games
        const game = new Game(player1, player2);
        games.set(game.id, game);
        log(`game#${game.id} has started - ${games.size} games(s) in progress`);

        // Send starting data to the two players
        player1.socket.emit('game-start', game.startData(player1));
        player2.socket.emit('game-start', game.startData(player2));

        // todo: send queue update when someone joins a game. maybe track ongoing games after all.
    }

    // Iterate throuh every game in games
    games.forEach((game, game_id) => {

        // Check if the game is active
        if (game.active) {

            // Update the game and store the returned turn boolean
            let turn = game.update();

            // Send update data to the players
            game.player1.socket.emit('game-update', game.updateData());
            game.player2.socket.emit('game-update', game.updateData());

            // If the turn has changed, send turn data to the players
            if (turn) {
                game.player1.socket.emit('game-updateTurn', game.turnData(game.player1));
                game.player2.socket.emit('game-updateTurn', game.turnData(game.player2));
            }
        }

        // Check if the game has ended
        if (game.ended) {

            // Send ending data to the players
            game.player1.socket.emit('game-end', game.endData(game.player1, game.winReason));
            game.player2.socket.emit('game-end', game.endData(game.player2, game.winReason));

            // Remove the game from games
            games.delete(game_id);
            log(`game#${game_id} has ended - ${games.size} games(s) in progress`);

        }

    });

    // Tickrate of the game loop in ms
}, 1000 / TICKRATE);


// Initialise http server then return the server
const init = function (app) {

    // Create a new http server and attach socket
    const server = http.createServer(app);
    const io = socket(server);

    // Set events to the socket
    events(io);

    // Export session middleware function
    module.exports.session = (session) => io.use((socket, next) => session(socket.request, socket.request.res, next));

    // Return the http server
    return server;

};

// Export init function
module.exports = init;

// Export functions that return the online and queued player info
module.exports.playersInQueue = () => queue._queue;
module.exports.playersOnline = () => players;