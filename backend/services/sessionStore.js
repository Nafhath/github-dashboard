import crypto from 'crypto';

const sessions = new Map();
const SESSION_TTL = 1000 * 60 * 60 * 24 * 7;

const cleanupExpiredSessions = () => {
    const now = Date.now();

    for (const [sessionId, session] of sessions.entries()) {
        if (session.expiresAt <= now) {
            sessions.delete(sessionId);
        }
    }
};

export const createSession = (payload) => {
    cleanupExpiredSessions();

    const sessionId = crypto.randomBytes(24).toString('hex');
    sessions.set(sessionId, {
        ...payload,
        createdAt: Date.now(),
        expiresAt: Date.now() + SESSION_TTL,
    });

    return sessionId;
};

export const getSession = (sessionId) => {
    cleanupExpiredSessions();

    const session = sessions.get(sessionId);

    if (!session) {
        return null;
    }

    if (session.expiresAt <= Date.now()) {
        sessions.delete(sessionId);
        return null;
    }

    return session;
};

export const deleteSession = (sessionId) => {
    sessions.delete(sessionId);
};
