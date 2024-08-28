import bcrypt from 'bcryptjs';
import User from '../db/Users.js';

const authentication = function (req, res, next) {
    req.login = (user_id) => req.session.user_id = user_id;
    req.logout = () => {
        delete req.session.user_id;
        delete req.session.authenticated;
        delete req.session.user;
    };

    if (req.session.user_id) {
        User.findUserById(req.session.user_id, (err, user) => {
            if (!err && user) {
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
            } else {
                req.authenticated = false;
                res.locals.authenticated = false;
                req.session.authenticated = false;
                delete req.session.user;
                next(err ? 'Database error.' : 'User not found.');
            }
        });
    } else {
        req.authenticated = false;
        res.locals.authenticated = false;
        req.session.authenticated = false;
        delete req.session.user;
        next();
    }
};

authentication.comparePassword = function (password, hash, callback) {
    bcrypt.compare(password, hash, (err, res) => {
        if (err) {
            callback(false);
        } else {
            callback(res);
        }
    });
};

export default authentication;