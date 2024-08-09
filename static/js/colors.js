/*
colors:
id-rainbow
id-green (green to blue to green)
id-death (flashing red,white,black)
*/

(function (global) {
    const userColors = new Map([
        [1, "id-rainbow"],
        [2, "id-green"],
        [6, "id-death"]
    ]);

    const Colors = {
        colorPicker: function (id) {
            return userColors.get(Number(id)) || "";
        }
    };

    // needs to be avaliable in node and client
    if (typeof window !== 'undefined') {
        window.Colors = Colors;
    } else if (typeof module !== 'undefined' && module.exports) {
        module.exports = Colors;
    }
})(typeof self !== 'undefined' ? self : this);