import OAuth2Server from "sjallabong-auth";
import Users from "../db/Users.js";


export let oauth;

export function initOAuth(sessionStore) {
    oauth = new OAuth2Server({
        clientId: "sjallabong-pool",
        authServer: "http://localhost:3001",
        redirectUri: "http://localhost:8080/auth/callback",
        debug: true,
        scope: "openid profile pool"
    }, sessionStore);

    return oauth;
}

// sjallabong-auth uses web api so convert
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

const authentication = async function (req, res, next) {
    try {
        const response = await oauth.checkSession(expressToWebRequest(req));
        const sessionData = await response.json();

        if (sessionData.authenticated && sessionData.userInfo) {
            const oauthId = sessionData.userInfo.sub;

            let localUser = await Users.findByOauthId(oauthId);

            // create new user if there is none
            if (!localUser) {
                const oauthData = {
                    id: oauthId,
                    username: sessionData.userInfo.username || sessionData.userInfo.name,
                    country: sessionData.userInfo.country || null
                };
                localUser = await Users.createFromOAuth(oauthData);
            }

            if (localUser && localUser.is_active) {
                // pool data
                req.authenticated = true;
                req.user = localUser;
                req.country = localUser.country;
                req.session.user = localUser;
                req.session.authenticated = true; 

                res.locals.loggedIn = true;
                res.locals.authenticated = true;
                res.locals.user = localUser;
                res.locals.user.id = localUser.id;
            } else {
                req.authenticated = false;
                res.locals.loggedIn = false;
                res.locals.authenticated = false;
            }
        } else {
            req.authenticated = false;
            res.locals.loggedIn = false;
            res.locals.authenticated = false;
        }

        next();
    } catch (error) {
        console.error("Authentication middleware error:", error);
        req.authenticated = false;
        res.locals.loggedIn = false;
        res.locals.authenticated = false;
        next();
    }
};

export default authentication;