import axios from 'axios';
import type { Repository, Group } from '../types';

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://github-dashboard-ugo8.onrender.com/api';

export const api = {
    pingBackend: async () => {
        const res = await axios.get(`${API_BASE_URL}/health`, {
            timeout: 10000,
        });
        return res.data;
    },

    getDashboardStats: async () => {
        const res = await axios.get(`${API_BASE_URL}/dashboard`);
        return res.data;
    },

    getRepositories: async (): Promise<Repository[]> => {
        const res = await axios.get(`${API_BASE_URL}/repos`);
        return res.data;
    },

    getRepoDetails: async (owner: string, repo: string) => {
        const res = await axios.get(`${API_BASE_URL}/repos/${owner}/${repo}`);
        return res.data;
    },

    getRepoCommits: async (owner: string, repo: string) => {
        const res = await axios.get(`${API_BASE_URL}/repos/${owner}/${repo}/commits`);
        return res.data;
    },

    getGroups: async (): Promise<Group[]> => {
        const res = await axios.get(`${API_BASE_URL}/groups`);
        return res.data;
    },

    createGroup: async (name: string, description: string, repos: string[]) => {
        const res = await axios.post(`${API_BASE_URL}/groups`, { name, description, repos });
        return res.data;
    },

    getAnalytics: async () => {
        const res = await axios.get(`${API_BASE_URL}/analytics`);
        return res.data;
    }
};
