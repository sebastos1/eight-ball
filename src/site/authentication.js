import bcrypt from 'bcryptjs';
import Users from '../db/Users.js';

const authentication = async function (req, res, next) {
    req.login = (user_id) => req.session.user_id = user_id;
    req.logout = () => {
        console.log('Logging out user:', req.session.user_id);
        delete req.session.user_id;
        delete req.session.authenticated;
        delete req.session.user;
    };

    if (!req.session.user_id) {
        clearAuthData(req, res);
        return next();
    }

    try {
        const user = await Users.findUserById(req.session.user_id);

        // gg if you get here lol
        if (!user) {
            clearAuthData(req, res);
            return next('User not found.');
        }

        if (!user.is_active) {
            clearAuthData(req, res);
            return next();
        }

        req.user_id = req.session.user_id;
        req.authenticated = true;
        req.user = user;
        req.country = user.country;
        res.locals.user_id = req.session.user_id;
        res.locals.authenticated = true;
        res.locals.user = user;
        req.session.authenticated = true;
        req.session.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        clearAuthData(req, res);
        next('Database error.');
    }
};

function clearAuthData(req, res) {
    req.authenticated = false;
    res.locals.authenticated = false;
    req.session.authenticated = false;
    delete req.session.user;
}

authentication.comparePassword = function (password, hash) {
    return new Promise((resolve, reject) => {
        bcrypt.compare(password, hash, (err, result) => {
            if (err) {
                reject(err);
            } else {
                resolve(result);
            }
        });
    });
};

export default authentication;