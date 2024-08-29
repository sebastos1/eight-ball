class Vector {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    get length() {
        return Math.hypot(this.x, this.y);
    }

    get lengthSquared() {
        return this.x ** 2 + this.y ** 2;
    }

    get angle() {
        return Math.atan2(this.y, this.x);
    }

    set(x, y) {
        this.x = x;
        this.y = y;
        return this;
    }

    add(vector) {
        this.x += vector.x;
        this.y += vector.y;
        return this;
    }

    subtract(vector) {
        this.x -= vector.x;
        this.y -= vector.y;
        return this;
    }

    subtractFrom(vector) {
        this.x = vector.x - this.x;
        this.y = vector.y - this.y;
        return this;
    }

    multiply(scalar) {
        this.x *= scalar;
        this.y *= scalar;
        return this;
    }

    divide(scalar) {
        this.x /= scalar;
        this.y /= scalar;
        return this;
    }

    rotate(angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const { x, y } = this;
        this.x = x * cos - y * sin;
        this.y = x * sin + y * cos;
        return this;
    }

    static add(v1, v2) {
        return new Vector(v1.x + v2.x, v1.y + v2.y);
    }

    static subtract(v1, v2) {
        return new Vector(v1.x - v2.x, v1.y - v2.y);
    }

    static multiply(v, scalar) {
        return new Vector(v.x * scalar, v.y * scalar);
    }

    static divide(v, scalar) {
        return new Vector(v.x / scalar, v.y / scalar);
    }

    static rotate(v, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return new Vector(
            v.x * cos - v.y * sin,
            v.x * sin + v.y * cos
        );
    }

    static dot(v1, v2) {
        return v1.x * v2.x + v1.y * v2.y;
    }

    static distance(v1, v2) {
        return Vector.subtract(v1, v2).length;
    }

    static distanceSquared(v1, v2) {
        return Vector.subtract(v1, v2).lengthSquared;
    }
}

export default Vector;