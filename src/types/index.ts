export interface Repository {
    id: string;
    name: string;
    owner: string;
    ownerAvatarUrl: string;
    creatorLogin: string | null;
    creatorAvatarUrl: string | null;
    description: string;
    language: string;
    stars: number;
    forks: number;
    commits: number;
    userCommits: number;
    isPrivate: boolean;
    isOwnedByUser: boolean;
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

export interface AuthUser {
    id: number;
    login: string;
    name: string | null;
    avatarUrl: string;
    htmlUrl: string;
}
