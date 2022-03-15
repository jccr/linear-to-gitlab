# linear-to-gitlab

Migrate your Linear issues to GitLab.

## Usage
0. Run `npm install`
1. Create a `.env` file based on these values:
    ```
    # Your Linear API Key
    LINEAR_TOKEN=lin_api_abcxyz

    # Your GitLab Personal Access Token
    GITLAB_TOKEN=glpat--abcxyz

    # The source Linear project key
    LINEAR_PROJECT_KEY=ABC

    # The target GitLab project ID
    GITLAB_PROJECT_ID=12345678
    ```
2. Migrate Linear project states to GitLab labels:
    ```
    node import-states.js > out-labels.json
    ```
3. Migrate Linear issues to GitLab issues:
    ```
    node import-issues.js > out-issues.json
    ```
4. Migrate Linear issue links to GitLab issue links:
    ```
    node link-issues.js < out-issues.json
