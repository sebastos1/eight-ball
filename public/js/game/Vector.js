class Vector {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
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

    length() {
        return Math.hypot(this.x, this.y);
    }

    static dot(v1, v2) {
        return v1.x * v2.x + v1.y * v2.y;
    }
}

export default Vector;