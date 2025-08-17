import { userColor, getUserFlag, getRankBadge } from "./helpers.js";

function updatePlayerList(elementId, players) {
    const element = $(`#${elementId}`);

    if (players.length === 0) {
        element.html("<div>No players</div>");
    } else {
        const playerList = players.map(player =>
            `<div class="player-item" style="color:${userColor(player.username)}">
                ${player.rating !== null && player.rating !== undefined ?
                    `<img src="${getRankBadge(player.rating)}" alt="Rank badge" style="width: 24px; height: 24px;">` :
                    ''
                }
                ${getUserFlag(player.country)} ${player.username}
             </div>`
        ).join("");
        element.html(`<div class="player-list-container">${playerList}</div>`);
    }
}

export function initOnlineTracking(socket) {
    socket.on("online-update", (data) => {
        updatePlayerList("playersOnline", data.playersOnline);
    });
}

export function initQueueTracking(socket, queueHtmlId) {
    socket.on("queue-update", (data) => {
        updatePlayerList(queueHtmlId, data.playersInQueue);
    });
}
