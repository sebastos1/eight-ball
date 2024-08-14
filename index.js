'use strict';

// Dependencies
const express = require('express');
const expressHandlebars = require('express-handlebars');
const expressSession = require('express-session');
const flash = require('connect-flash');
const logger = require('morgan');
const chalk = require('chalk');

// Imports
const database = require('./src/database.js');
const socket = require('./src/socket.js');
const authentication = require('./src/authentication.js');
const colors = require("./static/js/colors.js");

// Routers
const indexRouter = require('./src/routes/index');
const usersRouter = require('./src/routes/users.js');

// Initialise app
const app = express();

// Initialise server
const server = socket(app);

// Set port
const PORT = process.env.PORT || 8080;
app.set('port', PORT);

// Set view engine
app.engine('hbs', expressHandlebars(
    {
        extname: '.hbs',
        defaultLayout: false,
        helpers: {
            userColor: colors.colorPicker,
            eq: eq,
            timeAgo: timeAgo,
            getRank: getRank,
            getRankColor: getRankColor,
            translateWinReason: translateWinReason,
        }
    }
));
app.set('view engine', 'hbs');

// Set static path
app.use(express.static('static'));

// HTTP logger middleware
app.use(logger('tiny'));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
const session = expressSession({
    store: database.sessionStore(expressSession),
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1 * 24 * 60 * 60 * 1000 } // 1 day
});
app.use(session);
socket.session(session);

// Authentication middleware
app.use(authentication);

// Flash messaging middleware
app.use(flash());
// Custom middleware to load preset flash messages into local variables
app.use((req, res, next) => {
    res.locals.flash_success = req.flash('success');
    res.locals.flash_danger = req.flash('danger');
    res.locals.flash_warning = req.flash('warning');
    next();
});

// Routers
app.use('/', indexRouter);
app.use('/', usersRouter);

// Invalid route
app.get('*', (req, res, next) => next('Page not found.'));

// Error handler
app.use((err, req, res, next) => res.render('error', { error: err }));

// Start the server
server.listen(PORT, () => {
    console.log(chalk.bold.red('Server started...'));
    console.log(chalk.bold.red(`Listening on port ${PORT}...`));
});


/*

HBS HELPERS

*/
function eq(item1, item2) {
    return (item1 === item2);
}

function timeAgo(dateString) {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now - past) / 1000);

    const intervals = [
        { label: 'year', seconds: 31536000 },
        { label: 'month', seconds: 2592000 },
        { label: 'day', seconds: 86400 },
        { label: 'hour', seconds: 3600 },
        { label: 'minute', seconds: 60 },
        { label: 'second', seconds: 1 }
    ];

    for (let i = 0; i < intervals.length; i++) {
        const interval = intervals[i];
        const count = Math.floor(diffInSeconds / interval.seconds);

        if (count >= 1) {
            if (interval.label === 'day' && count === 1) {
                return 'yesterday';
            } else if (interval.label === 'month' && count === 1) {
                return 'last month';
            } else if (interval.label === 'year' && count === 1) {
                return 'last year';
            } else {
                return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
            }
        }
    }

    return 'just now';
}

function getRank(rating) {
    const RANKS = [
        { name: "Wood", minRating: 0 },
        { name: "Copper", minRating: 100 },
        { name: "Bronze", minRating: 200 },
        { name: "Silver", minRating: 300 },
        { name: "Gold", minRating: 400 },
        { name: "Platinum", minRating: 500 },
        { name: "Diamond", minRating: 600 },
        { name: "Master", minRating: 700 },
        { name: "Grandmaster", minRating: 800 },
        { name: "Champion", minRating: 900 }
    ];

    for (let i = RANKS.length - 1; i >= 0; i--) {
        if (rating >= RANKS[i].minRating) {
            return RANKS[i].name;
        }
    }
    return RANKS[0].name;
}

function getRankColor(rating) {
    const RANKS = [
        { name: "wood-text", minRating: 0 },
        { name: "copper-text", minRating: 100 },
        { name: "bronze-text", minRating: 200 },
        { name: "silver-text", minRating: 300 },
        { name: "gold-text", minRating: 400 },
        { name: "plat-text", minRating: 500 },
        { name: "dia-text", minRating: 600 },
        { name: "master-text", minRating: 700 },
        { name: "gm-text", minRating: 800 },
        { name: "champ-text", minRating: 900 }
    ];

    for (let i = RANKS.length - 1; i >= 0; i--) {
        if (rating >= RANKS[i].minRating) {
            return RANKS[i].name;
        }
    }

    return RANKS[0].name;
}

function translateWinReason(reason, didUserWin) {
    let string = didUserWin ? "Won by " : "Lost by ";
    switch (parseInt(reason)) {
        case 1:
            return "🏅 " + string + "score"; // medal
        case 2:
            return "🎱 " + string + "8-ball"; // 8 ball emoji
        case 3:
            return "❌ " + string + "disconnect"; // red x
        default:
            return "❓ " + string + "unknown"; // question mark
    }
}