---
name: notion-api
description: >
  Notion REST API integration, database operations, page management, and workspace automation.
  Use this skill whenever the user works with the Notion API, creates or queries databases,
  manages pages and blocks programmatically, searches workspace content, handles Notion
  OAuth, builds integrations or bots that read/write Notion, connects Notion to n8n or
  Make, uses Notion as a CMS or knowledge base backend, works with Notion MCP server,
  or automates any Notion workflow. Also use when the user mentions Notion API, notion-sdk,
  @notionhq/client, database properties, page blocks, Notion OAuth, integration token,
  or Notion webhooks — even if they just say "update my database" or "read that Notion page."
---

# Notion API Guide

This skill provides expert knowledge for integrating with and automating Notion using its REST API.

## When to use

- Creating, querying, and updating Notion databases
- Creating and editing pages and their content (blocks)
- Searching across a Notion workspace
- Managing database properties and schemas
- Building integrations with Notion OAuth 2.0
- Connecting Notion to automation platforms (n8n, Make, Zapier)
- Using Notion as a CMS, task tracker, or knowledge base backend
- Working with Notion MCP server for AI agent access
- Reading and writing comments on pages
- Managing users and permissions via API
- Syncing data between Notion and external systems

## Core Concepts

### API Architecture

```javascript
Notion API v1 (REST)
├── Pages — Create, read, update, archive
│   └── Page properties — Title, rich text, select, date, relation, etc.
├── Databases — Create, query, update schema
│   └── Filter & Sort — Complex queries on properties
├── Blocks — Content elements inside pages
│   └── Nested children — Hierarchical block structure
├── Search — Full-text search across workspace
├── Users — List workspace members and bots
├── Comments — Read and create page/block comments
└── OAuth — Third-party integration authorization
```

### Authentication

```javascript
1. Internal Integration (simplest)
   - Create at notion.so/my-integrations
   - Get a secret token (ntn_...)
   - Share pages/databases with the integration
   - Best for: personal scripts, internal tools

2. Public Integration (OAuth 2.0)
   - Register OAuth app at notion.so/my-integrations
   - Authorization Code flow → access_token
   - Users grant access to specific pages
   - Best for: SaaS products, multi-user apps

3. MCP Server
   - Notion official MCP server or community servers
   - Exposes Notion as tools for AI agents
   - Best for: AI-powered workflows, Antigravity, Claude, Cursor
```

### Object Model

```javascript
Workspace
├── Pages (top-level)
│   ├── Properties (title, icon, cover)
│   ├── Blocks (content)
│   │   ├── paragraph, heading_1/2/3
│   │   ├── bulleted_list_item, numbered_list_item
│   │   ├── to_do, toggle, code, quote
│   │   ├── image, video, file, embed
│   │   ├── table, table_row
│   │   ├── child_page, child_database
│   │   └── synced_block, column_list, callout
│   └── Comments
├── Databases
│   ├── Schema (property definitions)
│   ├── Pages (rows/entries)
│   └── Views (not accessible via API)
└── Users (people + bots)
```

### Property Types

| Type | Read Format | Write Format |
| :--- | :--- | :--- |
| title | `{title: [{text: {…}}]}` | `{title: [{text: {content: "…"}}]}` |
| rich_text | `{rich_text: [{…}]}` | `{rich_text: [{text: {content: "…"}}]}` |
| number | `{number: 42}` | `{number: 42}` |
| select | `{select: {name: "…"}}` | `{select: {name: "…"}}` |
| multi_select | `{multi_select: [{…}]}` | `{multi_select: [{name: "…"}]}` |
| date | `{date: {start, end}}` | `{date: {start: "2025-01-15"}}` |
| checkbox | `{checkbox: true}` | `{checkbox: true}` |
| url | `{url: "https://…"}` | `{url: "https://…"}` |
| email | `{email: "a@b.com"}` | `{email: "a@b.com"}` |
| phone_number | `{phone_number: "+1…"}` | `{phone_number: "+1…"}` |
| relation | `{relation: [{id: "…"}]}` | `{relation: [{id: "page-id"}]}` |
| people | `{people: [{id: "…"}]}` | `{people: [{id: "user-id"}]}` |
| files | `{files: [{…}]}` | `{files: [{external: {url: "…"}}]}` |
| status | `{status: {name: "…"}}` | `{status: {name: "Done"}}` |
| formula | `{formula: {type, …}}` | (read-only, computed) |
| rollup | `{rollup: {type, …}}` | (read-only, computed) |
| created_time | `{created_time: "…"}` | (read-only) |
| last_edited_time | `{last_edited_time: "…"}` | (read-only) |
| created_by | `{created_by: {id: "…"}}` | (read-only) |
| last_edited_by | `{last_edited_by: {…}}` | (read-only) |
| unique_id | `{unique_id: {prefix,…}}` | (read-only) |

