# Security Policy

## Supported Version

Security fixes for the GOAI competition line are applied to `goai-v1.1.0` and newer maintained releases. Older tags are retained for traceability and may not receive fixes.

## Reporting a Vulnerability

Do not disclose credentials, tenant data, exploit details, or unpatched vulnerabilities in a public issue.

Use GitHub's private vulnerability reporting for [`synapxnet/XnetDataops-web`](https://github.com/synapxnet/XnetDataops-web/security/advisories/new). Include the affected commit, reproducible steps, impact, and the smallest evidence set required for validation. If private reporting is unavailable, open a public issue containing no sensitive detail and request a private contact channel.

The SynapXnet team will acknowledge a valid report, assess affected versions, coordinate a fix, and publish an advisory when disclosure is safe.

## Security Boundaries

- Never commit API keys, passwords, access tokens, TLS private keys, kubeconfig files, `.env` files, or production exports.
- Enterprise access is scoped by Workspace and role. High-risk writes require approval, resource-version checks, a parameter digest, an idempotency key, audit evidence, and a rollback path.
- Desktop loopback Bearer authentication is local-only. Public MCP deployment requires TLS, OAuth 2.1, RFC 9728 protected-resource metadata, Workspace RBAC, rate limits, and centralized secret management.
- Demo credentials and fixtures must remain isolated from production environments.
