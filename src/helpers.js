import Handlebars from 'handlebars';

export function eq(a, b) {
    return (a === b);
}

export function timeAgo(dateString) {
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
}

export function getRank(rating) {
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
}

export function getRankColor(rating) {
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
}

export function translateWinReason(reason, didUserWin) {
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
}

export function userSolidColor(username) {
    const minBrightness = 160;
    const maxBrightness = 255;

    const hash = username.split('').reduce((acc, char, i) =>
        acc + char.charCodeAt(0) * (i + 1), 0);

    const primary = Math.abs(hash) % 3;

    const r = minBrightness + (hash & 63);
    const g = minBrightness + ((hash >> 6) & 63);
    const b = minBrightness + ((hash >> 12) & 63);

    const colors = [r, g, b].map((c, i) =>
        i === primary
            ? Math.min(c * 1.5, maxBrightness)
            : Math.max(c * 0.6, minBrightness)
    );

    return `#${colors.map(c => Math.round(c).toString(16).padStart(2, '0')).join('')}`;
}

export function userFlag(country) {
    if (!country) return;

    // Convert country code to flag emoji codepoints
    const codePoints = country.split('').map(char => (char.codePointAt(0) + 127397).toString(16)).join('-');

    const flagUrl = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${codePoints}.svg`;

    return new Handlebars.SafeString(`<img src="${flagUrl}" alt="${country}" class="twemoji-flag">`);
}

// If you need a default export as well, you can add:
export default {
    eq,
    timeAgo,
    getRank,
    getRankColor,
    translateWinReason,
    userSolidColor,
    userFlag
};