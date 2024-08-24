const events = {
    ballPotted(game, ball) {

        switch (ball.color) {
            case 'red':
            case 'yellow':
                // this.handleBlackBall(game); // for testing
                this.handleColoredBall(game, ball);
                break;
            case 'white':
                this.handleWhiteBall(game, ball);
                break;
            case 'black':
                this.handleBlackBall(game);
                break;
        }

        // update the score immediately
        [game.turn, game.nextTurn].forEach((player, i, array) => {
            let opponent = array[1 - i];
            player.socket.emit('game-scoreUpdate', {
                player: player.score,
                opponent: opponent.score,
                playercolor: player.color,
                opponentcolor: opponent.color,
                gameColorSet: (game.turn.color === undefined ? false : true)
            });
        })
    },

    handleColoredBall(game, ball) {

        // give a color if no ball gone
        if (game.turn.color === undefined) {
            game.turn.color = ball.color;
            game.nextTurn.color = ball.color === 'red' ? 'yellow' : 'red'; // opponent color
        }

        // add if colors is same, or give a foul and give to opponent
        if (game.turn.color === ball.color) {
            game.turn.score++;
            game.potted = true; // needed to keep turn
        } else {
            game.nextTurn.score++;
            game.foul = true;
        }

        // remove ball from pool
        game.balls.splice(game.balls.indexOf(ball), 1);
    },

    handleWhiteBall(game, ball) {
        game.foul = true;
        ball.position.set(1000, 1000);
        ball.velocity.set(0, 0);
        ball.acceleration.set(0, 0);
        game.whiteBallPotted = true;
    },

    handleBlackBall(game) {
        if (game.turn.score >= 7) {
            game.winner = game.turn;
            game.winner.score++;
            game.winReason = 1;
        } else {
            game.winner = game.nextTurn;
            game.winReason = 2;
        }
    },
};

export default events;