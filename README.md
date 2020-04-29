# Pull Request Lint GitHub Action

_GitHub action to lint Pull Requests and block merges if they don't match desired requirements_

## Example Usage (using from within this repo [public/private])

```
name: Pull Request Lint

on:
  pull_request:
    branches:
      - master
    types: [opened, edited, reopened]
    # types: [opened, reopened, synchronize]  # default

jobs:
  pr-lint:
    name: Pull Request Lint
    runs-on: ubuntu-18.04
    steps:
      - uses: actions/checkout@master
      - uses: actions/setup-node@v1
      - name: Lint Pull Request
        uses: pataraco/pr-lint-action@v0.0.0
        with:
          title-regex: '^(\[(Feature|Hotfix|Bugfix|Chore|Release)\] JIRA-(\d+)|\[(Chore|Release)\])'
          repo-token: "${{ secrets.GITHUB_TOKEN }}"
          on-failed-regex-comment: |
            The PR title failed this RegEx!
            - `%regex%`
            Here are some accepted PR title examples
            - [Feature] JIRA-XXXX Lorem Ipsum
            - [Hotfix] JIRA-XXXX Lorem Ipsum
            - [Bugfix] JIRA-XXXX Lorem Ipsum
            - [Chore] Lorem Ipsum
            - [Release] Lorem Ipsum
```

## Example Usage (using a private repo)

If you decide to create your own copy and place in a private repo

```
name: Pull Request Lint

on:
  pull_request:
    branches:
      - master
    types: [opened, edited, reopened]
    # types: [opened, reopened, synchronize]  # default

jobs:
  pr-lint:
    name: Pull Request Lint
    runs-on: ubuntu-18.04
    steps:
      # checkout current repo
      - name: Checkout Current Repo
        uses: actions/checkout@v2
      # TODO: remove if not needed
      - uses: actions/setup-node@v1
      # checkout the private repo containing the action to run
      - name: Checkout PR Lint GitHub Action Private Repo
        uses: actions/checkout@v2
        with:
          repository: <GitHubUser>/<GitHubRepo>
          ref: <GitHubRef>
          # use a PAT of a user that has access to the private repo
          # stored in GitHub secrets
          token: ${{ secrets.GIT_HUB_TOKEN }}
          # store the repo (action) locally
          path: .github/actions/pr-lint-action
      - name: Lint Pull Request
        # run the action locally
        uses: ./.github/actions/pr-lint-action
        with:
          title-regex: '^(\[(Feature|Hotfix|Bugfix|Chore|Release)\] JIRA-(\d+)|\[(Chore|Release)\])'
          repo-token: "${{ secrets.GITHUB_TOKEN }}"
          on-failed-regex-comment: |
            The PR title failed this RegEx!
            - `%regex%`
            Here are some accepted PR title examples
            - [Feature] JIRA-XXXX Lorem Ipsum
            - [Hotfix] JIRA-XXXX Lorem Ipsum
            - [Bugfix] JIRA-XXXX Lorem Ipsum
            - [Chore] Lorem Ipsum
            - [Release] Lorem Ipsum
```

## Updating, Building and Releasing

To update/build a new version.

```
# 1. Install @zeit/ncc npm package
$ npm i -g @zeit/ncc      # just needs to be run once

# 2. Make updates to `src/index.ts`

# 3. Build new Javascript file
$ ncc build src/index.ts

# 4. Commit, Push and Tag your changes
```

## Debugging

Create the following GitHub secret in the repo to enable debug logging
in the GitHub Actions log output

`ACTIONS_STEP_DEBUG == true`

