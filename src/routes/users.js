'use strict';

// Dependencies
const express = require('express');
const validator = require('validator');
const chalk = require('chalk');

// Imports
const User = require('../models/User');
const authentication = require('../authentication');

// Initialise route handler
const router = express.Router();

// Log function
const log = (string) => console.log(`${chalk.bold.underline.cyan('USER')} ${chalk.yellow('»')} ${chalk.green(string)}`);

/**
 * Login route
 */

// GET '/login' route
router.get('/login', (req, res) => {

    if (req.authenticated) {
        req.flash('danger', 'You are already logged in.');
        return res.redirect('/');
    }

    return res.render('login', { login: req.session.login });
});

// POST '/login' route
router.post('/login', (req, res) => {

    // Sanitisers
    const { escape, trim } = validator;

    // Extract data from the request's body
    let { username, password } = req.body;

    // Data sanitisation
    username = escape((trim(username)));

    // Save the username to saved login data
    req.session.login = { username };

    // Find a user in the database with the username entered
    User.findIdAndStatusByUsername(username, (err, user_id, activity_status) => {

        if (err || !user_id) {
            req.flash('danger', err ? 'Database error.' : 'User not found.');
            return res.redirect('/login');
        }

        if (!activity_status) {
            req.flash('danger', err ? 'Database error.' : 'User has been permanently deactivated.');
            return res.redirect('/login');
        }

        // Find the password for the user from the database
        User.getPasswordFromId(user_id, (err, hash) => {
            // If there was no error
            if (err) {
                req.flash('danger', 'Database error.');
                return res.redirect('/login');
            }

            // Compare the password entered to the hash from the database
            authentication.comparePassword(password, hash, (match) => {

                if (!match) {
                    // Send an error flash message and reload the login page
                    req.flash('danger', 'Incorrect password.');
                    return res.redirect('/login');
                }

                // Login the user
                req.login(user_id);
                log(`${username}#${user_id} has logged in`);
                // Send a successful login flash message and redirect to the dashboard 
                req.flash('success', 'You have logged in.');
                return res.redirect('/');
            });
        });
    });
});

/**
 * Logout route
 */

// GET '/logout' route
router.get('/logout', (req, res) => {

    // If the request is authenticated
    if (req.authenticated) {
        // Logout the user
        req.logout();
        log(`${req.user.username}#${req.user_id} has logged out`);
        // Send a successful logout flash message and redirect to the index route
        req.flash('success', 'You have successfully logged out.');
        return res.redirect('/');
        // If the request is not authenticated send an error flash message and redirect to the login route
    } else {
        req.flash('danger', 'You are not logged in.');
        return res.redirect('/login');
    }

});

/**
 * Register route
 */

// GET '/register' route
router.get('/register', (req, res) => {

    // If the request is not authenticated render the register page and pass in saved registration info
    if (!req.authenticated) {
        return res.render('register', { register: req.session.register });
        // If the request is already authenticated send an error flash message and redirect to the dashboard
    } else {
        req.flash('danger', 'You are already logged in.');
        return res.redirect('/');
    }

});

// POST '/register' route
router.post('/register', (req, res) => {

    // Validators and sanitisers
    const { equals, isEmail, isEmpty, isLength } = validator;
    const { escape, normalizeEmail, trim } = validator;

    // Extract data from the request's body
    let { username, email, password, passwordConfirm } = req.body;

    // Data sanitisation
    username = escape(trim(username));
    if (email != "") {
        email = escape(normalizeEmail(trim(email)));
    }

    // Save the sanitised data to saved registration data
    req.session.register = { username, email };

    // Data validation
    let errors = [];

    if (isEmpty(username) || isEmpty(password) || isEmpty(passwordConfirm)) {
        errors.push('Username and password fields must be filled.');
    } else {
        // username
        if (!/^[\w\s@.-]+$/.test(username)) errors.push('Usernames can only contain letters, numbers, spaces, and the characters @, ., -');
        if (!isLength(username, { min: 3, max: 30 })) errors.push('Usernames must be between 3 and 30 characters long.');

        // password
        if (!isLength(password, { min: 8 })) errors.push('Passwords must be at least 8 characters long.');
        if (!isLength(password, { max: 64 })) errors.push('Passwords cannot be longer than 64 characters long.');
        if (!equals(password, passwordConfirm)) errors.push('Passwords must match.');

        if (email) {
            if (!isEmail(email)) errors.push('Emails must be valid.');
            if (!isLength(email, { max: 64 })) errors.push('Emails cannot be longer than 64 characters.');
        }
    }

    // Check if the username has already been taken in the database
    User.findIdByUsername(username, (err, user_id) => {
        if (!err && user_id) errors.push('Username already taken.');

        // Check if the email has already been used in the database
        if (email) {
            User.findIdByEmail(email, (err, user_id) => {
                if (!err && user_id) errors.push('Email already taken.');
            });
        }

        if (errors.length) {
            req.flash('danger', errors);
            return res.redirect('/register');
        }

        User.create({ username, email, password }, (err, user_id) => {

            if (err) {
                req.flash('danger', 'Database error.');
                return res.redirect('/register');
            }

            // Login the user and save the username to saved login data
            req.login(user_id);
            log(`${username}#${user_id} has registered`);
            req.session.login = { username };

            req.flash('success', 'You have successfully registered.');
            return res.redirect('/');
        });
    });
});

/**
 * Delete route
 */

//POST '/delete' route
router.post('/delete', (req, res) => {

    // Extract password from the request's body
    let { password } = req.body;

    // Find the password of the user from the database
    User.getPasswordFromId(req.user_id, (err, hash) => {
        if (err) {
            req.flash('danger', 'Database error.');
            res.redirect(`/profile/${req.user_id}`);
        }

        // Compare the password entered to the hash from the database
        authentication.comparePassword(password, hash, (match) => {

            if (!match) {
                req.flash('danger', 'Incorrect password.');
                res.redirect(`/profile/${req.user_id}`);
            }

            // Delete user
            User.deactivate(req.user_id, (err) => {

                if (err) {
                    // Send a error flash message and reload their profile page
                    req.flash('danger', 'Database error.');
                    res.redirect(`/profile/${req.user_id}`);
                }

                // Logout the user
                req.logout();
                log(`${req.user.username}#${req.user_id} has deactivated their account`);
                // Send a successful logout flash message and redirect to the index route
                req.flash('success', 'Your account has been deactivated.');
                res.redirect('/');
                // If there was an error

            });
        });
    });
});

module.exports = router;