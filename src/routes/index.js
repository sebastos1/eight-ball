'use strict';

// Dependencies
const express = require('express');

// Imports
const User = require('../models/User');
const Game = require('../models/Game');
const socket = require('../socket');

// Initialise route handler
const router = express.Router();

/**
 * Index route
 */

// GET '/' route
router.get('/', (req, res, next) => {

    if (!req.authenticated) {
        // Render the login page and pass in saved login infomation
        return res.render('login', { login: req.session.login });
    }

    // Find the latest game played by the user from the database
    Game.getLatestByUserId(req.user_id, (err, game) => {

        if (err) {
            return next('Database error.');
        }

        // Render the dashboard page and pass in game status and the latest game played
        return res.render('dashboard', {
            queuedPlayers: socket.queuedPlayers()._queue,
            playersOnline: socket.playersOnline,
            playersInQueue: socket.playersInQueue,
            gamesInProgress: socket.gamesInProgress,
            game
        });
    });
});

/**
 * Play route
 */

// GET '/play' route
router.get('/play', (req, res, _) => {

    if (!req.authenticated) {
        req.flash('danger', 'You are not logged in.');
        return res.redirect('/login');
    }

    // Render the play page
    return res.render('play', {
        queuedPlayers: socket.queuedPlayers()._queue,
    });
});

/**
 * Profile route
 */

// GET '/profile'
router.get('/profile', (req, res, next) => {

    if (!req.query.username) {

        // If the request is not authenticated
        if (!req.authenticated) {
            // Send an error flash message and redirect to the login route
            req.flash('danger', 'You are not logged in.');
            return res.redirect('/login');
        }

        // Redirect to the profile for their own account
        return res.redirect(`/profile/${req.user_id}`);
    }


    // Query the database for a user with a username similar to the query
    User.queryIdByUsername(req.query.username, (err, id) => {

        if (err || !id) {
            return next(err ? 'Database error.' : 'User not found.');
        }

        return res.redirect(`/profile/${id}`);
    });
});

// GET '/profile/id'
router.get('/profile/:id', (req, res, next) => {

    // Find a user in the database with the id specified in the url
    User.findUserById(req.params.id, (err, profile) => {

        if (err || !profile) {
            // Send a suitable message to the error handler
            return next(err ? 'Database error.' : 'User not found.');
        }

        // Check if the profile being requested is the request's own profile
        let selfProfile = req.params.id == req.user_id;
        // Caluclate the user's winrate
        let gamesPlayed = profile.wins + profile.losses;
        let winRate = gamesPlayed ? Math.round(profile.wins * 100 / gamesPlayed) + '%' : '-';

        // Find the games played by the user
        Game.getGamesByUserId(profile.id, (err, games) => {

            if (err) next('Database error.');

            // Render the profile page and pass in the profile data, games played, whether its a self profile and the winrate
            return res.render('profile', { profile, games, selfProfile, gamesPlayed, winRate });
        });
    });
});

/**
 * Leaderboard route
 */

// GET '/leaderboard' route
router.get('/leaderboard', (req, res, next) => {

    // Get all of the users from the database
    User.getLeaderboard((err, users) => {

        if (err || !users) {
            return next('Database error.');
        }

        // Position counter
        let i = 0;
        // Iterate through the users array
        users.map((user) => {
            // Position in leaderboard
            user.position = ++i;
            // Add a self boolean attribute
            user.self = user.id == req.user_id;
            // Calculate the game played
            user.gamesPlayed = user.wins + user.losses;
            // Calcualte the win rate
            user.winRate = user.gamesPlayed ? Math.round(user.wins * 100 / user.gamesPlayed) + '%' : '-';
        });

        // Render the leaderboard page and pass in the users array
        return res.render('leaderboard', { users });

    });

});

// Export router
module.exports = router;