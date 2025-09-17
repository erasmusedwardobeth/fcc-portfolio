
const fs = require("fs");
const fetch = require("node-fetch");

const username = "erasmusedwardobeth"; // <-- Your GitHub username
const sortBy = "updated"; // change to "created" or "updated"

// Capitalize first letter of each word
function capitalizeWords(str) {
  return str.replace(/\b\w/g, char => char.toUpperCase());
}

async function getRepos() {
  const res = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=${sortBy}`);
  const repos = await res.json();

  // Filter only FCC repos
  const fccRepos = repos.filter(r => r.name.startsWith("fcc-"));

  // Skip empty repos (0 commits)
  const checkedRepos = [];
  for (let repo of fccRepos) {
    const commitsRes = await fetch(repo.commits_url.replace("{/sha}", ""));
    const commits = await commitsRes.json();
    if (Array.isArray(commits) && commits.length > 0) {
      checkedRepos.push(repo);
    }
  }

  return checkedRepos;
}

function buildTable(repos) {
  let table = "| Project | Live Demo | Code | Badges | Description |\n";
  table += "|---------|-----------|------|--------|-------------|\n";

  repos.forEach(repo => {
    const rawName = repo.name.replace("fcc-", "").replace(/-/g, " ");
    const name = capitalizeWords(rawName);

    const demo = `https://${username}.github.io/${repo.name}`;
    const code = repo.html_url;

    // Badges for repo
    const badges = `
![Size](https://img.shields.io/github/repo-size/${username}/${repo.name}?label=size)
![Stars](https://img.shields.io/github/stars/${username}/${repo.name}?style=social)
![Last Commit](https://img.shields.io/github/last-commit/${username}/${repo.name})
    `.trim();

    const desc = repo.description || "FreeCodeCamp project";

    table += `| ${name} | [Demo](${demo}) | [Repo](${code}) | ${badges} | ${desc} |\n`;
  });

  return table;
}

async function updateReadme() {
  const readme = fs.readFileSync("README.md", "utf8");
  const repos = await getRepos();
  const table = buildTable(repos);

  const newReadme = readme.replace(
    /<!-- PROJECTS_TABLE_START -->([\s\S]*?)<!-- PROJECTS_TABLE_END -->/,
    `<!-- PROJECTS_TABLE_START -->\n${table}\n<!-- PROJECTS_TABLE_END -->`
  );

  fs.writeFileSync("README.md", newReadme);
}

updateReadme();
