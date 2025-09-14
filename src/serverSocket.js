// Dependencies
import chalk from "chalk";

// Imports
import Game from "./game/Game.js";
import Queue from "./game/Queue.js";
import Player from "./game/Player.js";

// Constants
const TICKRATE = 60;

// Data structures
const games = new Map();
const players = new Map();
const queue = new Queue();
const rooms = new Map();

// Log function
const log = (string) => console.log(`${chalk.bold.underline.red(`GAME [${players.size}][${queue.size}][${games.size}]`)} ${chalk.yellow("»")} ${chalk.yellow(string)}`);

function emitOnlineUpdate(io) {
    io.emit("online-update", {
        playersOnline: Array.from(players.values()).map(player => ({
            id: player.id,
            username: player.username,
            country: player.country,
            rating: player.rating
        }))
    });
}

function emitQueueUpdate(io) {
    io.emit("queue-update", {
        playersInQueue: queue.users.map(player => ({
            id: player.id,
            username: player.username,
            country: player.country,
            rating: player.rating
        }))
    });
}

// Socket events
const applySocketEvents = function (io) {

    // On socket connection
    io.on("connection", async (socket) => {
        let player;

        // check if authenticated
        if (socket.request.session.authenticated) {
            const userId = socket.request.session.user.id;
            if (players.has(userId)) {
                player = players.get(userId);
                player.socket = socket;
            } else {
                player = new Player(socket);
                players.set(player.id, player);
            }
        } else if (socket.request.session.guestId) {
            const guestId = socket.request.session.guestId;
            if (players.has(guestId)) {
                player = players.get(guestId);
                player.socket = socket;
            } else {
                player = new Player(socket, guestId);
                players.set(guestId, player);
            }
        }

        if (player) {
            log(`${player.username}#${player.id} has connected - ${players.size} player(s) online`);
            emitOnlineUpdate(io)

            // On socket disconnect
            socket.on("disconnect", async () => {
                // If player in queue, remove them from the queue
                if (player.inQueue) queue.remove(player);
                // If player in game, end the game with the opponent as the winner
                if (player.inGame) {
                    const game = player.game;
                    game.winner = (game.player1 === player ? game.player2 : game.player1);
                    game.winReason = 3; // player disconnect code
                    await game.end(game.winner, game.winReason);
                }

                if (player.inRoom && player.roomId) {
                    const room = rooms.get(player.roomId);
                    if (room) {
                        room.players = room.players.filter(p => p.id !== player.id);
                        room.players.forEach(p => p.wantsRematch = false); // reset rematch flags

                        if (room.players.length === 0) {
                            rooms.delete(player.roomId);
                        }
                    }
                }

                // Remove the player from players
                players.delete(player.id);
                log(`${player.username}#${player.id} has disconnected - ${players.size} player(s) online`);

                emitQueueUpdate(io)
                emitOnlineUpdate(io)
            });

            // On socket joining the queue
            socket.on("queue-join", (callback) => {
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
            socket.on("queue-leave", () => {
                if (!player.inQueue) return;

                queue.remove(player);
                log(`${player.username}#${player.id} has left the queue - ${queue.size} player(s) in queue`);

                emitQueueUpdate(io)
            });

            // On socket shooting the cue ball
            socket.on("shoot", (data) => {

                // Check that the player is in game and then call the shoot method on their game
                if (player.inGame) player.game.shoot(player, data.power, data.angle);
            });


            // ROOMS
            socket.on("room-create", (callback) => {
                const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();
                callback({ success: true, roomId: roomId });
            });

            socket.on("room-join", (roomId, callback) => {
                if (player.inGame) {
                    callback({ success: false, message: "Cannot join room while in game" });
                    return;
                }

                if (!rooms.has(roomId)) {
                    rooms.set(roomId, { players: [], game: null, created: Date.now() });
                }

                const room = rooms.get(roomId);

                if (room.players.length >= 2) {
                    callback({ success: false, message: "Room is full" });
                    return;
                }

                if (room.players.find(p => p.id === player.id)) {
                    callback({ success: true, playersInRoom: room.players.length });
                    return;
                }

                if (player.inQueue) {
                    queue.remove(player);
                    emitQueueUpdate(io);
                }

                room.players.push(player);
                player.roomId = roomId;
                player.inRoom = true;

                callback({ success: true, playersInRoom: room.players.length });

                log(`${player.username}#${player.id} joined room ${roomId} (${room.players.length}/2)`);

                if (room.players.length === 2) {
                    const game = new Game(room.players[0], room.players[1]);
                    room.game = game;
                    games.set(game.id, game);

                    log(`game#${game.id} has started from room ${roomId}`);
                    room.players[0].socket.emit("game-start", game.startData(room.players[0]));
                    room.players[1].socket.emit("game-start", game.startData(room.players[1]));
                }
            });

            // REMATCHING
            socket.on("rematch-request", (callback) => {
                console.log(`Rematch request from ${player.username}:`);
                console.log(`- inRoom: ${player.inRoom}`);
                console.log(`- roomId: ${player.roomId}`);

                if (!player.inRoom || !player.roomId) {
                    callback({ success: false, message: "Not in a room" });
                    return;
                }

                const room = rooms.get(player.roomId);
                console.log(`- room exists: ${!!room}`);
                console.log(`- room players: ${room ? room.players.length : 'N/A'}`);

                if (!room || room.players.length !== 2) {
                    callback({ success: false, message: "Room not ready for rematch" });
                    return;
                }

                player.wantsRematch = true;

                const opponent = room.players.find(p => p.id !== player.id);

                // ask opponent
                opponent.socket.emit("rematch-requested", {
                    from: player.username
                });

                if (opponent.wantsRematch) {
                    const game = new Game(room.players[0], room.players[1]);
                    room.game = game;
                    games.set(game.id, game);
                    room.players.forEach(p => p.wantsRematch = false);

                    log(`rematch game#${game.id} has started from room ${player.roomId}`);
                    room.players[0].socket.emit("game-start", game.startData(room.players[0]));
                    room.players[1].socket.emit("game-start", game.startData(room.players[1]));
                    callback({ success: true, message: "Rematch started!" });
                } else {
                    callback({ success: true, message: "Rematch requested, waiting for opponent" });
                }
            });

            socket.on("rematch-response", (accept, callback) => {
                if (!player.inRoom || !player.roomId) {
                    callback({ success: false, message: "Not in a room"});
                    return;
                }

                const room = rooms.get(player.roomId);
                if (!room || room.players.length !== 2) {
                    callback({ success: false, message: "Room not ready" });
                    return;
                }

                const opponent = room.players.find(p => p.id !== player.id);

                if (accept) {
                    player.wantsRematch = true;
                    if (opponent.wantsRematch) {
                        const game = new Game(room.players[0], room.players[1]);
                        room.game = game;
                        games.set(game.id, game);
                        room.players.forEach(p => p.wantsRematch = false);

                        log(`rematch game#${game.id} has started from room ${player.roomId}`);
                        room.players[0].socket.emit("game-start", game.startData(room.players[0]));
                        room.players[1].socket.emit("game-start", game.startData(room.players[1]));
                        callback({ success: true, message: "Rematch started!" });
                    } else {
                        opponent.socket.emit("rematch-accepted", { from: player.username });
                        callback({ success: true, message: "Waiting for opponent to request rematch" });
                    }
                } else {
                    opponent.socket.emit("rematch-declined", { from: player.username });
                    callback({ success: true, message: "Rematch declined" });
                }
            });

        };

        // let non-logged in users see the online players
        socket.on("requestOnlineUpdate", () => {
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
        player1.socket.emit("game-start", game.startData(player1));
        player2.socket.emit("game-start", game.startData(player2));
    }

    // Iterate through every game in games
    games.forEach((game, game_id) => {

        // Check if the game is active
        if (game.active) {

            // Update the game and store the returned turn boolean
            let turn = game.update();

            // Send update data to the players
            game.player1.socket.emit("game-update", game.updateData());
            game.player2.socket.emit("game-update", game.updateData());

            // If the turn has changed, send turn data to the players
            if (turn) {
                game.player1.socket.emit("game-updateTurn", game.turnData(game.player1));
                game.player2.socket.emit("game-updateTurn", game.turnData(game.player2));
            }
        }

        // Check if the game has ended
        if (game.ended) {

            // Send ending data to the players
            game.player1.socket.emit("game-end", game.endData(game.player1, game.winReason));
            game.player2.socket.emit("game-end", game.endData(game.player2, game.winReason));

            // Remove the game from games
            games.delete(game_id);
            log(`game#${game_id} has ended - ${games.size} games(s) in progress`);
        }
    });

    // Tickrate of the game loop in ms
}, 1000 / TICKRATE);

export default applySocketEvents;
export const playersInQueue = queue.users;
export const playersOnline = players;