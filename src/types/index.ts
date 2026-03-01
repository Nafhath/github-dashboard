export interface Repository {
    id: string;
    name: string;
    description: string;
    language: string;
    stars: number;
    forks: number;
    commits: number;
    isPrivate: boolean;
    updatedAt: string;
}

export interface Contributor {
    id: number;
    login: string;
    avatarUrl: string;
    contributions: number;
    htmlUrl: string;
}

export interface RepoDetails extends Repository {
    owner: string;
    htmlUrl: string;
    contributors: Contributor[];
    languages: Record<string, number>;
}

export interface Activity {
    id: string;
    type: 'commit' | 'branch' | 'issue' | 'pr';
    title: string;
    repo: string;
    author: string;
    timestamp: string;
    status?: string;
}

export interface Group {
    id: string;
    name: string;
    description?: string;
    repoIds: string[];
    totalCommits: number;
}
