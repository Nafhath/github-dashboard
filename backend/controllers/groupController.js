import Group from '../models/Group.js';
import { buildGithubContext, fetchCommitCount, fetchRepositories } from '../services/githubService.js';

export const getGroups = async (req, res, next) => {
    try {
        const context = buildGithubContext(req);
        const groups = await Group.find().sort({ createdAt: -1 });
        const repos = await fetchRepositories(context);
        const repoById = new Map();
        const repoByFullName = new Map();
        const reposByName = new Map();

        repos.forEach((repo) => {
            repoById.set(repo.id, repo);
            repoByFullName.set(`${repo.owner}/${repo.name}`, repo);

            const existingRepos = reposByName.get(repo.name) || [];
            existingRepos.push(repo);
            reposByName.set(repo.name, existingRepos);
        });

        // Enrich groups with total commits
        const enrichedGroups = await Promise.all(
            groups.map(async (group) => {
                let totalCommits = 0;

                // Sum commits for all repos in this group
                if (group.repos && group.repos.length > 0) {
                    const commitPromises = group.repos.map((repoRef) => {
                        const matchedRepo = repoById.get(repoRef)
                            || repoByFullName.get(repoRef)
                            || (() => {
                                const matchingRepos = reposByName.get(repoRef) || [];
                                return matchingRepos.length === 1 ? matchingRepos[0] : null;
                            })();

                        if (!matchedRepo) {
                            return 0;
                        }

                        return fetchCommitCount(matchedRepo.owner, matchedRepo.name, null, context);
                    });
                    const commitCounts = await Promise.all(commitPromises);
                    totalCommits = commitCounts.reduce((sum, count) => sum + count, 0);
                }

                return {
                    id: group._id, // Map _id to id for frontend compatibility
                    name: group.name,
                    description: group.description,
                    repoIds: group.repos, // We store repo names or IDs here
                    totalCommits
                };
            })
        );

        res.json(enrichedGroups);
    } catch (error) {
        next(error);
    }
};

export const createGroup = async (req, res, next) => {
    try {
        const { name, description, repos } = req.body;

        if (!name) {
            return res.status(400).json({ message: 'Group name is required' });
        }

        const newGroup = new Group({
            name,
            description: description || '',
            repos: repos || []
        });

        const savedGroup = await newGroup.save();

        // Return frontend compatible shape
        res.status(201).json({
            id: savedGroup._id,
            name: savedGroup.name,
            description: savedGroup.description,
            repoIds: savedGroup.repos,
            totalCommits: 0
        });
    } catch (error) {
        next(error);
    }
};

export const updateGroup = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name, description, repos } = req.body;

        const group = await Group.findById(id);

        if (!group) {
            return res.status(404).json({ message: 'Group not found' });
        }

        if (typeof name === 'string') {
            group.name = name.trim() || group.name;
        }

        if (typeof description === 'string') {
            group.description = description;
        }

        if (Array.isArray(repos)) {
            group.repos = [...new Set(repos.filter(Boolean))];
        }

        const savedGroup = await group.save();

        res.json({
            id: savedGroup._id,
            name: savedGroup.name,
            description: savedGroup.description,
            repoIds: savedGroup.repos,
            totalCommits: 0
        });
    } catch (error) {
        next(error);
    }
};

export const deleteGroup = async (req, res, next) => {
    try {
        const { id } = req.params;
        const deletedGroup = await Group.findByIdAndDelete(id);

        if (!deletedGroup) {
            return res.status(404).json({ message: 'Group not found' });
        }

        res.status(204).send();
    } catch (error) {
        next(error);
    }
};
