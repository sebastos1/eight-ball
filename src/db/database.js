// Dependencies
import sqlite from 'sqlite3';
import connectSQLite from 'connect-sqlite3';
import chalk from 'chalk';

// Initialise database connection
const database = new sqlite.Database('./database.db', (err) => {
    if (err) throw err;
    console.log(chalk.bold.red('Database connected...'));
});

export default database;

// Execute in serialised mode
database.serialize(() => {

    // Create user table query then run the query
    let sql_user = `CREATE TABLE IF NOT EXISTS user (
                        id INTEGER PRIMARY KEY NOT NULL UNIQUE,
                        username TEXT NOT NULL UNIQUE,
                        email TEXT UNIQUE,
                        password TEXT NOT NULL,
                        wins INTEGER DEFAULT 0,
                        losses INTEGER DEFAULT 0,
                        rating INTEGER,
                        country TEXT,
                        is_active BOOL DEFAULT TRUE
                    );`;
    database.run(sql_user, (err) => { if (err) throw err; });

    // Create game table query then run the query
    let sql_game = `CREATE TABLE IF NOT EXISTS game (
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
                        time TEXT DEFAULT CURRENT_TIMESTAMP
                    );`;
    database.run(sql_game, (err) => { if (err) throw err; });

    // populate a lil
    // createUsersWithFixedRanks((err) => {
    //     if (err) {
    //         console.log('Error creating users:', err);
    //     } else {
    //         console.log('Successfully created 20 users with fixed ranks');
    //     }
    // });
});

// Session store
database.sessionStore = (session) => new (connectSQLite(session))({ db: 'database.db' });



// POPULATING
function generateRandomUsername() {
    const adjectives = ['Happy', 'Sunny', 'Clever', 'Swift', 'Brave', 'Witty', 'Gentle', 'Calm', 'Eager', 'Jolly'];
    const nouns = ['Panda', 'Tiger', 'Eagle', 'Dolphin', 'Fox', 'Wolf', 'Bear', 'Lion', 'Hawk', 'Owl'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 100);
    return `${adj}${noun}${number}`;
}

function getRandomCountryCode() {
    const countryCodesPool = ['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'JP', 'BR', 'IN', 'CN', 'RU', 'MX', 'ES', 'IT', 'NL', 'SE', 'NO', 'DK', 'FI', 'CH'];
    return countryCodesPool[Math.floor(Math.random() * countryCodesPool.length)];
}

function createUser(username, rating, country, callback) {
    const sql = `INSERT INTO user (username, email, password, rating, country) VALUES (?, ?, ?, ?, ?);`;
    const params = [username, null, 'a', rating, country];
    database.run(sql, params, function (err) {
        if (err) {
            console.log(`Failed to create user: ${username}`);
            return callback(err);
        }
        console.log(`User created: ${username} with rating: ${rating} and country: ${country}`);
        callback(null);
    });
}

function createUsersWithFixedRanks(callback) {
    const ranks = [
        { min: 0, max: 99 },   // Wood
        { min: 100, max: 199 }, // Copper
        { min: 200, max: 299 }, // Bronze
        { min: 300, max: 399 }, // Silver
        { min: 400, max: 499 }, // Gold
        { min: 500, max: 599 }, // Platinum
        { min: 600, max: 699 }, // Diamond
        { min: 700, max: 799 }, // Master
        { min: 800, max: 899 }, // Grandmaster
        { min: 900, max: 1000 } // Champion
    ];
    let usersCreated = 0;
    const totalUsers = 20; // Two users for each rank

    function createUserForRank(rankIndex, userIndex, userCreatedCallback) {
        if (userIndex >= 2) {
            // Move to the next rank
            return userCreatedCallback(null);
        }
        const username = generateRandomUsername();
        const rank = ranks[rankIndex];
        const rating = Math.floor(Math.random() * (rank.max - rank.min + 1)) + rank.min;
        const country = getRandomCountryCode();
        createUser(username, rating, country, (err) => {
            if (err) return userCreatedCallback(err);
            usersCreated++;
            createUserForRank(rankIndex, userIndex + 1, userCreatedCallback);
        });
    }

    function processNextRank(rankIndex) {
        if (rankIndex >= ranks.length) {
            return callback(null);
        }
        createUserForRank(rankIndex, 0, (err) => {
            if (err) return callback(err);
            processNextRank(rankIndex + 1);
        });
    }

    processNextRank(0);
}