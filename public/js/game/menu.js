// Show menu method
export const showMenu = function () {

    // Show the menu element and hide the others
    $("#gameContainer").show();
    $("#menu").show();
    $("#queue").hide();
    $("#game").hide();
    $("#gameEnd").hide();
};

// Show queue method
export const showQueue = function () {

    // Show the queue element and hide the others
    $("#gameContainer").show();
    $("#menu").hide();
    $("#queue").show();
    $("#game").hide();
    $("#gameEnd").hide();

};

// Show game method
export const showGame = function () {

    // Show the game element and hide the others
    $("#gameContainer").hide();
    $("#menu").hide();
    $("#queue").hide();
    $("#game").show();
    $("#gameEnd").hide();

};

// Show game end method
export const showGameEnd = function () {

    // Show the game end element and hide the others
    $("#gameContainer").show();
    $("#menu").hide();
    $("#queue").hide();
    $("#game").hide();
    $("#gameEnd").show();

};

// By default, show the menu
showMenu();

// Prevent accidental game disconnect
window.onbeforeunload = function () {
    if (!game) return null;
};