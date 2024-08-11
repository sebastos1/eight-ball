'use strict';

// Imports
const Vector = require('./Vector');

// Ball class constructor
const Ball = function (position, radius, color) {

    // Properties
    this.position = position;
    this.velocity = new Vector();
    this.acceleration = new Vector();
    this.radius = radius;
    this.color = color;

};

// Export Ball class
module.exports = Ball;