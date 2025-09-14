import Vector from "./Vector.js";

export default class Ball {
    constructor(position, radius, color) {
        this.position = position;
        this.velocity = new Vector();
        this.acceleration = new Vector();
        this.radius = radius;
        this.color = color;
    }
}