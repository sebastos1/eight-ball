import OAuth2Server from "authabong";
import { users } from "../db/users.js";
import { appBaseUrl, oauthServer } from "../../index.js";
import session from "express-session";

export let oauth;

export async function initOAuth(sessionStore) {
    oauth = await new OAuth2Server({
        clientId: "sjallabong-pool",
        discoveryUrl: `${oauthServer}/.well-known/openid-configuration`,
        redirectUri: `${appBaseUrl}/auth/callback`,
        debug: true,
        scope: "openid profile pool"
    }, sessionStore).init();

    return oauth;
}

// authabong uses web api so convert
export function expressToWebRequest(req) {
    const headers = new Headers();
    Object.entries(req.headers).forEach(([key, value]) => {
        if (Array.isArray(value)) {
            value = value.join(', ');
        }
        headers.set(key, String(value));
    });

    const protocol = req.protocol || 'http';
    const host = req.get('host') || 'localhost:8080';
    const fullUrl = `${protocol}://${host}${req.originalUrl}`;

    return {
        url: fullUrl,
        method: req.method,
        headers,
        body: req.body ? JSON.stringify(req.body) : null
    };
}

export const authentication = async function (req, res, next) {
    try {
        const response = await oauth.checkSession(expressToWebRequest(req));
        const sessionData = await response.json();

        console.log(sessionData);

        if (sessionData.authenticated && sessionData.userInfo) {
            const oauthId = sessionData.userInfo.sub;

            let localUser = await users.findByOauthId(oauthId);

            // create new user if there is none
            if (!localUser) {
                const oauthData = {
                    id: oauthId,
                    username: sessionData.userInfo.username || sessionData.userInfo.name,
                    country: sessionData.userInfo.country || null
                };
                localUser = await users.createFromOAuth(oauthData);
            }

            if (localUser && localUser.is_active) {
                if (sessionData.userInfo.country && sessionData.userInfo.country !== localUser.country) {
                    await users.updateCountry(localUser.id, sessionData.userInfo.country);
                    localUser.country = sessionData.userInfo.country;
                }

                // pool data
                req.session.user = localUser;
                req.session.authenticated = true;

                res.locals.loggedIn = true;
                res.locals.user = localUser;
                res.locals.user.id = localUser.id;
            } else {
                req.session.authenticated = false;
                req.session.user = null;
                res.locals.loggedIn = false;
            }
        } else {
            req.session.authenticated = false;
            req.session.user = null;
            res.locals.loggedIn = false;
        }

        next();
    } catch (error) {
        console.error("Authentication middleware error:", error);
        req.session.authenticated = false;
        res.locals.loggedIn = false;
        next();
    }
};