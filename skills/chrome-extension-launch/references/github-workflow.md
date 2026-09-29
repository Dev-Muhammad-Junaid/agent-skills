# GitHub workflow

Account: `Dev-Muhammad-Junaid` (the `gh` CLI is authenticated). Commit messages end with the session's attribution line.

## New extension repo

```bash
git init -b main
printf '.DS_Store\nnode_modules/\n*.zip\ndist/\nstore/video/out/*.wav\n' > .gitignore
git add -A && git commit -m "<Name> <version>: <one-line purpose>"
gh repo create Dev-Muhammad-Junaid/<name> --private --description "<one-line promise>" --source . --remote origin --push
git tag v<version> && git push origin v<version>
```

- **Private by default.** Making it public is the user's call; ask.
- If the scratch workspace sits inside another git repo (the user's home folder is one), `git init` inside the project folder so it becomes its own repo.

## Branches and PRs

- After the first push, work on branches (`launch`, `social-cuts`, `fix-<thing>`) and open a PR with sections: **What's in it**, **Policy check** (for listing or permission changes), **Tests** (e2e and nesting results), ending with the PR attribution line.
- Bind the PR in the app (`ccd_pr get_status` / `bind_pr`). Don't poll CI; the extension repos have none by default.
- Merge only when the user says so ("push everything" has meant: make sure it's all pushed, then merge the PR into main). Use `gh pr merge <n> --merge`, then `git checkout main && git pull --ff-only`.

## Tracking known limits

Open an issue for every limitation you tell the user about (for example "Hide sponsored posts in the Facebook feed", "Support non-English interface languages", "Catch selector breakage when sites change their markup"). Include what's known and a concrete next step.

## What gets committed

- Yes: source, icons, tools/tests, store templates and rendered store assets (exact sizes), listing, SUPPORT and YouTube/social copy, PRIVACY.md, the final videos (a few MB each), CHANGELOG.md.
- No: `dist/` zips (rebuilt by `package.sh`), `soundtrack.wav`, 2× masters, `.DS_Store`, test outputs.
- After any interrupted long command: run `git status`, and restore anything deleted with `git checkout -- <path>`.

## Publishing a skill to agent-skills

Repo `Dev-Muhammad-Junaid/agent-skills`: `skills/<name>/SKILL.md` (+ `references/`, `assets/`), a `skills/<name>.zip` of the folder, and a row in the README's "Available Skills" table with the install command `npx skills add Dev-Muhammad-Junaid/agent-skills@<name> -g`.
