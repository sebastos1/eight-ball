// copied these bad boys from the local hbs helpers lol
const user_colors = [
    ["Red", "#FF0000"],
    ["Blue", "#0000FF"],
    ["Green", "#00FF00"],
    ["FireBrick", "#B22222"],
    ["Coral", "#FF7F50"],
    ["YellowGreen", "#9ACD32"],
    ["OrangeRed", "#FF4500"],
    ["SeaGreen", "#2E8B57"],
    ["GoldenRod", "#DAA520"],
    ["Chocolate", "#D2691E"],
    ["CadetBlue", "#5F9EA0"],
    ["DodgerBlue", "#1E90FF"],
    ["HotPink", "#FF69B4"],
    ["BlueViolet", "#8A2BE2"],
    ["SpringGreen", "#00FF7F"],
]

export function userColor(username) {
    let n = (username.charCodeAt(0) + username.charCodeAt(username.length - 1)) % user_colors.length;
    return user_colors[n][1];
}

export function getUserFlag(country) {
    if (!country) return;

    const codePoints = country.split('').map(char =>
        (char.codePointAt(0) + 127397).toString(16)).join('-');

    const flagUrl = `https://cdnjs.cloudflare.com/ajax/libs/twemoji/14.0.2/svg/${codePoints}.svg`;

    return `<img src="${flagUrl}" alt="${country}" class="twemoji-flag">`;
}