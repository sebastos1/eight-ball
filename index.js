// Dependencies
import express from 'express';
import { engine } from 'express-handlebars';
import flash from 'connect-flash';
import logger from 'morgan';
import chalk from 'chalk';
import { Server } from 'socket.io';
import http from 'http';


// imports
import applySocketEvents from './src/serverSocket.js';
import authentication from './src/site/authentication.js';
import helpers from './src/site/helpers.js';
import { applySecurityConfig, configureSession } from './src/site/security.js';

// Routers
import indexRouter from './src/routes/index.js';
import usersRouter from './src/routes/users.js';

// Init
const app = express();
const server = http.createServer(app);

app.use(express.urlencoded({ extended: true }));

// Security middleware
applySecurityConfig(app);

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

// Set static path to /public
app.use(express.static('public'));

// HTTP logger middleware
app.use(logger('tiny'));

// Body parser middleware
app.use(express.json());

// socket.io with events
const io = new Server(server, {
    cors: {
        origin: '*',
    },
});

const session = configureSession(app);

// middelware wrapper to translate socket.io to express
const wrap = middleware => (socket, next) => {
    middleware(socket.request, socket.request.res || new http.ServerResponse(socket.request), next);
};
io.use(wrap(session));

// socket events, like on connect and such
applySocketEvents(io);

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
