'use strict';

const ELO_START_RATING = 250;
const ELO_K_FACTOR = 24;
const ELO_MAX = 1000;
const ELO_MIN = 0;
const ELO_SCALE_FACTOR = 300;

const Elo = {};

Elo.initialRating = function () {
    return ELO_START_RATING;
}

Elo.calculateExpectedScore = function (ratingA, ratingB) {
    return 1 / (1 + Math.pow(10, (ratingB - ratingA) / ELO_SCALE_FACTOR));
};

Elo.calculateNewRating = function (oldRating, expectedScore, actualScore) {
    let newRating = Math.round(oldRating + ELO_K_FACTOR * (actualScore - expectedScore));
    return Math.max(ELO_MIN, Math.min(newRating, ELO_MAX));
}

Elo.updateRatings = function (winnerRating, loserRating) {
    const winnerExpectedScore = this.calculateExpectedScore(winnerRating, loserRating);
    const loserExpectedScore = this.calculateExpectedScore(loserRating, winnerRating);

    const newWinnerRating = this.calculateNewRating(winnerRating, winnerExpectedScore, 1);
    const newLoserRating = this.calculateNewRating(loserRating, loserExpectedScore, 0);

    return { newWinnerRating, newLoserRating };
}

module.exports = Elo;