// gameQueries.js
import { User, Game } from './database.js';
import { Op } from 'sequelize';

const Games = {};

// Game create
Games.create = async function (winner, loser, ratingChanges, winReason) {
    try {
        const isRated = ratingChanges !== null;
        let winnerRating = null, loserRating = null;
        let ratingGained = null, ratingLost = null;
    
        if (isRated) {
            ({ winnerRating, loserRating, ratingGained, ratingLost } = ratingChanges);
        }

        const newGame = await Game.create({
            winnerId: winner.isGuest ? null : winner.id,
            loserId: loser.isGuest ? null : loser.id,
            winnerUsername: winner.username,
            loserUsername: loser.username,
            winnerCountry: winner.country,
            loserCountry: loser.country,
            winnerScore: winner.score,
            loserScore: loser.score,
            winnerNewRating: winnerRating,
            loserNewRating: loserRating,
            ratingGained,
            ratingLost,
            winReason,
            isRated
        });
        return newGame.id;
    } catch (error) {
        console.error('Error creating game:', error);
        return null;
    }
};

// Get the games of a user from their id
Games.getGamesByUserId = async function (id) {
    try {
        const games = await Game.findAll({
            where: {
                [Op.or]: [{ winnerId: id }, { loserId: id }]
            },
            include: [
                { model: User, as: 'Winner', attributes: ['username', 'country'] },
                { model: User, as: 'Loser', attributes: ['username', 'country'] }
            ],
            order: [['createdAt', 'DESC']],
            limit: 25
        });
        return games.map(game => game.get({ plain: true }));
    } catch (error) {
        console.error('Error fetching games by user ID:', error);
        return null;
    }
};

// Get the latest game played by a user from their id
Games.getLatestByUserId = async function (id) {
    try {
        const game = await Game.findOne({
            where: {
                [Op.or]: [{ winnerId: id }, { loserId: id }]
            },
            include: [
                { model: User, as: 'Winner', attributes: ['username', 'country'] },
                { model: User, as: 'Loser', attributes: ['username', 'country'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        return game ? game.get({ plain: true }) : null;
    } catch (error) {
        console.error('Error fetching latest game by user ID:', error);
        return null;
    }
};

export default Games;