// Dependencies
import express from 'express';
import chalk from 'chalk';
import axios from 'axios';

// imports
import Users from '../db/Users.js';
import authentication from '../site/authentication.js';
import { csrfValidation } from '../site/security.js';
import { oauthServer, oauthClientId, oauthClientSecret } from '../../index.js';

// Initialise route handler
const router = express.Router();

// Log function
const log = (string) => console.log(`${chalk.bold.underline.cyan('USER')} ${chalk.yellow('»')} ${chalk.green(string)}`);

/*
    OAUTH INTEGRATION
*/
async function exchangeCodeForUserData(code) {
    try {
        const authHeader = 'Basic ' + Buffer.from(`${oauthClientId}:${oauthClientSecret}`).toString('base64');

        const tokenResponse = await axios.post(`${oauthServer}/token`, {
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: `${oauthServer}/success`
        }, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': authHeader
            }
        });

        const { access_token } = tokenResponse.data;

        const userResponse = await axios.get(`${oauthServer}/userinfo`, {
            headers: {
                'Authorization': `Bearer ${access_token}`
            }
        });

        console.log("country", userResponse.data.country);

        return {
            id: userResponse.data.sub,
            username: userResponse.data.username,
            country: userResponse.data.country
        };
    } catch (error) {
        console.error('Error exchanging code for user data:', error);
        throw new Error('Failed to authenticate user');
    }
}

// oauth callback swag
router.post('/auth/callback', async (req, res) => {
    try {
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ error: 'No code provided' });
        }

        const oauthData = await exchangeCodeForUserData(code);
        let user = await Users.findByOauthId(oauthData.id);
        if (!user) {
            user = await Users.createFromOAuth(oauthData);
        }

        req.login(user.id);
        res.json({ success: true });
    } catch (error) {
        console.error('Auth callback error:', error);
        res.status(500).json({ error: 'Authentication failed' });
    }
});

/**
 * Logout route
 */

// GET '/logout' route
router.get('/logout', (req, res) => {

    if (!req.authenticated) {
        req.flash('danger', 'You are not logged in.');
        return res.redirect('/');
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