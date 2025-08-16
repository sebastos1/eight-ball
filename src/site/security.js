import csrf from 'csrf';
import helmet from 'helmet';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

const oauthServer = process.env.OAUTH2_AUTH_SERVER || 'http://localhost:3001';

// csrf
const Tokens = csrf;
const tokens = new Tokens();

const csrfSecret = crypto.randomBytes(32).toString('hex');

// rate limiting
const blockedIPs = new Set();

export function applySecurityConfig(app) {
    // applyHelmet(app);
    applySession(app);
    applyRateLimiting(app);
}

const applyRateLimiting = (app) => {
    app.use(rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 1000,
        standardHeaders: 'draft-7',
        legacyHeaders: false,
        handler: (req, res, _options) => {
            blockedIPs.add(req.ip);
            res.status(429).send("Slow down buddy");
        },
    }));

    app.use((req, res, next) => {
        if (blockedIPs.has(req.ip)) {
            res.status(429).send("Slow down buddy");
        }
        next();
    });
}

const applySession = (app) => {
    app.use(cookieParser());
    app.use((req, res, next) => {
        if (!req.csrfToken) {
            res.cookie('XSRF-TOKEN', tokens.create(csrfSecret), {
                httpOnly: false,
                secure: 'auto',
            });
        }
        res.locals.csrfToken = tokens.create(csrfSecret);
        next();
    });
}

// secure headers
// const applyHelmet = (app) => {
//     app.use(helmet({
//         contentSecurityPolicy: {
//             directives: {
//                 defaultSrc: ["'self'"],
//                 scriptSrc: [
//                     "'self'",
//                     "'unsafe-inline'",
//                     "https://code.jquery.com",
//                     "https://stackpath.bootstrapcdn.com",
//                     "https://cdn.jsdelivr.net",
//                     "https://cdn.socket.io",
//                     oauthServer,
//                 ],
//                 styleSrc: [
//                     "'self'",
//                     "'unsafe-inline'",
//                     "https://stackpath.bootstrapcdn.com",
//                     "https://fonts.googleapis.com",
//                     "https://cdn.jsdelivr.net",
//                 ],
//                 imgSrc: ["'self'", "data:", "https:"],
//                 fontSrc: [
//                     "'self'",
//                     "https://fonts.gstatic.com",
//                 ],
//                 connectSrc: ["'self'", "wss:", "ws:", "http:", "https:"],
//                 workerSrc: ["'self'", "blob:"],
//             },
//         },
//     }));
// }



export const csrfValidation = (req, res, next) => {
    const token = req.body._csrf;

    if (!token || !tokens.verify(csrfSecret, token)) {
        return res.status(403).send('Forbidden');
    }

    next();
};