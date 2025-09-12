import session from "express-session";
import expressSession from "express-session";
import { Sequelize, DataTypes } from "sequelize";
import SequelizeStoreFactory from "connect-session-sequelize";

export const database = new Sequelize({
    dialect: "sqlite",
    storage: "./database.db",
    logging: false,
});

const SequelizeStore = SequelizeStoreFactory(session.Store);
export const sessionStore = new SequelizeStore({
    db: database,
});

export const configureSessionStore = (app) => {
    const sessionMiddleware = expressSession({
        store: sessionStore,
        secret: "secret",
        resave: false,
        saveUninitialized: false,
        cookie: {
            maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
            secure: "auto",
        },
    });

    app.use(sessionMiddleware);
    return sessionMiddleware;
};

export const User = database.define("User", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        unique: true
    },
    oauthId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    wins: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    losses: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    rating: {
        type: DataTypes.INTEGER
    },
    country: {
        type: DataTypes.STRING
    },
    is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }
});

export const Game = database.define("Game", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
        unique: true
    },
    winnerId: {
        type: DataTypes.INTEGER,
    },
    loserId: {
        type: DataTypes.INTEGER,
    },
    winnerUsername: {
        type: DataTypes.STRING,
    },
    loserUsername: {
        type: DataTypes.STRING,
    },
    winnerCountry: {
        type: DataTypes.STRING,
    },
    loserCountry: {
        type: DataTypes.STRING,
    },
    isRated: {
        type: DataTypes.BOOLEAN,
        defaultValue: true // guest games are unrated
    },
    winnerScore: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    loserScore: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    winnerNewRating: {
        type: DataTypes.INTEGER
    },
    loserNewRating: {
        type: DataTypes.INTEGER
    },
    ratingGained: {
        type: DataTypes.INTEGER
    },
    ratingLost: {
        type: DataTypes.INTEGER
    },
    winReason: {
        type: DataTypes.INTEGER
    },
});

// Define relationships
User.hasMany(Game, { as: "WonGames", foreignKey: "winnerId" });
User.hasMany(Game, { as: "LostGames", foreignKey: "loserId" });
Game.belongsTo(User, { as: "Winner", foreignKey: "winnerId" });
Game.belongsTo(User, { as: "Loser", foreignKey: "loserId" });

export const initializeDatabase = async () => {
    try {
        await database.sync();
        console.log("Database synced");
    } catch (error) {
        console.error("Failed syncing database:", error);
    }
};


