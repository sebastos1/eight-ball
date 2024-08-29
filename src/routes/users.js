// Dependencies
import express from 'express';
import validator from 'validator';
import chalk from 'chalk';
import axios from 'axios';

// imports
import Users from '../db/Users.js';
import authentication from '../site/authentication.js';
import { csrfValidation } from '../site/security.js';

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
router.post('/login', csrfValidation, async (req, res) => {
    try {
        // Sanitisers
        const { escape, trim } = validator;

        // Extract data from the request's body
        let { username, password } = req.body;

        if (!username || !password) {
            req.flash('danger', 'Username and password fields must be filled.');
        }

        // Data sanitisation
        username = escape((trim(username)));

        // Save the username to saved login data
        req.session.login = { username };

        // Find a user in the database with the username entered
        const user = await Users.findIdAndStatusByUsername(username);
        if (!user) {
            req.flash('danger', 'No user found for username');
            return res.redirect('/login');
        }

        if (!user.is_active) {
            req.flash('danger', 'User has been permanently deactivated.');
            return res.redirect('/login');
        }

        // Find the password for the user from the database
        const hash = await Users.getPasswordFromId(user.id);
        if (!hash) {
            req.flash('danger', 'Database error.');
            return res.redirect('/login');
        }

        // Compare the password entered to the hash from the database
        const match = await authentication.comparePassword(password, hash);
        if (!match) {
            req.flash('danger', 'Incorrect password.');
            return res.redirect('/login');
        }

        // Login the user
        req.login(user.id);
        log(`${username}#${user.id} has logged in`);
        // Send a successful login flash message and redirect to the dashboard 
        req.flash('success', 'You have logged in.');
        return res.redirect('/');

    } catch (error) {
        console.error('Login error:', error);
        req.flash('danger', 'An unexpected error occurred. Please try again.');
        return res.redirect('/login');
    }
});

/**
 * Logout route
 */

// GET '/logout' route
router.get('/logout', (req, res) => {

    if (!req.authenticated) {
        req.flash('danger', 'You are not logged in.');
        return res.redirect('/login');
    }

    // Logout the user
    req.logout();
    log(`${req.user.username}#${req.user_id} has logged out`);
    // Send a successful logout flash message and redirect to the index route
    req.flash('success', 'You have successfully logged out.');
    return res.redirect('/');
});

/**
 * Register route
 */

// GET '/register' route
router.get('/register', (req, res) => {

    // If the request is not authenticated render the register page and pass in saved registration info
    if (!req.authenticated) {
        return res.render('register', { register: req.session.register });
    }

    req.flash('danger', 'You are already logged in.');
    return res.redirect('/');

});

// POST '/register' route
router.post('/register', csrfValidation, async (req, res) => {
    try {
        // Validators and sanitisers
        const { equals, isEmail, isEmpty, isLength } = validator;
        const { escape, normalizeEmail, trim } = validator;

        // Extract and sanitize data from the request's body
        let { username, email, password, passwordConfirm } = req.body;
        username = escape(trim(username));
        email = email ? escape(normalizeEmail(trim(email))) : '';

        // Save the sanitised data to saved registration data
        req.session.register = { username, email };

        // Data validation
        let errors = [];
        if (isEmpty(username) || isEmpty(password) || isEmpty(passwordConfirm)) {
            errors.push('Username and password fields must be filled.');
        } else {
            // username
            if (!/^[A-Za-zÀ-ÿ0-9 ]+$/.test(username)) {
                errors.push('Username can only contain Latin letters, numbers, and spaces.');
            }
            if (!isLength(username, { min: 3, max: 30 })) {
                errors.push('Usernames must be between 3 and 30 characters long.');
            }
            // password
            if (!isLength(password, { min: 4, max: 32 })) errors.push('Passwords must be between 4 and 32 characters.');
            if (!equals(password, passwordConfirm)) errors.push('Passwords must match.');
            if (email) {
                if (!isEmail(email)) errors.push('Emails must be valid.');
                if (!isLength(email, { max: 64 })) errors.push('Emails cannot be longer than 64 characters.');
                const emailUser = await Users.findIdByEmail(email);
                if (emailUser) errors.push('Email already taken.');
            }
        }

        // Check if the username has already been taken in the database
        const existingUser = await Users.findIdByUsername(username);
        if (existingUser) errors.push('Username already taken.');

        if (errors.length) {
            req.flash('danger', errors);
            return res.redirect('/register');
        }

        const ip = req.headers["x-real-ip"] || req.headers["x-forwarded-for"];
        const country = await getLocationFromIp(ip);
        console.log(`IP: ${ip}, Country: ${country || 'Unknown'}`);

        const new_id = await Users.create({ username, email, password, country });

        if (new_id) {
            req.login(new_id);
            log(`${username}#${new_id} has registered${country ? ` from ${country}` : ''}`);
            req.session.login = { username };
            req.flash('success', 'You have successfully registered.');
            return res.redirect('/');
        } else {
            throw new Error('Failed to create user');
        }
    } catch (error) {
        console.error('Registration error:', error);
        req.flash('danger', 'An error occurred during registration. Please try again.');
        return res.redirect('/register');
    }
});

async function getLocationFromIp(ip) {
    if (!ip || ip === '::1') {
        ip = '72.229.28.185'; // example for testing
    }

    try {
        const response = await axios.get(`https://ipapi.co/${ip}/country/`, { timeout: 5000 });
        return response.data !== 'Undefined' ? response.data : null;
    } catch (error) {
        console.error('Error in IP geolocation:', error);
        return null; // Return null instead of throwing, to simplify error handling
    }
}

/**
 * Delete route
 */

//POST '/delete' route
router.post('/delete', csrfValidation, async (req, res) => {
    try {
        // Extract password from the request's body
        const { password } = req.body;

        // Find the password of the user from the database
        const hash = await Users.getPasswordFromId(req.user_id);
        if (!hash) {
            req.flash('danger', 'User not found.');
            return res.redirect(`/profile/${req.user_id}`);
        }

        // Compare the password entered to the hash from the database
        const match = await authentication.comparePassword(password, hash);
        if (!match) {
            req.flash('danger', 'Incorrect password.');
            return res.redirect(`/profile/${req.user_id}`);
        }

        // Deactivate user
        const deactivated = await Users.deactivate(req.user_id);
        if (!deactivated) {
            req.flash('danger', 'Failed to deactivate account. Please try again.');
            return res.redirect(`/profile/${req.user_id}`);
        }

        // Logout the user
        try {
            req.logout();
            log(`${req.user.username}#${req.user_id} has deactivated their account`);
            req.flash('success', 'Your account has been deactivated.');
        } catch (err) {
            console.error('Logout error:', err);
            req.flash('danger', 'An error occurred during logout. Your account has been deactivated.');
        }
        res.redirect('/');

    } catch (error) {
        console.error('Account deactivation error:', error);
        req.flash('danger', 'An unexpected error occurred. Please try again.');
        res.redirect(`/profile/${req.user_id}`);
    }
});

export default router;