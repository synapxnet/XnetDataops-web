# Contributing

Contributions to `synapxnet/XnetDataops-web` are welcome when they preserve the repository's product boundary and public contracts.

## Workflow

1. Create a focused branch from the maintained branch.
2. Keep UTF-8 encoding and the existing formatting style.
3. Add or update tests in proportion to the behavior changed.
4. Run the repository's documented build and test commands.
5. Update public contracts and migration notes when behavior changes.
6. Submit a pull request describing scope, verification, compatibility, and rollback.

## Security and Privacy

Do not commit secrets, personal data, tenant exports, private endpoints, certificates, generated build directories, or local environment files. Follow [SECURITY.md](./SECURITY.md) for vulnerability reports.

## GOAI Integration

Changes to AgentTeams identities, Skills, MCP tools, schemas, approval boundaries, Incident/Trace fields, or audit receipts must remain compatible with the suite contract documented in [GOAI-RELEASE.md](./GOAI-RELEASE.md). Breaking changes require a versioned migration plan.
