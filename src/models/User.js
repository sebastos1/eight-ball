'use strict';

// Dependencies
const bcrypt = require('bcryptjs');

// Imports
const database = require('../database');
const Elo = require('../Elo')

// Declare User object
const User = {};

// User create
User.create = function (user, callback) {

    // Hash the password
    bcrypt.hash(user.password, 10, (err, hash) => {

        if (err) {
            console.log(err);
            callback(true, null);
        }

        // SQL query
        let sql = `INSERT INTO user (username, email, password)
                       VALUES (?, ?, ?);`;

        // Query parameters
        let params = [user.username, user.email || null, hash];

        // Execute the query
        database.run(sql, params, function (err) {
            if (err) console.log(err);
            // If a new user was created, return the id
            callback(Boolean(err), this.lastID ? this.lastID : null);
        });
    });

};

// User deactivation
User.deactivate = function (id, callback) {

    let sql = `UPDATE user
               SET is_active = 0
               WHERE id = ?;`;

    database.run(sql, id, (err) => {
        if (err) console.log(err);
        callback(Boolean(err));
    });
};

// User delete
User.delete = function (id, callback) {

    // SQL query
    let sql = `DELETE FROM user
               WHERE id = ?;`;

    // Execute the query
    database.run(sql, id, (err) => {
        if (err) console.log(err);
        callback(Boolean(err));
    });

};

// Find a user by id
User.findUserById = function (id, callback) {

    // SQL query
    let sql = `SELECT id, username, email, wins, losses, rating, is_active
               FROM user
               WHERE id = ?;`;

    // Execute the query
    database.get(sql, id, (err, user) => {
        if (err) console.log(err);
        // If a user was found, return the user
        callback(Boolean(err), user ? user : null);
    });

};

// Find a user id by username
User.findIdByUsername = function (username, callback) {

    // SQL query
    let sql = `SELECT id
               FROM user
               WHERE username = ?;`;

    // Execute the query
    database.get(sql, username, (err, user) => {
        if (err) console.log(err);
        // If a user was found, return their id
        callback(Boolean(err), user ? user.id : null);
    });
};

// step in for above
User.findIdAndStatusByUsername = function (username, callback) {
    // SQL query
    let sql = `SELECT id, is_active
               FROM user
               WHERE username = ?;`;
    // Execute the query
    database.get(sql, username, (err, user) => {
        if (err) console.log(err);
        callback(Boolean(err), user ? user.id : null, user ? user.is_active : null);
    });
};

// Find a user id by email
User.findIdByEmail = function (email, callback) {

    // SQL query
    let sql = `SELECT id
               FROM user
               WHERE email = ?;`;

    // Execute the query
    database.get(sql, email, (err, user) => {
        if (err) console.log(err);
        // If a user was found, return their id
        callback(Boolean(err), user ? user.id : null);
    });

};

// Get the password from a user id
User.getPasswordFromId = function (id, callback) {

    // SQL query
    let sql = `SELECT password
               FROM user
               WHERE id = ?;`;

    // Execute the query
    database.get(sql, id, (err, user) => {
        if (err) console.log(err);
        // If a user was found, return their password
        callback(Boolean(err), user ? user.password : null);
    });

};

User.getRatingFromId = function (id, callback) {

    // SQL query
    let sql = `SELECT rating
               FROM user
               WHERE id = ?;`;

    // Execute the query
    database.get(sql, id, (err, user) => {
        if (err) console.log(err);
        // If a user was found, return their rating
        callback(Boolean(err), user ? user.rating : null);
    });

};

// Query for a user id using a username
User.queryIdByUsername = function (username, callback) {

    // SQL query
    let sql = `SELECT id
               FROM user
               WHERE username LIKE ?;`;

    // Query parameters
    let params = ['%' + username + '%'];

    // Execute the query
    database.get(sql, params, (err, user) => {
        if (err) console.log(err);
        // If a user was found, return their id
        callback(Boolean(err), user ? user.id : null);
    });
};

// Get the leaderbord 
User.getLeaderboard = function (callback) {

    // SQL query
    let sql = `SELECT id, username, wins, losses, rating, is_active
               FROM user
               WHERE is_active = 1
               ORDER BY rating DESC
               LIMIT 25;`;

    // Execute the query
    database.all(sql, (err, users) => {
        if (err) console.log(err);
        // If users were found, return the users
        callback(Boolean(err), users ? users : null);
    });

};

User.updateRatingsAfterGame = function (winnerId, loserId, callback) {
    let sql = `SELECT id, rating FROM user WHERE id IN (?, ?);`;

    database.all(sql, [winnerId, loserId], (err, users) => {
        if (err) {
            console.log(err);
            return callback(true);
        }

        let winner = users.find(u => u.id === winnerId);
        let loser = users.find(u => u.id === loserId);

        if (!winner || !loser) {
            return callback(true);
        }

        // might not have a rating yet
        if (winner.rating === null) winner.rating = Elo.initialRating();
        if (loser.rating === null) loser.rating = Elo.initialRating();

        let { newWinnerRating, newLoserRating } = Elo.updateRatings(winner.rating, loser.rating);

        let updateSql = `UPDATE user SET 
                        rating = CASE 
                        WHEN id = ? THEN ?
                        WHEN id = ? THEN ?
                        END,
                        wins = CASE WHEN id = ? THEN wins + 1 ELSE wins END,
                        losses = CASE WHEN id = ? THEN losses + 1 ELSE losses END
                        WHERE id IN (?, ?);`;

        database.run(updateSql, [winnerId, newWinnerRating, loserId, newLoserRating, winnerId, loserId, winnerId, loserId], (err) => {
            if (err) console.log(err);
            callback(Boolean(err), {
                ratingGained: newWinnerRating - winner.rating,
                ratingLost: loser.rating - newLoserRating,
                winnerRating: winner.rating,
                loserRating: loser.rating,
            });
        });
    });
};

// Increment the wins of a user
User.incrementWins = function (id, callback) {

    // SQL query
    let sql = `UPDATE user
               SET wins = wins + 1
               WHERE id = ?;`;

    // Execute the query
    database.run(sql, id, (err) => {
        if (err) console.log(err);
        callback(Boolean(err));
    });

};

// Increment the losses of a user
User.incrementLosses = function (id, callback) {

    // SQL query
    let sql = `UPDATE user
               SET losses = losses + 1
               WHERE id = ?;`;

    // Execute the query
    database.run(sql, id, (err) => {
        if (err) console.log(err);
        callback(Boolean(err));
    });

};

// Export the User module
module.exports = User;