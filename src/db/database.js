import sqlite3 from 'sqlite3';
import connectSqlite3 from 'connect-sqlite3';
import chalk from 'chalk';

const database = new sqlite3.Database('./database.db', (err) => {
    if (err) return console.error(chalk.red('Error connecting to the database:', err.message));

    console.log(chalk.green('Connected to the SQLite database.'));
    initializeTables(database);
});

function initializeTables(db) {
    db.run(`CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY NOT NULL UNIQUE,
        username TEXT NOT NULL UNIQUE,
        email TEXT UNIQUE,
        password TEXT NOT NULL,
        wins INTEGER DEFAULT 0,
        losses INTEGER DEFAULT 0,
        rating INTEGER,
        country TEXT,
        is_active BOOL DEFAULT TRUE
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS game (
        id INTEGER PRIMARY KEY NOT NULL UNIQUE,
        winnerId INTEGER NOT NULL,
        loserId INTEGER NOT NULL,
        winnerScore INTEGER DEFAULT 0,
        loserScore INTEGER DEFAULT 0,
        winnerNewRating INTEGER,
        loserNewRating INTEGER,
        ratingGained INTEGER,
        ratingLost INTEGER,
        winReason INTEGER,
        winnerCountry TEXT,
        loserCountry TEXT,
        time TEXT DEFAULT CURRENT_TIMESTAMP
    )`);
}

function sessionStore(session) {
    const SQLiteStore = connectSqlite3(session);
    return new SQLiteStore({ db: 'database.db' });
}

export { database, sessionStore };