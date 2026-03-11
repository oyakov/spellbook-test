---
name: skill-creator
description: Framework for creating, testing, and refining agent skills. Use this skill whenever you need to capture user intent, research a domain, write a SKILL.md file, create test cases, evaluate skill performance against baselines, and iterate on improvements based on user feedback and quantitative metrics.
---

# Skill Creation Workflow

This skill provides a comprehensive workflow for creating high-quality agent skills that are well-defined, testable, and meet user needs.

## When to Use
- **Capturing Intent**: When you need to understand exactly what a skill should do and who it's for.
- **Research & Knowledge Gathering**: When you need to deep-dive into a specific domain to provide the agent with the necessary context.
- **Writing SKILL.md**: When you are ready to draft the core instruction set for the skill.
- **Testing & Evaluation**: When you want to verify that the skill actually works as intended.
- **Iteration & Improvement**: When you have feedback or data and need to refine the skill.

## Core Concepts

### The Skill Cycle
1.  **Drafting**: Initial research and writing of the `SKILL.md`.
2.  **Testing**: Running the agent with the skill against a set of test cases.
3.  **Evaluating**: Comparing results against a baseline (no skill) and gathering user feedback.
4.  **Refining**: Updating the skill based on findings and repeating the cycle.

### File Structure
A skill folder should typically contain:
- `SKILL.md`: The main instruction file and frontmatter.
- `scripts/`: Helper scripts for testing or automation.
- `examples/`: Reference implementations and usage patterns.
- `resources/`: Additional files, templates, or assets.

### Writing Patterns
- **Actionable Instructions**: Give clear, step-by-step guidance.
- **Explain the "Why"**: Don't just give rigid "MUSTs"; explain the rationale so the agent can adapt.
- **Examples**: Use code blocks and "Good/Bad" examples to illustrate points.
- **Constraints**: Define clear boundaries for what the skill should and should not do.

## Instructions

### 1. Capture Intent
- Identify the core problem the skill solves.
- Define the target user and their typical tasks.
- List key features and success criteria.

### 2. Research & Knowledge Gathering
- Use search tools to find official documentation, best practices, and common pitfalls.
- Read through relevant codebases or articles.
- Synthesize the information into a structured format.

### 3. Write SKILL.md
- **Frontmatter**: Include a clear `name` and a `description` optimized for triggering.
- **Sections**: Use standard sections like `# Introduction`, `## When to Use`, `## Core Concepts`, `## Instructions`, `## Constraints`, and `## References`.
- **Formatting**: Use GitHub-flavored Markdown. Keep lines short and avoid deep nesting.

### 4. Testing & Evaluation
- **Create Test Cases**: Define at least 5-10 realistic scenarios.
- **Run Baselines**: Run the agent without the skill on these scenarios to establish a starting point.
- **Run with Skill**: Run the agent with the new skill on the same scenarios.
- **Compare**: Analyze the difference in quality, accuracy, and efficiency.

### 5. Iteration Loop
- Gather user feedback on the results.
- Identify specific areas for improvement (e.g., missed edge cases, confusing instructions).
- Update the `SKILL.md` and repeat the testing process.
- **Optimization**: Use the "Description Optimization" process to ensure the skill triggers correctly.

## Description Optimization
The description in the frontmatter is what Claude uses to decide if a skill is needed.

### Step 1: Generate Trigger Eval Queries
Create 20 realistic queries (10 should-trigger, 10 should-not-trigger/near-misses). Focus on edge cases and realistic user speech.

### Step 2: Run Optimization Loop
Use automated scripts (if available) to evaluate the current description and suggest improvements based on failures.

### Step 3: Apply Result
Update the `SKILL.md` frontmatter with the best-performing description.

## Constraints
- **NEVER** create skills with malware, exploit code, or security-compromising content.
- **NEVER** create misleading skills or skills for unauthorized data access.
- **ALWAYS** use `eval-viewer` (if available) to present results to the user.
- **ALWAYS** run both with-skill and baseline tests in the same turn for fair comparison.
- **ALWAYS** keep `SKILL.md` under 500 lines; use reference files for overflow content.
- **ALWAYS** generalize from feedback—avoid overfitting to specific test cases.

## References
- Anthropic Skills Repository: [https://github.com/anthropics/skills](https://github.com/anthropics/skills)
- Agent Skills Specification: [https://agentskills.io/specification](https://agentskills.io/specification)
- Claude Skills Documentation: [https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview](https://docs.claude.com/en/docs/agents-and-tools/agent-skills/overview)