## Instructions

### Python (notion-client)

```python
from notion_client import Client
import os

notion = Client(auth=os.environ["NOTION_TOKEN"])

# --- Search ---
results = notion.search(
    query="Project Roadmap",
    filter={"property": "object", "value": "page"}  # or "database"
)
for page in results["results"]:
    title = page["properties"]["title"]["title"][0]["plain_text"] if page["properties"].get("title") else "Untitled"
    print(f"{title}: {page['id']}")
```

### Database Operations

```python
# --- Query database with filters ---
def query_database(database_id, status=None, tag=None):
    filters = []
    if status:
        filters.append({"property": "Status", "status": {"equals": status}})
    if tag:
        filters.append({"property": "Tags", "multi_select": {"contains": tag}})

    filter_obj = {"and": filters} if len(filters) > 1 else filters[0] if filters else None

    results = notion.databases.query(
        database_id=database_id,
        filter=filter_obj,
        sorts=[{"property": "Created", "direction": "descending"}],
        page_size=100  # Max 100 per request
    )
    return results["results"]

# --- Pagination (get ALL results) ---
def query_all(database_id, **kwargs):
    pages = []
    has_more = True
    start_cursor = None
    while has_more:
        response = notion.databases.query(
            database_id=database_id,
            start_cursor=start_cursor,
            page_size=100,
            **kwargs
        )
        pages.extend(response["results"])
        has_more = response["has_more"]
        start_cursor = response.get("next_cursor")
    return pages

# --- Create database ---
def create_database(parent_page_id, title, properties):
    return notion.databases.create(
        parent={"type": "page_id", "page_id": parent_page_id},
        title=[{"type": "text", "text": {"content": title}}],
        properties=properties
    )

# Example: Task database schema
task_db = create_database("parent-page-id", "Tasks", {
    "Task": {"title": {}},
    "Status": {"status": {}},
    "Priority": {"select": {
        "options": [
            {"name": "High", "color": "red"},
            {"name": "Medium", "color": "yellow"},
            {"name": "Low", "color": "green"}
        ]
    }},
    "Due Date": {"date": {}},
    "Assignee": {"people": {}},
    "Tags": {"multi_select": {
        "options": [{"name": "Bug"}, {"name": "Feature"}, {"name": "Docs"}]
    }}
})
```

### Page Operations

```python
# --- Create page in database ---
def create_page(database_id, title, status=None, tags=None, due_date=None):
    properties = {
        "Task": {"title": [{"text": {"content": title}}]}
    }
    if status:
        properties["Status"] = {"status": {"name": status}}
    if tags:
        properties["Tags"] = {"multi_select": [{"name": t} for t in tags]}
    if due_date:
        properties["Due Date"] = {"date": {"start": due_date}}

    return notion.pages.create(
        parent={"database_id": database_id},
        properties=properties
    )

# --- Update page properties ---
def update_page(page_id, updates):
    return notion.pages.update(page_id=page_id, properties=updates)

# Example: Mark task complete
update_page("page-id", {
    "Status": {"status": {"name": "Done"}},
    "Completed": {"date": {"start": "2025-03-08"}}
})

# --- Archive (soft delete) a page ---
notion.pages.update(page_id="page-id", archived=True)

# --- Retrieve page ---
page = notion.pages.retrieve(page_id="page-id")
```

### Block Operations (Page Content)

