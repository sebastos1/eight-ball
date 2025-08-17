// Show the menu element and hide the others
export const showMenu = function () {
    $("#gameContainer").show();
    $("#menu").show();
    $("#queue").hide();
    $("#game").hide();
    $("#gameEnd").hide();
    $("#roomWaiting").hide();
};

// Show the queue element and hide the others
export const showQueue = function () {
    $("#gameContainer").show();
    $("#menu").hide();
    $("#queue").show();
    $("#game").hide();
    $("#gameEnd").hide();
    $("#roomWaiting").hide();
};

// Show the game element and hide the others

export const showGame = function () {
    $("#gameContainer").hide();
    $("#menu").hide();
    $("#queue").hide();
    $("#game").show();
    $("#gameEnd").hide();
    $("#roomWaiting").hide();
};

// Show the game end element and hide the others
export const showGameEnd = function () {
    $("#gameContainer").show();
    $("#menu").hide();
    $("#queue").hide();
    $("#game").hide();
    $("#roomWaiting").hide();
    $("#gameEnd").show();
};

export const showRoomWaiting = function () {
    $("#menu").hide();
    $("#queue").hide();
    $("#game").hide();
    $("#gameEnd").hide();
    $("#roomWaiting").show();
};

// By default, show the menu
showMenu();

// Prevent accidental game disconnect
window.onbeforeunload = function () {
    if (!game) return null;
};