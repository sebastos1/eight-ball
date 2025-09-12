// Dependencies
import express from "express";
import chalk from "chalk";

// imports
import { oauth, expressToWebRequest } from "../site/authentication.js";

// Initialise route handler
const router = express.Router();

// Log function
const log = (string) => console.log(`${chalk.bold.underline.cyan("USER")} ${chalk.yellow("»")} ${chalk.green(string)}`);

/*
    OAUTH INTEGRATION
*/
router.get("/auth/login", async (req, res) => {
    const response = await oauth.login(expressToWebRequest(req));

    res.status(response.status);
    response.headers.forEach((value, key) => {
        res.setHeader(key, value);
    });

    return res.end();
});

router.get("/auth/callback", async (req, res) => {
    const response = await oauth.callback(expressToWebRequest(req));
    res.status(response.status);
    response.headers.forEach((value, key) => {
        res.setHeader(key, value);
    });
    if (response.body) {
        const text = await response.text();
        return res.send(text);
    }
    return res.end();
});

router.get("/auth/check-session", async (req, res) => {
    const response = await oauth.checkSession(expressToWebRequest(req));
    const data = await response.json();
    res.json(data);
});

// GET "/logout" route
router.post("/auth/logout", async (req, res) => {
    const webRequest = expressToWebRequest(req);
    webRequest.headers.set("X-CSRF-Token", "1");

    const response = await oauth.logout(webRequest);
    res.status(response.status);
    response.headers.forEach((value, key) => {
        res.setHeader(key, value);
    });
    return res.end();
});

export default router;