```python
# --- Read all blocks from a page ---
def get_all_blocks(block_id):
    blocks = []
    has_more = True
    start_cursor = None
    while has_more:
        response = notion.blocks.children.list(
            block_id=block_id,
            start_cursor=start_cursor,
            page_size=100
        )
        blocks.extend(response["results"])
        has_more = response["has_more"]
        start_cursor = response.get("next_cursor")
    return blocks

# --- Append blocks to a page ---
def append_blocks(page_id, blocks):
    return notion.blocks.children.append(
        block_id=page_id,
        children=blocks
    )

# Example: Add content to a page
append_blocks("page-id", [
    {
        "object": "block",
        "type": "heading_2",
        "heading_2": {
            "rich_text": [{"type": "text", "text": {"content": "Meeting Notes"}}]
        }
    },
    {
        "object": "block",
        "type": "paragraph",
        "paragraph": {
            "rich_text": [{
                "type": "text",
                "text": {"content": "Key decisions made today:"},
                "annotations": {"bold": True}
            }]
        }
    },
    {
        "object": "block",
        "type": "bulleted_list_item",
        "bulleted_list_item": {
            "rich_text": [{"type": "text", "text": {"content": "Approved Q2 budget"}}]
        }
    },
    {
        "object": "block",
        "type": "to_do",
        "to_do": {
            "rich_text": [{"type": "text", "text": {"content": "Follow up with design team"}}],
            "checked": False
        }
    },
    {
        "object": "block",
        "type": "code",
        "code": {
            "rich_text": [{"type": "text", "text": {"content": "console.log('hello')"}}],
            "language": "javascript"
        }
    },
    {
        "object": "block",
        "type": "callout",
        "callout": {
            "rich_text": [{"type": "text", "text": {"content": "Important: deadline is Friday"}}],
            "icon": {"type": "emoji", "emoji": "⚠️"}
        }
    }
])

# --- Delete a block ---
notion.blocks.delete(block_id="block-id")

# --- Update a block ---
notion.blocks.update(
    block_id="block-id",
    paragraph={
        "rich_text": [{"type": "text", "text": {"content": "Updated text"}}]
    }
)
```

### Node.js (@notionhq/client)

```typescript
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

// Search
const results = await notion.search({
  query: "Meeting Notes",
  filter: { property: "object", value: "page" }
});

// Query database
const tasks = await notion.databases.query({
  database_id: "db-id",
  filter: {
    and: [
      { property: "Status", status: { does_not_equal: "Done" } },
      { property: "Priority", select: { equals: "High" } }
    ]
  },
  sorts: [{ property: "Due Date", direction: "ascending" }]
});

// Create page
const page = await notion.pages.create({
  parent: { database_id: "db-id" },
  properties: {
    "Name": { title: [{ text: { content: "New Task" } }] },
    "Status": { status: { name: "In Progress" } },
    "Tags": { multi_select: [{ name: "Feature" }] }
  },
  children: [
    {
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [{ type: "text", text: { content: "Task description here" } }]
      }
    }
  ]
});
```

### Filter Reference

```python
# Text filters
{"property": "Name", "title": {"contains": "report"}}
{"property": "Notes", "rich_text": {"is_not_empty": True}}

# Number filters
{"property": "Score", "number": {"greater_than": 80}}
{"property": "Count", "number": {"less_than_or_equal_to": 10}}

# Select/Status
{"property": "Status", "status": {"equals": "In Progress"}}
{"property": "Priority", "select": {"does_not_equal": "Low"}}

# Multi-select
{"property": "Tags", "multi_select": {"contains": "Bug"}}

# Date filters
{"property": "Due", "date": {"before": "2025-04-01"}}
{"property": "Due", "date": {"past_week": {}}}
{"property": "Due", "date": {"is_not_empty": True}}

# Checkbox
{"property": "Active", "checkbox": {"equals": True}}

# Relation
{"property": "Project", "relation": {"contains": "page-id"}}

# Compound filters
{"and": [{...}, {...}]}
{"or": [{...}, {...}]}
{"and": [{"or": [{...}, {...}]}, {...}]}  # Nested
```

### Rich Text Formatting

```python
# Bold, italic, code, link, color
rich_text_block = {
    "rich_text": [
        {"type": "text", "text": {"content": "Normal text "}},
        {"type": "text", "text": {"content": "bold"}, "annotations": {"bold": True}},
        {"type": "text", "text": {"content": " and "}},
        {"type": "text", "text": {"content": "italic"}, "annotations": {"italic": True}},
        {"type": "text", "text": {"content": " and "}},
        {"type": "text", "text": {"content": "code"}, "annotations": {"code": True}},
        {"type": "text", "text": {"content": " and "}},
        {
            "type": "text",
            "text": {"content": "a link", "link": {"url": "https://notion.so"}},
            "annotations": {"color": "blue"}
        }
    ]
}

# Mention a page or user
mention_block = {
    "rich_text": [{
        "type": "mention",
        "mention": {"type": "page", "page": {"id": "page-id"}}
    }]
}
```

### OAuth 2.0 (Public Integrations)

```python
import requests

CLIENT_ID = os.environ["NOTION_CLIENT_ID"]
CLIENT_SECRET = os.environ["NOTION_CLIENT_SECRET"]
REDIRECT_URI = "https://yourdomain.com/callback"

# Step 1: Authorization URL
def get_auth_url(state):
    return (
        f"https://api.notion.com/v1/oauth/authorize"
        f"?client_id={CLIENT_ID}"
        f"&response_type=code"
        f"&owner=user"
        f"&redirect_uri={REDIRECT_URI}"
        f"&state={state}"
    )

# Step 2: Exchange code for token
def exchange_code(code):
    resp = requests.post("https://api.notion.com/v1/oauth/token", json={
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": REDIRECT_URI
    }, auth=(CLIENT_ID, CLIENT_SECRET))
    data = resp.json()
    return data["access_token"], data["workspace_id"]
```

