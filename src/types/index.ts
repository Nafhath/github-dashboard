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
