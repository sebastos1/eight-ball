export const YELLOW_COL = "#1CCC7F"; // teal
export const RED_COL = "#C43E64"; // purple ish

// copied these bad boys from the local hbs helpers lol
export function getSolidColor(username) {
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

export function getUserFlag(country) {
    if (!country) return;

    const codePoints = country.split('').map(char =>
        (char.codePointAt(0) + 127397).toString(16)).join('-');

    const flagUrl = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${codePoints}.svg`;

    return `<img src="${flagUrl}" alt="${country}" class="twemoji-flag">`;
}