### Notion MCP Server

```json
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["-y", "@notionhq/notion-mcp-server"],
      "env": {
        "OPENAPI_MCP_HEADERS": "{\"Authorization\": \"Bearer ntn_YOUR_TOKEN\", \"Notion-Version\": \"2022-06-28\"}"
      }
    }
  }
}
```

This gives AI agents (Claude, Cursor, Antigravity) direct access to Notion tools: search, create pages, query databases, update content.

### n8n / Make Integration Patterns

```javascript
n8n Notion nodes:
├── Notion: Get Database — fetch schema
├── Notion: Query Database — filtered queries
├── Notion: Create Page — add entries
├── Notion: Update Page — modify properties
├── Notion: Get Page — retrieve page + properties
├── Notion: Append Block — add content
└── Notion Trigger — webhook on page changes

Common automation patterns:
1. Form → Notion DB (intake)
2. Notion DB → Slack notification (status change)
3. Calendar → Notion meeting notes (auto-create)
4. Notion DB → API → Notion DB (enrichment)
5. RSS/Email → Notion inbox (content capture)
```

## Decision Tree

User needs Notion integration
├── What operation?
│   ├── Query data → databases.query with filters + sorts
│   ├── Create entry → pages.create with database parent
│   ├── Update entry → pages.update with property changes
│   ├── Read content → blocks.children.list (paginate!)
│   ├── Write content → blocks.children.append
│   ├── Search → search endpoint with query + filter
│   └── Schema changes → databases.update (add/modify properties)
├── Auth method?
│   ├── Personal/team script → Internal integration token
│   ├── Multi-user app → OAuth 2.0 public integration
│   ├── AI agent → MCP server with integration token
│   └── n8n/Make → Built-in Notion credentials
├── Language?
│   ├── Python → notion-client (official SDK)
│   ├── Node.js → @notionhq/client (official SDK)
│   ├── Any → Raw REST API (https://api.notion.com/v1/)
│   └── No-code → n8n / Make / Zapier nodes
├── Data volume?
│   ├── < 100 items → Single query, no pagination
│   ├── 100-10k → Paginate with start_cursor
│   └── 10k+ → Paginate + cache/sync strategy
└── Real-time needs?
    ├── Polling → Query on schedule (simplest)
    ├── Webhooks → Not native; use Notion Trigger in n8n
    └── MCP → On-demand agent access

## Constraints

- **ALWAYS** include `Notion-Version: 2022-06-28` header in raw API calls
- **ALWAYS** paginate results — max 100 items per request; use `start_cursor` + `has_more`
- **ALWAYS** share pages/databases with your integration before API access — unshared content returns 404
- **NEVER** hardcode integration tokens — use environment variables
- **ALWAYS** handle rate limits (429) — Notion allows ~3 requests/second average; use exponential backoff
- **NEVER** assume property names are lowercase — they are case-sensitive and exact-match
- **ALWAYS** check property type before reading values — each type has a different nested structure
- **NEVER** try to set computed properties (formula, rollup, created_time, etc.) — they are read-only
- **ALWAYS** use `archived: true` instead of delete — Notion API does not have hard delete for pages
- **ALWAYS** use rich_text array format for text content — even a simple string needs `[{text: {content: "..."}}]`
- **NEVER** exceed 100 blocks per `append` call — split into multiple requests
- **ALWAYS** use ISO 8601 format for dates (`"2025-03-08"` or `"2025-03-08T10:00:00.000+01:00"`)
- **NEVER** rely on database views via API — views are not accessible; apply your own filters/sorts

## References

- [Notion API Documentation](https://developers.notion.com/)
- [Notion SDK for JavaScript](https://github.com/makenotion/notion-sdk-js)
- [Notion SDK for Python](https://github.com/ramnes/notion-sdk-py)
- [Notion API Property Values](https://developers.notion.com/reference/property-value-object)
- [Notion API Block Types](https://developers.notion.com/reference/block)
- [Notion MCP Server](https://github.com/makenotion/notion-mcp-server)
- [Notion API Rate Limits](https://developers.notion.com/reference/request-limits)
- [Notion API Changelog](https://developers.notion.com/changelog)
