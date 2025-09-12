// Player class constructor
const Player = function (socket, guestId = null) {
    this.socket = socket;
    socket.player = this;

    if (guestId) {
        this.id = guestId;
        this.username = guestId;
        this.country = socket.request.session.guestCountry;
        this.isGuest = true;
    } else {
        this.id = socket.request.session.user.id;
        this.username = socket.request.session.user.username;
        this.country = socket.request.session.user.country;
        this.isGuest = false;
        this.rating = socket.request.session.user.rating;
    }

    this.inQueue = false;
    this.inGame = false;
};

// Export Player class
export default Player;