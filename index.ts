import { Octokit } from "@octokit/core";
import { Endpoints } from "@octokit/types";
import { promises as fs } from 'fs';
require('dotenv').config()

const octokit = new Octokit({ auth: process.env.GITHUB_AUTH_TOKEN });

type listUserReposParameters = Endpoints["GET /repos/:owner/:repo/releases"]["parameters"];
type listUserReposResponse = Endpoints["GET /repos/:owner/:repo/releases"]["response"];
type createFileParam = {
    name: string;
    content: string
}

async function listReleases(params: listUserReposParameters): Promise<listUserReposResponse> {
    const { owner, repo } = params;
    return await octokit.request(`GET /repos/${owner}/${repo}/releases`, {
        per_page: 100,
        page: 2
    });
}

function formatReleaseToMd(releases: listUserReposResponse["data"]): string {
    const regExp = new RegExp(process.argv[3], 'i');

    return releases
        .filter(r => r.body.match(regExp))
        .map(r => `## ${r.name}\n${r.body}`)
        .join('\n')
}

async function createFile(params: createFileParam): Promise<void> {
    await fs.writeFile(params.name, params.content)
}

async function main(): Promise<void> {
    const targetRepo = process.argv[2];
    const [owner, repo] = targetRepo.split('/');

    const { data } = await listReleases({ owner, repo });
    const mdContent = formatReleaseToMd(data);
    createFile({ name: `dist/${repo}.md`, content: mdContent })
}

main()
