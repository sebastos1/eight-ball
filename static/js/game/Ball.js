'use strict';

const skull = new Image();
skull.src = "/img/AINTNOWAY.png";

// Ball class constructor
const Ball = function (position, radius, color) {

    // Properties
    this.position = position;
    this.radius = radius;
    this.color = color;

};

// Ball draw method
Ball.prototype.draw = function () {
    switch (this.color) {
        case "black":
            canvas.drawImage(this.position, TABLE, this.radius * 2, skull);
            break;
        case "yellow":
            canvas.drawCircle(this.position, TABLE, this.radius, YELLOW_COL);
            break;
        case "red":
            canvas.drawCircle(this.position, TABLE, this.radius, RED_COL);
            break;
        default:
            canvas.drawCircle(this.position, TABLE, this.radius, this.color);
    }
};