// Dependencies
import bcrypt from 'bcryptjs';

// Imports
import Elo from '../game/Elo.js';
import { database } from './database.js';

// Declare User object
const Users = {};

// User create
Users.create = function (user, callback) {

    // Hash the password
    bcrypt.hash(user.password, 10, (err, hash) => {

        if (err) {
            console.log(err);
            callback(true, null);
        }

        // SQL query
        let sql = `INSERT INTO user (username, email, password, country)
                       VALUES (?, ?, ?, ?);`;

        // Query parameters
        let params = [user.username, user.email || null, hash, user.country];

        // Execute the query
        database.run(sql, params, function (err) {
            if (err) console.log(err);
            // If a new user was created, return the id
            callback(Boolean(err), this.lastID ? this.lastID : null);
        });
    });

};

// User deactivation
Users.deactivate = function (id, callback) {

    let sql = `UPDATE user
               SET is_active = 0
               WHERE id = ?;`;

    database.run(sql, id, (err) => {
        if (err) console.log(err);
        callback(Boolean(err));
    });
};

// User delete
Users.delete = function (id, callback) {

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
Users.findUserById = function (id, callback) {

    // SQL query
    let sql = `SELECT id, username, email, wins, losses, rating, is_active, country
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
Users.findIdByUsername = function (username, callback) {

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
Users.findIdAndStatusByUsername = function (username, callback) {
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
Users.findIdByEmail = function (email, callback) {

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
Users.getPasswordFromId = function (id, callback) {

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

Users.getRatingFromId = function (id, callback) {

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
Users.queryIdByUsername = function (username, callback) {

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
Users.getLeaderboard = function (callback) {

    // SQL query
    let sql = `SELECT id, username, wins, losses, rating, is_active, country
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

Users.updateRatingsAfterGame = function (winnerId, loserId, callback) {
    let sql = `SELECT id, rating FROM user WHERE id IN (?, ?);`;

    database.all(sql, [winnerId, loserId], (err, users) => {
        if (err) {
            console.log(err);
            return callback(true);
        }

        let winner = users.find(u => u.id === winnerId);
        let loser = users.find(u => u.id === loserId);

        if (!winner || !loser) return callback(true);

        // might not have a rating yet
        if (winner.rating === null) winner.rating = Elo.initialRating();
        if (loser.rating === null) loser.rating = Elo.initialRating();

        let { newWinnerRating, newLoserRating } = Elo.updateRatings(winner.rating, loser.rating);
        let ratingGained = newWinnerRating - winner.rating;
        let ratingLost = loser.rating - newLoserRating;

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
                winnerRating: newWinnerRating,
                loserRating: newLoserRating,
                ratingGained: ratingGained,
                ratingLost: ratingLost,
                winnerCountry: winner.country,
                loserCountry: loser.country,
            });
        });
    });
};
// Increment the wins of a user
Users.incrementWins = function (id, callback) {

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
Users.incrementLosses = function (id, callback) {

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

export default Users;