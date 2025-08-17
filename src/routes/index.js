import express from "express";
import Users from "../db/Users.js";
import Games from "../db/Games.js";
import { getLocationFromIp } from "../site/helpers.js";

const router = express.Router();

// GET "/" route
router.get("/", async (req, res) => {
    const loggedIn = req.authenticated;
    if (!loggedIn) return res.render("dashboard", { loggedIn });

    try {
        const game = await Games.getLatestByUserId(req.user_id);
        return res.render("dashboard", { game, loggedIn });
    } catch (error) {
        console.error("Error fetching latest game:", error);
        return res.status(500).render("error", { message: "Database error" });
    }
});

// GET "/play" route
router.get("/play", async (req, res) => {
    const isGuest = !req.authenticated;

    if (isGuest && !req.session.guestId) {
        req.session.guestId = "Guest_" + Math.random().toString(36).substring(2, 8);
        const ip = req.headers["x-real-ip"] || req.headers["x-forwarded-for"];
        req.session.guestCountry = await getLocationFromIp(ip);
    }

    return res.render("play", {
        isGuest: isGuest,
        title: "Play",
        user: req.user || {
            username: req.session.guestId || "Guest",
            country: req.session.guestCountry,
            isGuest: true
        }
    });
});

// GET "/profile" route
router.get("/profile", async (req, res) => {
    if (!req.query.username) {
        if (!req.authenticated) {
            req.flash("danger", "You are not logged in.");
            return res.redirect("/");
        }
        return res.redirect(`/profile/${req.user_id}`);
    }

    try {
        const id = await Users.queryIdByUsername(req.query.username);
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
        const profile = await Users.findUserById(req.params.id);
        if (!profile) return res.status(404).render("error", { message: "User not found" });

        const selfProfile = req.params.id == req.user_id;
        const gamesPlayed = profile.wins + profile.losses;
        const winRate = gamesPlayed ? Math.round(profile.wins * 100 / gamesPlayed) + "%" : "-";

        const games = await Games.getGamesByUserId(profile.id);
        return res.render("profile", { profile, games, selfProfile, gamesPlayed, winRate, title: profile.username });
    } catch (error) {
        console.error("Error fetching profile:", error);
        return res.status(500).render("error", { message: "Database error" });
    }
});

// GET "/leaderboard" route
router.get("/leaderboard", async (req, res) => {
    try {
        const users = await Users.getLeaderboard();
        if (!users) {
            return res.status(500).render("error", { message: "Database error" });
        }

        users.forEach((user, index) => {
            user.position = index + 1;
            user.self = user.id == req.user_id;
            user.gamesPlayed = user.wins + user.losses;
            user.winRate = user.gamesPlayed ? Math.round(user.wins * 100 / user.gamesPlayed) + "%" : "-";
        });

        return res.render("leaderboard", { users, title: "Leaderboard" });
    } catch (error) {
        console.error("Error fetching leaderboard:", error);
        return res.status(500).render("error", { message: "Database error" });
    }
});

router.get("/leaderboard/legend", (_req, res) => {
    const ranks = [
        { name: "Wood", minRating: 0, maxRating: 99, cssClass: "wood-text", color: "#8B4513", shortName: "WD", description: "Starting rank for new players" },
        { name: "Copper", minRating: 100, maxRating: 199, cssClass: "copper-text", color: "#B87333", shortName: "CP", description: "Learning the basics" },
        { name: "Bronze", minRating: 200, maxRating: 299, cssClass: "bronze-text", color: "#CD7F32", shortName: "BR", description: "Solid fundamentals" },
        { name: "Silver", minRating: 300, maxRating: 399, cssClass: "silver-text", color: "#C0C0C0", shortName: "SV", description: "Consistent player" },
        { name: "Gold", minRating: 400, maxRating: 499, cssClass: "gold-text", color: "#FFD700", shortName: "GD", description: "Above average skill" },
        { name: "Platinum", minRating: 500, maxRating: 599, cssClass: "plat-text", color: "#E5E4E2", shortName: "PT", description: "High-level gameplay" },
        { name: "Diamond", minRating: 600, maxRating: 699, cssClass: "dia-text", color: "#0070FF", shortName: "DM", description: "Expert-level player" },
        { name: "Master", minRating: 700, maxRating: 799, cssClass: "master-text", color: "#FF4500", shortName: "MS", description: "Elite competition" },
        { name: "Grandmaster", minRating: 800, maxRating: 899, cssClass: "gm-text", color: "#8A2BE2", shortName: "GM", description: "Exceptional mastery" },
        { name: "Champion", minRating: 900, maxRating: null, cssClass: "champ-text", color: "#FF4500", shortName: "CH", description: "The absolute best" }
    ];

    return res.render("legend", { ranks, title: "Rank Legend"});
});

router.get("/about", (_req, res) => {
    return res.render("about");
});

export default router;