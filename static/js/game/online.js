// Connect
const socket = io();

// copied these bad boys from the hbs helpers lol
function getSolidColor(username) {
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

function getUserFlag(country) {
    if (!country) return;

    const codePoints = country.split('').map(char =>
        (char.codePointAt(0) + 127397).toString(16)).join('-');

    const flagUrl = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${codePoints}.svg`;

    return `<img src="${flagUrl}" alt="${country}" class="twemoji-flag">`;
}

function updatePlayerList(elementId, players) {
    const element = $(`#${elementId}`);
    if (players.length === 0) {
        element.html('<div>No players</div>');
    } else {
        const playerList = players.map(player =>
            `<div class="player-item" style="color:${getSolidColor(player.username)}">
                ${getUserFlag(player.country)} ${player.username}
             </div>`
        ).join('');
        element.html(`<div class="player-list-container">${playerList}</div>`);
    }
}

// dashboard page for live updates on players online/in queue
socket.on('online-update', (data) => {
    updatePlayerList('playersOnline', data.playersOnline);
});

socket.on('queue-update', (data) => {
    updatePlayerList('playersInQueue', data.playersInQueue);
});

socket.emit('requestOnlineUpdate');
