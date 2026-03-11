---
name: n8n-workflow-automation
description: >
  Comprehensive n8n workflow automation guide for building, configuring, and
  debugging automations. Use this skill whenever the user mentions n8n, workflow
  automation, connecting services, webhooks, triggers, API orchestration, AI agent
  pipelines, or multi-step automations — even if they don't explicitly say 'n8n'
  but describe a need to connect services or automate processes.
---

# n8n Workflow Automation Guide

This skill provides expert knowledge for building workflow automations on the **n8n** platform — an open-source, self-hostable automation tool with a visual node-based editor, 500+ integrations, and native AI agent capabilities.

## When to use

- User wants to automate a business process or connect multiple services
- User needs to build an AI agent pipeline (RAG, chat, tool-use agents)
- User asks about webhooks, triggers, or event-driven workflows
- User wants to process data between APIs, databases, or notifications
- User needs help with n8n node configuration, expressions, or error handling
- User asks to deploy or self-host n8n

## Core Concepts

### Workflow Architecture

Every n8n workflow is a directed graph of **nodes** connected by edges:

| Node Type | Function | Examples |
| :--- | :--- | :--- |
| Trigger | Starts the workflow | Webhook, Schedule, On Success/Error |
| Action | Executes a task | Slack: Post Message, HTTP Request, Code |
| Logic | Controls the flow | IF, Switch, Merge, Split In Batches |
| AI | Adds LLM intelligence | AI Agent, Chains, Vector Store |

### Data Flow

- Each node receives **items** (array of JSON objects) from previous nodes
- Nodes process items and pass results downstream
- Use **expressions** ( `$json.field` ) to reference data between nodes
- **Split In Batches** for processing large datasets without memory overflow

## Instructions

### Building a new workflow

1. **Identify the trigger**: Determine what starts the workflow (Webhook, Cron, etc.)
2. **Map the data flow**: Plan the node chain and how data moves between them.
3. **Configure each node**: Set parameters, authentication, and expressions.
4. **Add error handling**: Use Error Trigger or Error branch on nodes.

### Building AI Agent workflows

1. **Choose the agent pattern**: RAG, Chat, or Tool-use.
2. **Configure the AI Agent node**: Attach a Chat Model and optional Tools.
3. **For RAG pipelines**: Connect a Vector Store and Embeddings model.

### Writing Code nodes

- n8n supports both **JavaScript** and **Python** in Code nodes
- Access input data: `$input.all()` (JS) or `_input.all()` (Python)
- Return array of items: `return [{json: {key: "value"}}]`
- Use `$env` to access environment variables
- Avoid blocking operations; use async/await for external calls

### Connecting to external APIs

1. Use **HTTP Request** node for any REST API
2. Set method (GET, POST, PUT, DELETE)
3. Configure authentication in **Credentials** (reusable across workflows)
4. Parse response with expressions or Code node
5. Handle pagination with **Split In Batches** + loop pattern

## Deployment

### Docker Compose (recommended for self-hosting)

```yaml
version: '3.8'
services:
  n8n:
    image: n8nio/n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=changeme
    volumes:
      - n8n_data:/home/node/.n8n
volumes:
  n8n_data:
```

### Deployment options

- **n8n Cloud** — managed hosting, from $24/month, auto-updates
- **Self-hosted Docker** — full control, `docker-compose up`
- **npm** — `npx n8n` for local development and testing

## Decision Tree

User needs n8n integration
├── Need to connect two services? → Use native integration nodes or HTTP Request
├── Need conditional logic? → IF node for binary, Switch for multi-branch
├── Need to process items one by one? → Split In Batches node
├── Need AI/LLM capabilities? → AI Agent node with Chat Model
├── Need to store/search documents? → Vector Store + Embeddings pipeline
├── Need external API without a native node? → HTTP Request node with custom auth
└── Need complex data transformation? → Code node (JS or Python)

## Constraints

- Do not hardcode API keys in workflow JSON — always use n8n **Credentials**
- Do not use synchronous Code node operations for external HTTP calls
- Respect API rate limits — add Wait nodes or use Split In Batches with delays
- For production: always enable **Error Trigger** workflow for monitoring
- Webhook URLs change between test and production mode — use environment variables

## References

- [Official documentation](https://docs.n8n.io/)
- [Workflow template library (8500+)](https://n8n.io/workflows/)
- [GitHub repository](https://github.com/n8n-io/n8n)
- [Community forum](https://community.n8n.io/)
