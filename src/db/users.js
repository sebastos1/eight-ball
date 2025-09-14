import { User, Game } from "./database.js";
import { elo } from "../game/elo.js";
import { Op } from "sequelize";

export const users = {
    async create(user) {
        try {
            const newUser = await User.create({
                username: user.username,
                country: user.country
            });
            return newUser.id;
        } catch (error) {
            console.error("Error creating user:", error);
            return null;
        }
    },

    // oauth integration
    async findByOauthId(oauthId) {
        try {
            const user = await User.findOne({
                where: { oauthId },
                attributes: ["id", "oauthId", "username", "wins", "losses", "rating", "country", "is_active"]
            });
            return user ? user.get({ plain: true }) : null;
        } catch (error) {
            console.error("Error finding user by OAuth ID:", error);
            return null;
        }
    },

    async createFromOAuth(oauthData) {
        try {
            const newUser = await User.create({
                oauthId: oauthData.id,
                username: oauthData.username,
                country: oauthData.country || null,
                // rest should use defaults
            });
            return newUser.get({ plain: true });
        } catch (error) {
            console.error("Error creating user from OAuth:", error);
            return null;
        }
    },

    // User deactivation
    async deactivate(id) {
        try {
            await User.update({ is_active: false }, { where: { id } });
            return true;
        } catch (error) {
            console.error("Error deactivating user:", error);
            return false;
        }
    },

    // User delete
    async delete(id) {
        try {
            await User.destroy({ where: { id } });
            return true;
        } catch (error) {
            console.error("Error deleting user:", error);
            return false;
        }
    },

    // Find a user by id
    async findUserById(id) {
        try {
            const user = await User.findByPk(id, {
                attributes: ["id", "username", "wins", "losses", "rating", "is_active", "country"]
            });
            return user ? user.get({ plain: true }) : null;
        } catch (error) {
            console.error("Error finding user by ID:", error);
            return null;
        }
    },

    // Find id and status by username
    async findIdAndStatusByUsername(username) {
        try {
            const user = await User.findOne({
                where: { username },
                attributes: ["id", "is_active"]
            });
            return user ? { id: user.id, is_active: user.is_active } : null;
        } catch (error) {
            console.error("Error finding user ID and status by username:", error);
            return null;
        }
    },

    async getRatingFromId(id) {
        try {
            const user = await User.findByPk(id, { attributes: ["rating"] });
            return user ? user.rating : null;
        } catch (error) {
            console.error("Error getting rating from user ID:", error);
            return null;
        }
    },
    
    async getRatingHistory(userId) {
        try {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const userGames = await Game.findAll({
                where: {
                    [Op.or]: [{ winnerId: userId }, { loserId: userId }],
                    isRated: true,
                    createdAt: {
                        [Op.gte]: thirtyDaysAgo
                    }
                },
                attributes: ['createdAt', 'winnerNewRating', 'loserNewRating', 'winnerId', 'winnerUsername', 'loserUsername'],
                order: [['createdAt', 'ASC']]
            });

            return userGames.map(game => ({
                date: game.createdAt,
                rating: game.winnerId === userId ? game.winnerNewRating : game.loserNewRating,
                opponent: game.winnerId === userId ? game.loserUsername : game.winnerUsername
            }));
        } catch (error) {
            console.error("Error fetching rating history:", error);
            return null;
        }
    },

    // Query for a user id using a username
    async queryIdByUsername(username) {
        try {
            const user = await User.findOne({
                where: { username: { [Op.like]: `%${username}%` } },
                attributes: ["id"]
            });
            return user ? user.id : null;
        } catch (error) {
            console.error("Error querying user ID by username:", error);
            return null;
        }
    },

    // Get the leaderboard
    async getLeaderboard() {
        try {
            const userList = await User.findAll({
                where: { is_active: true, rating: { [Op.ne]: null } },
                attributes: ["id", "username", "wins", "losses", "rating", "is_active", "country"],
                order: [["rating", "DESC"]],
                limit: 25
            });
            return userList.map(user => user.get({ plain: true }));
        } catch (error) {
            console.error("Error getting leaderboard:", error);
            return null;
        }
    },

    async updateRatingsAfterGame(winnerId, loserId) {
        try {
            const userList = await User.findAll({
                where: { id: [winnerId, loserId] },
                attributes: ["id", "rating", "wins", "losses"]
            });

            if (!userList || userList.length !== 2) throw new Error("Winner or loser not found");

            const winner = userList.find(u => u.id === winnerId);
            const loser = userList.find(u => u.id === loserId);

            if (!winner || !loser) throw new Error("Winner or loser not found");

            winner.rating = winner.rating || elo.initialRating();
            loser.rating = loser.rating || elo.initialRating();

            const { newWinnerRating, newLoserRating } = elo.updateRatings(winner.rating, loser.rating);
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
            console.error("Error updating ratings after game:", error);
            return null;
        }
    },
}