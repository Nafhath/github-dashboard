import axios from 'axios';
import crypto from 'crypto';
import { createSession, deleteSession } from '../services/sessionStore.js';
import { getSessionCookieName } from '../middleware/authMiddleware.js';

const oauthStates = new Map();
const STATE_TTL = 1000 * 60 * 10;

const getFrontendUrl = () => process.env.FRONTEND_URL || 'http://localhost:5173';
const getBackendUrl = () => process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 5000}`;

const cleanupStates = () => {
    const now = Date.now();

    for (const [state, data] of oauthStates.entries()) {
        if (data.expiresAt <= now) {
            oauthStates.delete(state);
        }
    }
};

const buildExpiredCookie = () => {
    const isProduction = process.env.NODE_ENV === 'production';
    return [
        `${getSessionCookieName()}=`,
        'HttpOnly',
        'Path=/',
        'Max-Age=0',
        isProduction ? 'SameSite=None' : 'SameSite=Lax',
        isProduction ? 'Secure' : ''
    ].filter(Boolean).join('; ');
};

const buildSessionCookie = (sessionId) => {
    const isProduction = process.env.NODE_ENV === 'production';

    return [
        `${getSessionCookieName()}=${sessionId}`,
        'HttpOnly',
        'Path=/',
        `Max-Age=${60 * 60 * 24 * 7}`,
        isProduction ? 'SameSite=None' : 'SameSite=Lax',
        isProduction ? 'Secure' : ''
    ].filter(Boolean).join('; ');
};

export const startGithubAuth = async (_req, res, next) => {
    try {
        if (!process.env.GITHUB_CLIENT_ID || !process.env.GITHUB_CLIENT_SECRET) {
            return res.status(500).json({ message: 'GitHub OAuth is not configured on the backend.' });
        }

        cleanupStates();

        const state = crypto.randomBytes(16).toString('hex');
        oauthStates.set(state, {
            expiresAt: Date.now() + STATE_TTL,
        });

        const redirectUri = `${getBackendUrl()}/api/auth/github/callback`;
        const params = new URLSearchParams({
            client_id: process.env.GITHUB_CLIENT_ID,
            redirect_uri: redirectUri,
            scope: 'repo read:user user:email',
            state,
        });

        res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
    } catch (error) {
        next(error);
    }
};

export const finishGithubAuth = async (req, res, next) => {
    try {
        const { code, state } = req.query;
        const frontendUrl = getFrontendUrl();

        cleanupStates();
        const stateRecord = oauthStates.get(state);

        if (!code || !stateRecord) {
            return res.redirect(`${frontendUrl}/auth/callback?status=error`);
        }

        oauthStates.delete(state);

        const redirectUri = `${getBackendUrl()}/api/auth/github/callback`;
        const tokenRes = await axios.post(
            'https://github.com/login/oauth/access_token',
            {
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code,
                redirect_uri: redirectUri,
                state,
            },
            {
                headers: {
                    Accept: 'application/json',
                }
            }
        );

        if (!tokenRes.data?.access_token) {
            return res.redirect(`${frontendUrl}/auth/callback?status=error`);
        }

        const accessToken = tokenRes.data.access_token;
        const userRes = await axios.get('https://api.github.com/user', {
            headers: {
                Accept: 'application/vnd.github.v3+json',
                Authorization: `token ${accessToken}`,
            }
        });

        const user = userRes.data;
        const sessionId = createSession({
            accessToken,
            login: user.login,
            user: {
                id: user.id,
                login: user.login,
                name: user.name,
                avatarUrl: user.avatar_url,
                htmlUrl: user.html_url,
            }
        });

        res.setHeader('Set-Cookie', buildSessionCookie(sessionId));
        return res.redirect(`${frontendUrl}/auth/callback?status=success`);
    } catch (error) {
        console.error('GitHub OAuth callback failed:', error.message);
        return res.redirect(`${getFrontendUrl()}/auth/callback?status=error`);
    }
};

export const getAuthMe = async (req, res) => {
    if (!req.auth?.user) {
        return res.json({ authenticated: false, user: null });
    }

    return res.json({
        authenticated: true,
        user: req.auth.user,
    });
};

export const logout = async (req, res) => {
    if (req.auth?.sessionId) {
        deleteSession(req.auth.sessionId);
    }

    res.setHeader('Set-Cookie', buildExpiredCookie());
    return res.status(204).send();
};
