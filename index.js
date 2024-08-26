// Dependencies
import express from 'express';
import { engine } from 'express-handlebars';
import expressSession from 'express-session';
import flash from 'connect-flash';
import logger from 'morgan';
import chalk from 'chalk';
import { Server } from 'socket.io';
import http from 'http';

// imports
import { sessionStore } from './src/db/database.js';
import socketEvents from './src/serverSocket.js';
import authentication from './src/authentication.js';
import helpers from './src/helpers.js';

// Routers
import indexRouter from './src/routes/index.js';
import usersRouter from './src/routes/users.js';

// Init
const app = express();
const server = http.createServer(app);

// Set port
const PORT = process.env.PORT || 8080;
app.set('port', PORT);

// Set view engine
app.engine('hbs', engine({
    extname: '.hbs',
    defaultLayout: false,
    helpers: helpers,
}));
app.set('view engine', 'hbs');

// for geoloc
app.set('trust proxy', true);

// Set static path
app.use(express.static('public'));

// HTTP logger middleware
app.use(logger('tiny'));

// Body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
const session = expressSession({
    store: sessionStore(expressSession),
    secret: 'secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 3 * 24 * 60 * 60 * 1000, // 3 day
        secure: 'auto',
    }
});
app.use(session);

// socket.io with events
const io = new Server(server);

// middleware thingy
const wrap = middleware => (socket, next) => {
    middleware(socket.request, socket.request.res || new http.ServerResponse(socket.request), next);
};
io.use(wrap(session));

// socket events, like on connect and such
socketEvents(io);

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
app.get('*', (_req, _res, next) => next('Page not found.'));

// Error handler
app.use((err, _req, res, _next) => res.render('error', { error: err }));

// Start the server
server.listen(PORT, () => {
    console.log(chalk.bold.red('Server started...'));
    console.log(chalk.bold.red(`Listening on port ${PORT}...`));
});
