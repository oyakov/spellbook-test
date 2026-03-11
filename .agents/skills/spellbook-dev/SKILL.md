---
name: spellbook-dev
description: Skill for developing and maintaining the Spellbook clone.
---

# Spellbook Developer Skill

This skill provides instructions and patterns for maintaining the Spellbook clone.

## Core Components

- **index.html**: Main structure.
- **style.css**: Theme and layout.
- **src/main.ts**: Interactive chat logic.

## Design Patterns

- **Colors**: Use the cream background `#e9e6dd` and bold black accents.
- **Radius**: Maintain high rounded corners (24px for containers, 12px for items).
- **Typography**: Use 'Geologica' for headings and 'Inter' for body text.

## Chat Logic

To add new mock responses, edit the `generateMockResponse` function in `src/main.ts`.

## Verification

Always run Playwright tests after making UI changes.
