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

    // If request is not authenticated render the login page and pass in saved login infomation
    if (!req.authenticated) {
        res.render('login', { login: req.session.login });
        // If request is already authenticated send an error flash message and redirect to the dashboard
    } else {
        req.flash('danger', 'You are already logged in.');
        res.redirect('/');
    }

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
    User.findIdByUsername(username, (err, user_id) => {
        // If a user was found and there was no error
        if (!err && user_id) {
            // Find the password for the user from the database
            User.getPasswordFromId(user_id, (err, hash) => {
                // If there was no error
                if (!err) {

                    // Compare the password entered to the hash from the database
                    authentication.comparePassword(password, hash, (match) => {
                        // If the password matches the hash
                        if (match) {
                            // Login the user
                            req.login(user_id);
                            log(`${username}#${user_id} has logged in`);
                            // Send a successful login flash message and redirect to the dashboard 
                            req.flash('success', 'You have logged in.');
                            res.redirect('/');
                            // If the password does not match the hash
                        } else {
                            // Send an error flash message and reload the login page
                            req.flash('danger', 'Incorrect password.');
                            res.redirect('/login');
                        }
                    });

                    // If there was an error send an error flash message and reload the login page
                } else {
                    req.flash('danger', 'Database error.');
                    res.redirect('/login');
                }
            });
            // If no user was found or there was an error send a suitable error flash message and reload the login page
        } else {
            req.flash('danger', err ? 'Database error.' : 'User not found.');
            res.redirect('/login');
        }
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
        res.redirect('/');
        // If the request is not authenticated send an error flash message and redirect to the login route
    } else {
        req.flash('danger', 'You are not logged in.');
        res.redirect('/login');
    }

});

/**
 * Register route
 */

// GET '/register' route
router.get('/register', (req, res) => {

    // If the request is not authenticated render the register page and pass in saved registration info
    if (!req.authenticated) {
        res.render('register', { register: req.session.register });
        // If the request is already authenticated send an error flash message and redirect to the dashboard
    } else {
        req.flash('danger', 'You are already logged in.');
        res.redirect('/');
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
        errors.push('All fields must be filled.');
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

        if (errors.length == 0) {
            User.create({ username, email, password }, (err, user_id) => {
                if (!err) {
                    // Login the user and save the username to saved login data
                    req.login(user_id);
                    log(`${username}#${user_id} has registered`);
                    req.session.login = { username };

                    req.flash('success', 'You have successfully registered.');
                    res.redirect('/');

                } else {
                    req.flash('danger', 'Database error.');
                    res.redirect('/register');
                }
            });
        } else {
            req.flash('danger', errors);
            res.redirect('/register');
        }

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
        // If there was no error
        if (!err) {
            // Compare the password entered to the hash from the database
            authentication.comparePassword(password, hash, (match) => {
                // If the password matches the hash
                if (match) {
                    // Delete the user record from the database
                    User.delete(req.user_id, (err) => {
                        // If there was no error
                        if (!err) {
                            // Logout the user
                            req.logout();
                            log(`${req.user.username}#${req.user_id} has deleted their account`);
                            // Send a successful logout flash message and redirect to the index route
                            req.flash('success', 'Your account has been deleted.');
                            res.redirect('/');
                            // If there was an error
                        } else {
                            // Send a error flash message and reload their profile page
                            req.flash('danger', 'Database error.');
                            res.redirect(`/profile/${req.user_id}`);
                        }
                    });
                    // If the password does not match the hash send a error flash message and reload their profile page
                } else {
                    req.flash('danger', 'Incorrect password.');
                    res.redirect(`/profile/${req.user_id}`);
                }
            });
            // If there was an error send a error flash message and reload their profile page
        } else {
            req.flash('danger', 'Database error.');
            res.redirect(`/profile/${req.user_id}`);
        }
    });

});

module.exports = router;