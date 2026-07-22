# SLOPATHON

Hackathon submission repository for **SLOPATHON (OP001)**.

## Purpose

This repository is intended to host the team’s hackathon deliverables, including:

- project source code
- implementation notes
- demo/setup instructions

## Quick Start

1. Clone the repository.
2. Create a feature branch for your work.
3. Commit small, focused changes.
4. Open a pull request for review.

## Agent PR Workflow (Fork → PR)

When working from a fork, use this flow to ensure PRs are opened correctly:

1. Fork `HACK-OPS-KA/SLOPATHON` on GitHub.
2. Clone your fork:
   ```bash
   git clone https://github.com/<your-username>/SLOPATHON.git
   cd SLOPATHON
   ```
3. Add the original repository as `upstream`:
   ```bash
   git remote add upstream https://github.com/HACK-OPS-KA/SLOPATHON.git
   git fetch upstream
   ```
4. Create a branch from `upstream/main`:
   ```bash
   git checkout -b <feature-branch> upstream/main
   ```
5. Make changes, commit, and push the branch to your fork:
   ```bash
   git add .
   git commit -m "Describe your change"
   git push -u origin <feature-branch>
   ```
6. Open a Pull Request:
   - **base repo:** `HACK-OPS-KA/SLOPATHON`
   - **base branch:** `main`
   - **head repo:** `<your-username>/SLOPATHON`
   - **compare branch:** `<feature-branch>`

This guarantees the PR is raised from your fork into the main hackathon repository.
