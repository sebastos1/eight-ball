// Player class constructor
const Player = function (socket) {

    // Socket
    this.socket = socket;
    socket.player = this;

    // Properties
    this.id = socket.request.session.user_id;
    this.username = socket.request.session.user.username;
    this.country = socket.request.session.user.country;

    this.inQueue = false;
    this.inGame = false;
};

// Export Player class
export default Player;