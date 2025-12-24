# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

Please report any vulnerabilities to the repository owner via email.

## CI/CD Access Policy

**Automated Pull Request Creation**

To ensure the integrity of the `main` branch, the "Auto-PR" GitHub Actions workflow is strictly restricted.

- **Authorized Users**: Only the **Repository Owner** is authorized to trigger the automatic creation of Pull Requests via the CI/CD pipeline.
- **Enforcement**: This policy is enforced programmatically in the `.github/workflows/auto-pr.yml` file using the `github.actor == github.repository_owner` check.
- **Unauthorized Triggers**: Runs triggered by other users (e.g., from forks or contributors) will run the quality checks (build, test, lint) but will **skip** the PR creation step.
