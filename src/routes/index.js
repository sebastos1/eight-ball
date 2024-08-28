import express from 'express';
import Users from '../db/Users.js';
import Games from '../db/Games.js';

const router = express.Router();

// GET '/' route
router.get('/', async (req, res) => {
    const loggedIn = req.authenticated;
    if (!loggedIn) return res.render('dashboard', { loggedIn });

    try {
        const game = await Games.getLatestByUserId(req.user_id);
        return res.render('dashboard', { game, loggedIn });
    } catch (error) {
        console.error('Error fetching latest game:', error);
        return res.status(500).render('error', { message: 'Database error' });
    }
});

// GET '/play' route
router.get('/play', (req, res) => {
    if (!req.authenticated) {
        req.flash('danger', 'Log in to play :)');
        return res.redirect('/login');
    }
    return res.render('play');
});

// GET '/profile' route
router.get('/profile', async (req, res) => {
    if (!req.query.username) {
        if (!req.authenticated) {
            req.flash('danger', 'You are not logged in.');
            return res.redirect('/login');
        }
        return res.redirect(`/profile/${req.user_id}`);
    }

    try {
        const id = await Users.queryIdByUsername(req.query.username);
        if (!id) {
            return res.status(404).render('error', { message: 'User not found' });
        }
        return res.redirect(`/profile/${id}`);
    } catch (error) {
        console.error('Error querying user:', error);
        return res.status(500).render('error', { message: 'Database error' });
    }
});

// GET '/profile/:id' route
router.get('/profile/:id', async (req, res) => {
    try {
        const profile = await Users.findUserById(req.params.id);
        if (!profile) return res.status(404).render('error', { message: 'User not found' });

        const selfProfile = req.params.id == req.user_id;
        const gamesPlayed = profile.wins + profile.losses;
        const winRate = gamesPlayed ? Math.round(profile.wins * 100 / gamesPlayed) + '%' : '-';

        const games = await Games.getGamesByUserId(profile.id);
        return res.render('profile', { profile, games, selfProfile, gamesPlayed, winRate });
    } catch (error) {
        console.error('Error fetching profile:', error);
        return res.status(500).render('error', { message: 'Database error' });
    }
});

// GET '/leaderboard' route
router.get('/leaderboard', async (req, res) => {
    try {
        const users = await Users.getLeaderboard();
        if (!users) {
            return res.status(500).render('error', { message: 'Database error' });
        }

        users.forEach((user, index) => {
            user.position = index + 1;
            user.self = user.id == req.user_id;
            user.gamesPlayed = user.wins + user.losses;
            user.winRate = user.gamesPlayed ? Math.round(user.wins * 100 / user.gamesPlayed) + '%' : '-';
        });

        return res.render('leaderboard', { users });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        return res.status(500).render('error', { message: 'Database error' });
    }
});

router.get('/about', (_req, res) => {
    return res.render('about');
});

export default router;