import http from "http";
import logger from "morgan";
import chalk from "chalk";
import express from "express";
import flash from "connect-flash";
import { Server } from "socket.io";
import { engine } from "express-handlebars";
import dotenv from "dotenv";

// imports
import helpers from "./src/site/helpers.js";
import applySocketEvents from "./src/serverSocket.js";
import { authentication } from "./src/site/authentication.js";
import { applySecurityConfig } from "./src/site/security.js";
import { configureSessionStore, initializeDatabase, sessionStore } from "./src/db/database.js";
import { initOAuth } from "./src/site/authentication.js";
import { ExpressStoreAdapter } from "./src/db/adapter.js";

// Routers
import indexRouter from "./src/routes/index.js";
import authRouter from "./src/routes/auth.js";

// Init
dotenv.config();
const app = express();
const PORT = process.env.PORT || 8080;
const server = http.createServer(app);

export const appBaseUrl = process.env.APP_BASE_URL || `http://localhost:${PORT}`;
export const oauthServer = process.env.OAUTH2_AUTH_SERVER || "http://localhost:3001";

await initializeDatabase();

app.use(express.urlencoded({ extended: true }));

// Security middleware
applySecurityConfig(app);

// Set port
app.set("port", PORT);

// Set view engine
app.engine("hbs", engine({
    extname: ".hbs",
    defaultLayout: "main",
    helpers: helpers,
}));
app.set("view engine", "hbs");

// Set static path to /public
app.use(express.static("public", {
    setHeaders: (res, path) => {
        if (path.endsWith('.js')) {
            res.set('Content-Type', 'application/javascript');
        }
    }
}));

// HTTP logger middleware
app.use(logger("tiny"));

// Body parser middleware
app.use(express.json());

// socket.io with events
const io = new Server(server, {
    cors: {
        origin: "*",
    },
});

const session = configureSessionStore(app);
const storeAdapter = new ExpressStoreAdapter(sessionStore);
initOAuth(storeAdapter);

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
    res.locals.flash_success = req.flash("success");
    res.locals.flash_danger = req.flash("danger");
    res.locals.flash_warning = req.flash("warning");
    next();
});

// Routers
app.use("/", indexRouter);
app.use("/", authRouter);

// Invalid route
app.get("*", (_req, _res, next) => next("Page not found."));

// Error handler
app.use((err, _req, res, _next) => res.render("error", { error: err }));

// Start the server
server.listen(PORT, () => {
    console.log(chalk.bold.red("Server started..."));
    console.log(chalk.bold.red(`Listening on port ${PORT}...`));
});
