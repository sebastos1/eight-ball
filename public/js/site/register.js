document.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('form');
    const emailInput = document.getElementById('email');

    form.addEventListener('submit', function (event) {
        if (emailInput.value.trim() === '') {
            emailInput.value = '';  // Clear any whitespace
            emailInput.removeAttribute('required');  // Remove required attribute
        } else {
            emailInput.setAttribute('required', '');  // Add required attribute if email is not empty
        }
    });
});

// this is vile, repulsive, repugnant, disgusting, abhorrent, despicable, and slighty blue