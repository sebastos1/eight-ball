import express from "express";
import { users } from "../db/users.js";
import { games } from "../db/games.js";
import { getLocationFromIp } from "../site/helpers.js";

const router = express.Router();

// GET "/" route
router.get("/", async (req, res) => {
    const loggedIn = req.session.authenticated;
    if (!loggedIn) return res.render("dashboard", { loggedIn });

    try {
        const game = await games.getLatestByUserId(req.session.user.id);
        return res.render("dashboard", { game, loggedIn });
    } catch (error) {
        console.error("Error fetching latest game:", error);
        return res.status(500).render("error", { message: "Database error" });
    }
});

// GET "/play" route
router.get("/play", async (req, res) => {
    const isGuest = !req.session.authenticated;

    if (isGuest && !req.session.guestId) {
        req.session.guestId = "Guest_" + Math.random().toString(36).substring(2, 8);
        const ip = req.headers["x-real-ip"] || req.headers["x-forwarded-for"];
        req.session.guestCountry = await getLocationFromIp(ip);
    }

    return res.render("play", {
        isGuest: isGuest,
        title: "Play",
        user: req.session.user || {
            username: req.session.guestId || "Guest",
            country: req.session.guestCountry,
            isGuest: true
        }
    });
});

// GET "/profile" route
router.get("/profile", async (req, res) => {
    if (!req.query.username) {
        if (!req.session.authenticated) {
            req.flash("danger", "You are not logged in.");
            return res.redirect("/");
        }
        return res.redirect(`/profile/${req.session.user.id}`);
    }

    try {
        const id = await users.queryIdByUsername(req.query.username);
        if (!id) {
            return res.status(404).render("error", { message: "User not found" });
        }
        return res.redirect(`/profile/${id}`);
    } catch (error) {
        console.error("Error querying user:", error);
        return res.status(500).render("error", { message: "Database error" });
    }
});

// GET "/profile/:id" route
router.get("/profile/:id", async (req, res) => {
    try {
        const profile = await users.findUserById(req.params.id);
        if (!profile) return res.status(404).render("error", { message: "User not found" });

        const selfProfile = req.session.user?.id == req.params.id;
        const gamesPlayed = profile.wins + profile.losses;
        const winRate = gamesPlayed ? Math.round(profile.wins * 100 / gamesPlayed) + "%" : "-";

        const userGames = await games.getGamesByUserId(profile.id);
        const ratingHistory = await users.getRatingHistory(profile.id);

        return res.render("profile", { profile, games: userGames, selfProfile, gamesPlayed, winRate, title: profile.username, ratingHistory });
    } catch (error) {
        console.error("Error fetching profile:", error);
        return res.status(500).render("error", { message: "Database error" });
    }
});

// GET "/leaderboard" route
router.get("/leaderboard", async (req, res) => {
    try {
        const userList = await users.getLeaderboard();
        if (!userList) {
            return res.status(500).render("error", { message: "Database error" });
        }

        userList.forEach((user, index) => {
            user.position = index + 1;
            user.self = req.session.user?.id == user.id;
            user.gamesPlayed = user.wins + user.losses;
            user.winRate = user.gamesPlayed ? Math.round(user.wins * 100 / user.gamesPlayed) + "%" : "-";
        });

        return res.render("leaderboard", { users: userList, title: "Leaderboard" });
    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        return res.status(500).render("error", { message: "Database error" });
    }
});

router.get("/leaderboard/legend", (_req, res) => {
    const ranks = [
        { name: "Wood", minRating: 0, maxRating: 99, cssClass: "wood-text", imgPath: "wood.svg" },
        { name: "Copper", minRating: 100, maxRating: 199, cssClass: "copper-text", imgPath: "copper.svg" },
        { name: "Bronze", minRating: 200, maxRating: 299, cssClass: "bronze-text", imgPath: "bronze.svg" },
        { name: "Silver", minRating: 300, maxRating: 399, cssClass: "silver-text", imgPath: "silver.svg" },
        { name: "Gold", minRating: 400, maxRating: 499, cssClass: "gold-text", imgPath: "gold.svg" },
        { name: "Platinum", minRating: 500, maxRating: 599, cssClass: "plat-text", imgPath: "plat.svg" },
        { name: "Diamond", minRating: 600, maxRating: 699, cssClass: "dia-text", imgPath: "diamond.svg" },
        { name: "Master", minRating: 700, maxRating: 799, cssClass: "master-text", imgPath: "master.svg" },
        { name: "Grandmaster", minRating: 800, maxRating: 899, cssClass: "gm-text", imgPath: "gm.svg" },
        { name: "Champion", minRating: 900, maxRating: null, cssClass: "champ-text", imgPath: "champ.svg" }
    ];

    return res.render("legend", { ranks, title: "Rank Legend"});
});

router.get("/about", (_req, res) => {
    return res.render("about");
});

export default router;