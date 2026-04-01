import axios from 'axios';
import type { Repository, Group, AuthUser } from '../types';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://github-dashboard-ugo8.onrender.com/api';
const apiClient = axios.create({
    withCredentials: true,
});

export const api = {
    pingBackend: async () => {
        const res = await apiClient.get(`${API_BASE_URL}/health`, {
            timeout: 10000,
        });
        return res.data;
    },

    getGithubLoginUrl: () => `${API_BASE_URL}/auth/github`,

    getAuthMe: async (): Promise<{ authenticated: boolean; user: AuthUser | null }> => {
        const res = await apiClient.get(`${API_BASE_URL}/auth/me`);
        return res.data;
    },

    logout: async () => {
        await apiClient.post(`${API_BASE_URL}/auth/logout`);
    },

    getDashboardStats: async () => {
        const res = await apiClient.get(`${API_BASE_URL}/dashboard`);
        return res.data;
    },

    getRepositories: async (): Promise<Repository[]> => {
        const res = await apiClient.get(`${API_BASE_URL}/repos`);
        return res.data;
    },

    getRepoDetails: async (owner: string, repo: string) => {
        const res = await apiClient.get(`${API_BASE_URL}/repos/${owner}/${repo}`);
        return res.data;
    },

    getRepoCommits: async (owner: string, repo: string) => {
        const res = await apiClient.get(`${API_BASE_URL}/repos/${owner}/${repo}/commits`);
        return res.data;
    },

    getGroups: async (): Promise<Group[]> => {
        const res = await apiClient.get(`${API_BASE_URL}/groups`);
        return res.data;
    },

    createGroup: async (name: string, description: string, repos: string[]) => {
        const res = await apiClient.post(`${API_BASE_URL}/groups`, { name, description, repos });
        return res.data;
    },

    updateGroup: async (id: string, payload: { name?: string; description?: string; repos?: string[] }) => {
        const res = await apiClient.put(`${API_BASE_URL}/groups/${id}`, payload);
        return res.data;
    },

    deleteGroup: async (id: string) => {
        await apiClient.delete(`${API_BASE_URL}/groups/${id}`);
    },

    getAnalytics: async () => {
        const res = await apiClient.get(`${API_BASE_URL}/analytics`);
        return res.data;
    }
};
