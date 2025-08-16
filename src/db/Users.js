// userQueries.js
import { User } from './database.js';
import bcrypt from 'bcryptjs';
import Elo from '../game/Elo.js';
import { Op } from 'sequelize';

const Users = {};

// User create
Users.create = async function (user) {
    try {
        const hash = await bcrypt.hash(user.password, 10);
        const newUser = await User.create({
            username: user.username,
            password: hash,
            country: user.country
        });
        return newUser.id;
    } catch (error) {
        console.error('Error creating user:', error);
        return null;
    }
};

// oauth integration
Users.findByOauthId = async function (oauthId) {
    try {
        const user = await User.findOne({
            where: { oauthId },
            attributes: ['id', 'oauthId', 'username', 'wins', 'losses', 'rating', 'country', 'is_active']
        });
        return user ? user.get({ plain: true }) : null;
    } catch (error) {
        console.error('Error finding user by OAuth ID:', error);
        return null;
    }
};

Users.createFromOAuth = async function (oauthData) {
    try {
        const newUser = await User.create({
            oauthId: oauthData.id,
            username: oauthData.username,
            country: oauthData.country || null,
            // rest should use defaults
        });
        return newUser.get({ plain: true });
    } catch (error) {
        console.error('Error creating user from OAuth:', error);
        return null;
    }
};

// User deactivation
Users.deactivate = async function (id) {
    try {
        await User.update({ is_active: false }, { where: { id } });
        return true;
    } catch (error) {
        console.error('Error deactivating user:', error);
        return false;
    }
};

// User delete
Users.delete = async function (id) {
    try {
        await User.destroy({ where: { id } });
        return true;
    } catch (error) {
        console.error('Error deleting user:', error);
        return false;
    }
};

// Find a user by id
Users.findUserById = async function (id) {
    try {
        const user = await User.findByPk(id, {
            attributes: ['id', 'username', 'wins', 'losses', 'rating', 'is_active', 'country']
        });
        return user ? user.get({ plain: true }) : null;
    } catch (error) {
        console.error('Error finding user by ID:', error);
        return null;
    }
};

// Find id and status by username
Users.findIdAndStatusByUsername = async function (username) {
    try {
        const user = await User.findOne({
            where: { username },
            attributes: ['id', 'is_active']
        });
        return user ? { id: user.id, is_active: user.is_active } : null;
    } catch (error) {
        console.error('Error finding user ID and status by username:', error);
        return null;
    }
};

Users.getRatingFromId = async function (id) {
    try {
        const user = await User.findByPk(id, { attributes: ['rating'] });
        return user ? user.rating : null;
    } catch (error) {
        console.error('Error getting rating from user ID:', error);
        return null;
    }
};

// Query for a user id using a username
Users.queryIdByUsername = async function (username) {
    try {
        const user = await User.findOne({
            where: { username: { [Op.like]: `%${username}%` } },
            attributes: ['id']
        });
        return user ? user.id : null;
    } catch (error) {
        console.error('Error querying user ID by username:', error);
        return null;
    }
};

// Get the leaderboard
Users.getLeaderboard = async function () {
    try {
        const users = await User.findAll({
            where: { is_active: true, rating: { [Op.ne]: null } },
            attributes: ['id', 'username', 'wins', 'losses', 'rating', 'is_active', 'country'],
            order: [['rating', 'DESC']],
            limit: 25
        });
        return users.map(user => user.get({ plain: true }));
    } catch (error) {
        console.error('Error getting leaderboard:', error);
        return null;
    }
};

Users.updateRatingsAfterGame = async function (winnerId, loserId) {
    try {
        const [winner, loser] = await User.findAll({
            where: { id: [winnerId, loserId] },
            attributes: ['id', 'rating', 'wins', 'losses']
        });

        if (!winner || !loser) throw new Error('Winner or loser not found');

        winner.rating = winner.rating || Elo.initialRating();
        loser.rating = loser.rating || Elo.initialRating();

        const { newWinnerRating, newLoserRating } = Elo.updateRatings(winner.rating, loser.rating);
        const ratingGained = newWinnerRating - winner.rating;
        const ratingLost = loser.rating - newLoserRating;

        await User.update(
            { rating: newWinnerRating, wins: (winner.wins || 0) + 1 },
            { where: { id: winnerId } }
        );
        await User.update(
            { rating: newLoserRating, losses: (loser.losses || 0) + 1 },
            { where: { id: loserId } }
        );

        return {
            winnerRating: newWinnerRating,
            loserRating: newLoserRating,
            ratingGained,
            ratingLost,
        };
    } catch (error) {
        console.error('Error updating ratings after game:', error);
        return null;
    }
};

export default Users;