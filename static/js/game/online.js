// Connect
const socket = io();

// copied these bad boys from the hbs helpers lol
function getSolidColor(username) {
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
}

function getUserFlag(country) {
    if (!country || country == "UN") return '';

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


