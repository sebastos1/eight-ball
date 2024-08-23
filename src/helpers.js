const Handlebars = require('handlebars');
const colors = require("../static/js/colors.js");

module.exports = {
    userColor: colors.colorPicker,

    eq: function (a, b) {
        return (a === b);
    },

    timeAgo: function (dateString) {
        const now = new Date();
        const past = new Date(dateString);
        const diffInSeconds = Math.floor((now - past) / 1000);

        const intervals = [
            { label: 'year', seconds: 31536000 },
            { label: 'month', seconds: 2592000 },
            { label: 'day', seconds: 86400 },
            { label: 'hour', seconds: 3600 },
            { label: 'minute', seconds: 60 },
            { label: 'second', seconds: 1 }
        ];

        for (let i = 0; i < intervals.length; i++) {
            const interval = intervals[i];
            const count = Math.floor(diffInSeconds / interval.seconds);

            if (count >= 1) {
                if (interval.label === 'day' && count === 1) {
                    return 'yesterday';
                } else if (interval.label === 'month' && count === 1) {
                    return 'last month';
                } else if (interval.label === 'year' && count === 1) {
                    return 'last year';
                } else {
                    return `${count} ${interval.label}${count !== 1 ? 's' : ''} ago`;
                }
            }
        }

        return 'just now';
    },

    getRank: function (rating) {
        const RANKS = [
            { name: "Wood", minRating: 0 },
            { name: "Copper", minRating: 100 },
            { name: "Bronze", minRating: 200 },
            { name: "Silver", minRating: 300 },
            { name: "Gold", minRating: 400 },
            { name: "Platinum", minRating: 500 },
            { name: "Diamond", minRating: 600 },
            { name: "Master", minRating: 700 },
            { name: "Grandmaster", minRating: 800 },
            { name: "Champion", minRating: 900 }
        ];

        for (let i = RANKS.length - 1; i >= 0; i--) {
            if (rating >= RANKS[i].minRating) {
                return RANKS[i].name;
            }
        }
        return RANKS[0].name;
    },

    getRankColor: function (rating) {
        const RANKS = [
            { name: "wood-text", minRating: 0 },
            { name: "copper-text", minRating: 100 },
            { name: "bronze-text", minRating: 200 },
            { name: "silver-text", minRating: 300 },
            { name: "gold-text", minRating: 400 },
            { name: "plat-text", minRating: 500 },
            { name: "dia-text", minRating: 600 },
            { name: "master-text", minRating: 700 },
            { name: "gm-text", minRating: 800 },
            { name: "champ-text", minRating: 900 }
        ];

        for (let i = RANKS.length - 1; i >= 0; i--) {
            if (rating >= RANKS[i].minRating) {
                return RANKS[i].name;
            }
        }

        return RANKS[0].name;
    },

    translateWinReason: function (reason, didUserWin) {
        let string = didUserWin ? "Won by " : "Lost by ";
        switch (parseInt(reason)) {
            case 1:
                return "🏅 " + string + "score"; // medal
            case 2:
                return "🎱 " + string + "8-ball"; // 8 ball emoji
            case 3:
                return "❌ " + string + "disconnect"; // red x
            default:
                return "❓ " + string + "unknown"; // question mark
        }
    },

    userSolidColor: function (username) {
        const minBrightness = 128;
        const maxBrightness = 230;

        let hash = 0;
        for (let i = 0; i < username.length; i++) {
            hash = username.charCodeAt(i) + ((hash << 5) - hash);
        }

        let r = (hash & 0xFF0000) >> 16;
        let g = (hash & 0x00FF00) >> 8;
        let b = hash & 0x0000FF;

        r = Math.max(r, minBrightness);
        g = Math.max(g, minBrightness);
        b = Math.max(b, minBrightness);
        r = Math.min(r, maxBrightness);
        g = Math.min(g, maxBrightness);
        b = Math.min(b, maxBrightness);

        return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
    },

    userFlag: function (country) {
        if (!country || country == "UN") return;

        // Convert country code to flag emoji codepoints
        const codePoints = country.split('').map(char => (char.codePointAt(0) + 127397).toString(16)).join('-');

        const flagUrl = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${codePoints}.svg`;

        return new Handlebars.SafeString(`<img src="${flagUrl}" alt="${country}" class="twemoji-flag">`);

    },
}