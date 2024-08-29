class Queue {
    constructor() {
        this.users = [];
    }

    get size() {
        return this.users.length;
    }

    enqueue(player) {
        this.users.push(player);
        player.inQueue = true;
    }

    dequeue() {
        const player = this.users.shift();
        if (player) {
            player.inQueue = false;
        }
        return player;
    }

    remove(player) {
        const index = this.users.indexOf(player);
        if (index !== -1) {
            this.users.splice(index, 1);
            player.inQueue = false;
        }
    }
}

export default Queue;