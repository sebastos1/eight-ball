'use strict';

// Dependencies
const sqlite = require('sqlite3');
const connectSQLite = require('connect-sqlite3');
const chalk = require('chalk');

// Initialise database connection
const database = new sqlite.Database('./database.db', (err) => {
    if (err) throw err;
    console.log(chalk.bold.red('Database connected...'));
});

// Execute in serialised mode
database.serialize(() => {

    // Create user table query then run the query
    let sql_user = `CREATE TABLE IF NOT EXISTS user (
                        id INTEGER PRIMARY KEY NOT NULL UNIQUE,
                        username TEXT NOT NULL UNIQUE,
                        email TEXT NOT NULL UNIQUE,
                        password TEXT NOT NULL,
                        firstname TEXT NOT NULL,
                        lastname TEXT NOT NULL,
                        wins INTEGER DEFAULT 0,
                        losses INTEGER DEFAULT 0
                    );`;
    database.run(sql_user, (err) => { if (err) throw err; });

    // Create game table query then run the query
    let sql_game = `CREATE TABLE IF NOT EXISTS game (
                        id INTEGER PRIMARY KEY NOT NULL UNIQUE,
                        winnerId INTEGER NOT NULL,
                        loserId INTEGER NOT NULL,
                        winnerScore INTEGER DEFAULT 0,
                        loserScore INTEGER DEFAULT 0,
                        time TEXT DEFAULT CURRENT_TIMESTAMP
                    );`;
    database.run(sql_game, (err) => { if (err) throw err; });

});

// Session store
database.sessionStore = (session) => new (connectSQLite(session))({ db: 'database.db' });

// Export the database module
module.exports = database;