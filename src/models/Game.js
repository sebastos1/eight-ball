'use strict';

// Imports
const database = require('../database');

// Declare Game object
const Game = {};

// Game create
Game.create = function (winner, loser, ratingInfo, winReason, callback) {

    // SQL query
    let sql = `INSERT INTO game (winnerId, loserId, winnerScore, loserScore, winnerNewRating, loserNewRating, ratingGained, ratingLost, winReason)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`;

    let { winnerRating, loserRating, ratingGained, ratingLost } = ratingInfo;

    // Query parameters
    let params = [winner.id, loser.id, winner.score, loser.score, winnerRating, loserRating, ratingGained, ratingLost, winReason];

    // Execute the query
    database.run(sql, params, function (err) {
        if (err) console.log(err);
        // If a new game was created, return the id
        callback(Boolean(err), this.lastID ? this.lastID : null);
    });

};

// Get the games of a user from their id
Game.getGamesByUserId = function (id, callback) {

    // SQL query
    let sql = `SELECT game.id, game.winnerId, game.loserId, game.winnerScore, game.loserScore, game.time, user1.username AS winnerUsername, user2.username AS loserUsername, winnerNewRating, loserNewRating, ratingGained, ratingLost, winReason
               FROM game
               LEFT JOIN user AS user1 ON user1.id = game.winnerId
               LEFT JOIN user AS user2 ON user2.id = game.loserId
               WHERE game.winnerId = ? OR game.loserId = ?
               ORDER BY game.time DESC
               LIMIT 25;`;

    // Execute the query
    database.all(sql, [id, id], (err, games) => {
        if (err) console.log(err);
        // If games were found, return the games
        callback(Boolean(err), games ? games : null);
    });

};

// Get the latest game played by a user from their id
Game.getLatestByUserId = function (id, callback) {

    // SQL query
    let sql = `SELECT game.id, game.winnerId, game.loserId, game.winnerScore, game.loserScore, game.time, user1.username AS winnerUsername, user2.username AS loserUsername, winnerNewRating, loserNewRating, ratingGained, ratingLost, winReason
               FROM game
               LEFT JOIN user AS user1 ON user1.id = game.winnerId
               LEFT JOIN user AS user2 ON user2.id = game.loserId
               WHERE game.winnerId = ? OR game.loserId = ?
               ORDER BY game.time DESC
               LIMIT 1;`;

    // Execute the query
    database.get(sql, [id, id], (err, game) => {
        if (err) console.log(err);
        // If games were found, return the games
        callback(Boolean(err), game ? game : null);
    });

};

// Export the Game module
module.exports = Game;