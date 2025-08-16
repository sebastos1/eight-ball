import axios from 'axios';
import Handlebars from 'handlebars';

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

const user_colors = [
    ["Red", "#FF0000"],
    ["Blue", "#0000FF"],
    ["Green", "#00FF00"],
    ["FireBrick", "#B22222"],
    ["Coral", "#FF7F50"],
    ["YellowGreen", "#9ACD32"],
    ["OrangeRed", "#FF4500"],
    ["SeaGreen", "#2E8B57"],
    ["GoldenRod", "#DAA520"],
    ["Chocolate", "#D2691E"],
    ["CadetBlue", "#5F9EA0"],
    ["DodgerBlue", "#1E90FF"],
    ["HotPink", "#FF69B4"],
    ["BlueViolet", "#8A2BE2"],
    ["SpringGreen", "#00FF7F"],
]

export function userColor(username) {
    if (!username) return;
    let n = (username.charCodeAt(0) + username.charCodeAt(username.length - 1)) % user_colors.length;
    return user_colors[n][1];
}

export function userFlag(country) {
    if (!country) return;

    const codePoints = country.split('').map(char => (char.codePointAt(0) + 127397).toString(16)).join('-');

    const flagUrl = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${codePoints}.svg`;

    return new Handlebars.SafeString(`<img src="${flagUrl}" alt="${country}" class="twemoji-flag">`);
}

function eq(a, b) { return a === b; }

export default {
    eq,
    timeAgo,
    getRank,
    getRankColor,
    translateWinReason,
    userColor,
    userFlag
};

export async function getLocationFromIp(ip) {
    // if (!ip || ip === '::1') {
    //     ip = '72.229.28.185'; // example for testing
    // }

    try {
        const response = await axios.get(`https://ipapi.co/${ip}/country/`, { timeout: 5000 });
        return response.data !== 'Undefined' ? response.data : null;
    } catch (error) {
        console.error('Error in IP geolocation:', error);
        return null; // Return null instead of throwing, to simplify error handling
    }
}