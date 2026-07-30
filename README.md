# <img src="./img/wowicon.svg" alt="World of Warcraft Icon" width="24"/> WoW Addon TOC Versioner

**Automatically keep your World of Warcraft addons up to date!**

Intended for World of Warcraft Addon developers, this GitHub action will automatically check to see if the interface
numbers in your .toc files are behind the latest. If they are, then the action will by default create a PR to update
them for you, but can be configured to either open a PR, create an issue, or fail a job.

It can also optionally scan your GitHub Action workflow files for outdated WoW game version strings (e.g. CurseForge
upload steps) and update those too.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub release](https://img.shields.io/github/v/release/jeany55/WowAddonVersioner)](https://github.com/jeany55/WowAddonVersioner/releases)

## Features

- **Automatic Detection** - Scans your addon's `.toc` files and detects outdated interface versions
- **Multi-TOC Support** - Handles multiple TOC files for different game versions (Retail, Classic, etc.)
- **GitHub Action Version Updates** - Optionally scans workflow files for outdated game version strings (e.g. CurseForge
  upload `game_versions`) and updates them
- **Auto Pull Requests** - Automatically creates PRs with the updated interface numbers and game versions
- **Issue Creation** - Optionally create issues to track when updates are needed
- **Updates Existing Issues/PRs** - If new interface numbers are available and an issue/PR is still open, then the
  existing one will be updated

## Supported Game Types

| Game Type | Prefix             | Description            |
| --------- | ------------------ | ---------------------- |
| Mainline  | `11xxxx`, `12xxxx` | Retail                 |
| Classic   | `6xxxx`            | Classic Era            |
| Vanilla   | `1xxxx`            | Vanilla Classic        |
| TBC       | `2xxxx`            | The Burning Crusade    |
| Wrath     | `3xxxx`            | Wrath of the Lich King |
| Cata      | `4xxxx`            | Cataclysm              |
| Mists     | `5xxxx`            | Mists of Pandaria      |

## Quick Start

This example assumes your .toc files are at the root. Add this workflow to your repository at
`.github/workflows/toc-versioner.yml`:

```yaml
name: Check TOC Versions

on:
  schedule:
    # Run daily at 7 PM
    - cron: '0 19 * * *'
  workflow_dispatch: # Allow manual triggers

jobs:
  check-versions:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    steps:
      - name: Check TOC Versions
        uses: jeany55/WowAddonVersioner@v1
```

That's it! This example action will run daily at 7 PM and also allow for manual triggering. The action will
automatically check your TOC files and create a PR if updates are available.

## Usage Examples

### Basic Usage (Auto-PR)

```yaml
- name: Check TOC Versions
  uses: jeany55/WowAddonVersioner@v1
```

### Custom TOC Directory

If your TOC files are not in the repository root:

```yaml
- name: Check TOC Versions
  uses: jeany55/WowAddonVersioner@v1
  with:
    toc-directory: '/src/MyAddon'
```

### Create Issue Instead of PR

```yaml
- name: Check TOC Versions
  uses: jeany55/WowAddonVersioner@v1
  with:
    create-pr: false
    create-issue-if-updates-found: true
```

### Update Game Versions in GitHub Actions

If your workflow files contain WoW game version strings (e.g. for CurseForge uploads), enable `update-action-versions`
to keep those up to date too.

> **Note:** Updating workflow files requires a Personal Access Token (PAT) with `workflows` permission. The default
> `GITHUB_TOKEN` cannot modify files under `.github/workflows/`. See [Permissions](#permissions) for setup details.

```yaml
- name: Check TOC Versions
  uses: jeany55/WowAddonVersioner@v1
  with:
    update-action-versions: true
    github-token: ${{ secrets.WOW_VERSIONER_PAT }}
```

This scans all `.yml`/`.yaml` files in `.github/workflows/` for comma-separated game version strings like
`"1.15.8,12.0.1,5.5.3,4.4.2,3.4.5,2.5.5"` and updates any that are behind the latest versions from the wiki.

### Update Action Versions with a Custom Regex

By default, the action looks for comma-separated version lists like `1.15.8,12.0.1,5.5.3`. Use `action-version-regex` to
provide your own pattern that matches the region containing game versions. Individual `X.Y.Z` versions are always
extracted from within each match.

For example, to only match CurseForge `game_versions` lines:

```yaml
- name: Check TOC Versions
  uses: jeany55/WowAddonVersioner@v1
  with:
    update-action-versions: true
    action-version-regex: 'game_versions:\s*"[^"]*"'
```

Or to match versions in a YAML array format like `[1.15.8, 12.0.1, 5.5.3]`:

```yaml
- name: Check TOC Versions
  uses: jeany55/WowAddonVersioner@v1
  with:
    update-action-versions: true
    action-version-regex: '\[[\d.,\s]+\]'
```

### Fail Build on Outdated Versions

Useful for CI/CD pipelines where you want to enforce up-to-date TOC files (or get an email if a pipeline fails):

```yaml
- name: Check TOC Versions
  uses: jeany55/WowAddonVersioner@v1
  with:
    create-pr: false
    fail-job-when-updates-found: true
```

### Full Configuration

```yaml
- name: Check TOC Versions
  uses: jeany55/WowAddonVersioner@v1
  with:
    wiki-url: 'https://warcraft.wiki.gg/wiki/API_GetBuildInfo'
    toc-directory: '/src/MyAddon'
    create-pr: true
    pr-branch-name: 'auto/update-interface-versions'
    fail-job-when-updates-found: false
    create-issue-if-updates-found: false
    update-action-versions: true
    action-version-regex: 'game_versions:.*'
    github-token: ${{ secrets.WOW_VERSIONER_PAT }} # PAT required if update-action-versions is true
```

## Inputs

| Input                           | Description                                                                                                                                      | Required | Default                                          |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | -------- | ------------------------------------------------ |
| `wiki-url`                      | URL of the WoW Wiki page to fetch interface versions from                                                                                        | No       | `https://warcraft.wiki.gg/wiki/API_GetBuildInfo` |
| `toc-directory`                 | Directory containing your TOC files (relative to repo root)                                                                                      | No       | Repository root                                  |
| `create-pr`                     | Create a pull request with version updates                                                                                                       | No       | `true`                                           |
| `pr-branch-name`                | Branch name for the pull request                                                                                                                 | No       | `auto/update-interface-versions`                 |
| `fail-job-when-updates-found`   | Fail the job if outdated versions are found                                                                                                      | No       | `false`                                          |
| `create-issue-if-updates-found` | Create an issue if updates are found                                                                                                             | No       | `false`                                          |
| `update-action-versions`        | Scan GitHub Action workflow files for outdated game version strings                                                                              | No       | `false`                                          |
| `action-version-regex`          | Regex that matches the region containing game versions. Individual `X.Y.Z` versions are extracted from within each match.                        | No       | Comma-separated list pattern                     |
| `github-token`                  | GitHub token for creating PRs/issues. A PAT with `workflows` permission is required if `update-action-versions` is `true`. Not needed otherwise. | No       | `${{ secrets.GITHUB_TOKEN }}`                    |

## TOC File Format

The action looks for the standard WoW TOC interface directive:

```
## Interface: 110002
## Title: My Awesome Addon
## Notes: This addon does cool things!
## Author: YourName

MyAddon.lua
```

The action will automatically detect the game type based on the interface number prefix and update it to the latest
version for that game type.

## How Action Version Detection Works

When `update-action-versions` is enabled, the action:

1. Scans all `.yml`/`.yaml` files in `.github/workflows/`
2. Searches for comma-separated lists of game version strings (e.g. `1.15.8,12.0.1,5.5.3`)
3. Parses each version and determines which WoW game type it belongs to based on the major version number
4. Compares each version against the latest from the wiki's **Version** column
5. Updates any outdated versions in place

The game type is determined by the major version prefix of the game version string:

| Major Version | Game Type                                          |
| ------------- | -------------------------------------------------- |
| `1`           | Classic / Vanilla (disambiguated by minor version) |
| `2`           | TBC                                                |
| `3`           | Wrath                                              |
| `4`           | Cata                                               |
| `5`           | Mists                                              |
| `11`, `12`    | Mainline (Retail)                                  |

By default, the action searches for comma-separated version lists (e.g. `1.15.8,12.0.1,5.5.3`). You can override this
with `action-version-regex` to match any format — the regex defines the region to match, and individual `X.Y.Z` versions
are always extracted from within. This is useful for targeting specific patterns like CurseForge `game_versions` lines,
YAML arrays, or space-separated lists without accidentally modifying unrelated version numbers.

## Permissions

Make sure your workflow has the necessary permissions:

```yaml
permissions:
  contents: write # Required to push changes
  pull-requests: write # Required to create PRs
  issues: write # Required if using create-issue-if-updates-found
```

Or make sure that actions are allowed to create pull requests for your repository.

### Workflow file updates (`update-action-versions`)

If you enable `update-action-versions`, the action will modify files under `.github/workflows/`. GitHub does not allow
the default `GITHUB_TOKEN` to push changes to workflow files — you'll get a
`refusing to allow a GitHub App to create or update workflow` error.

To fix this, create a **Personal Access Token (PAT)** and pass it via the `github-token` input:

1. Go to **Settings > Developer settings > Personal access tokens > Fine-grained tokens**
2. Create a token with access to your repository and these permissions:
   - **Contents**: Read and write
   - **Pull requests**: Read and write
   - **Workflows**: Read and write
3. Add the token as a repository secret (e.g. `WOW_VERSIONER_PAT`)
4. Pass it in your workflow:

```yaml
- name: Check TOC Versions
  uses: jeany55/WowAddonVersioner@v1
  with:
    update-action-versions: true
    github-token: ${{ secrets.WOW_VERSIONER_PAT }}
```

If you are only updating TOC files (not workflow files), the default `GITHUB_TOKEN` works fine and you can remove both
`update-action-versions` and `github-token`.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Special thanks to **Quetz the Great** for their contributions
- Interface data sourced from [Warcraft Wiki](https://warcraft.wiki.gg)
