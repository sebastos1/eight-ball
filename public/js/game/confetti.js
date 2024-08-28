var count = 100;
var defaults = {
    origin: { y: 1.2 },
    gravity: 0.3,
    ticks: 500,
    decay: 0.97,
    scalar: 2,
};

function fire(particleRatio, opts) {
    confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
    });
}

export function launchConfetti() {
    fire(0.25, {
        spread: 26,
        startVelocity: 35,
    });
    fire(0.2, {
        spread: 60,
    });
    fire(0.35, {
        spread: 100,
        scalar: 2.5,
    });
    fire(0.1, {
        spread: 120,
        startVelocity: 25,
        scalar: 3,
    });
    fire(0.1, {
        spread: 120,
        startVelocity: 45,
    });
}
