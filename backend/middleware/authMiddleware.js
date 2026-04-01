import { getSession } from '../services/sessionStore.js';

const SESSION_COOKIE_NAME = 'gitdash_session';

const parseCookies = (cookieHeader = '') => {
    return cookieHeader
        .split(';')
        .map((part) => part.trim())
        .filter(Boolean)
        .reduce((cookies, cookiePart) => {
            const [name, ...valueParts] = cookiePart.split('=');
            cookies[name] = decodeURIComponent(valueParts.join('='));
            return cookies;
        }, {});
};

export const attachAuthSession = (req, _res, next) => {
    const cookies = parseCookies(req.headers.cookie);
    const sessionId = cookies[SESSION_COOKIE_NAME];

    if (!sessionId) {
        req.auth = null;
        return next();
    }

    const session = getSession(sessionId);
    req.auth = session ? { sessionId, ...session } : null;
    return next();
};

export const getSessionCookieName = () => SESSION_COOKIE_NAME;
