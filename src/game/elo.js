const ELO_START_RATING = 300;
const ELO_MAX = 1000;
const ELO_MIN = 0;
const ELO_SCALE_FACTOR = 300;

export const elo = {
    initialRating() {
        return ELO_START_RATING   
    },

    getKFactor(rating, opponentRating) {
        let baseK;
        if (rating < 200) baseK = 100;
        else if (rating < 400) baseK = 80;
        else if (rating < 600) baseK = 60;
        else if (rating < 800) baseK = 40;
        else baseK = 20;

        const ratingGap = Math.abs(rating - opponentRating);
        if (ratingGap > 200) baseK *= 0.7;
        else if (ratingGap > 100) baseK *= 0.9;

        return Math.round(baseK);
    },

    calculateExpectedScore(ratingA, ratingB) {
        return 1 / (1 + Math.pow(10, (ratingB - ratingA) / ELO_SCALE_FACTOR))
    },

    calculateNewRating(oldRating, expectedScore, actualScore, opponentRating) {
        let kFactor = this.getKFactor(oldRating, opponentRating);
        let newRating = Math.round(oldRating + kFactor * (actualScore - expectedScore));
        return Math.max(ELO_MIN, Math.min(newRating, ELO_MAX));
    },

    updateRatings(winnerRating, loserRating) {
        const winnerExpectedScore = this.calculateExpectedScore(winnerRating, loserRating);
        const loserExpectedScore = this.calculateExpectedScore(loserRating, winnerRating);
        const newWinnerRating = this.calculateNewRating(winnerRating, winnerExpectedScore, 1);
        const newLoserRating = this.calculateNewRating(loserRating, loserExpectedScore, 0);
        return { newWinnerRating, newLoserRating };
    },
}