import Vector from './Vector.js';
import { setupGraphics, BORDER, WIDTH, HEIGHT, } from './graphics.js';

// Initialise canvas object
const canvas = {};

// Get the canvas element and its context
canvas._DOM = document.getElementById('canvas');
canvas._context = canvas._DOM.getContext('2d');

// Set the canvas width and height
canvas._DOM.width = canvas.width = WIDTH + 2 * BORDER;
canvas._DOM.height = canvas.height = HEIGHT + 2 * BORDER;

// Make the canvas more gamey
canvas._DOM.style.userSelect = 'none';
canvas._DOM.style.msUserSelect = 'none';
canvas._DOM.style.mozUserSelect = 'none';
canvas._DOM.ondragstart = function () { return false; };

// Initialise canvas mouse object
canvas.mouse = {
    position: new Vector(),
    down: false,
    inside: false
};

// Mouse move event
document.onmousemove = function (e) {
    // Get position of canvas on page
    let rect = canvas._DOM.getBoundingClientRect();
    // Get position of mouse relative to the canvas
    canvas.mouse.position.x = (e.pageX - rect.left - window.scrollX) * canvas.width / rect.width - BORDER;
    canvas.mouse.position.y = (e.pageY - rect.top - window.scrollY) * canvas.height / rect.height - BORDER;

    // Update mouse inside state
    canvas.mouse.inside = (e.target === canvas._DOM);
};

// Mouse down event
canvas._DOM.onmousedown = function (e) {
    e.preventDefault();
    canvas.mouse.down = true;
    canvas.mouse.inside = true;
};

// Mouse up event
canvas._DOM.onmouseup = () => canvas.mouse.down = false;

document.onmouseup = function () {
    if (canvas.mouse.down && !canvas.mouse.inside) canvas.mouse.down = false;
};

// mobile
canvas._DOM.ontouchstart = () => canvas.mouse.down = true;
canvas._DOM.ontouchend = () => canvas.mouse.down = false;

canvas._DOM.ontouchmove = function (e) {

    // Prevent accidental scrolling
    e.preventDefault();

    // Get position of canvas on page
    let rect = canvas._DOM.getBoundingClientRect();

    // Get touch position relative to the canvas
    canvas.mouse.position.x = (e.touches[0].pageX - rect.left - window.scrollX) * canvas.width / rect.width - BORDER;
    canvas.mouse.position.y = (e.touches[0].pageY - rect.top - window.scrollY) * canvas.height / rect.height - BORDER;
};

setupGraphics(canvas);

export default canvas;