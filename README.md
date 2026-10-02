# Agent Skills by Dev-Muhammad-Junaid

A collection of reusable agent skills for AI coding assistants — install them into Cursor, Copilot, Antigravity, Cline, and more using the [Skills CLI](https://skills.sh).

## What are Skills?

Skills are modular packages that extend your AI agent's capabilities with specialized knowledge, workflows, and tools. Once installed, your agent automatically uses the right skill at the right time.

## Available Skills

| Skill | Description | Install |
|---|---|---|
| `chrome-extension-launch` | End-to-end Chrome extension playbook: theme from your design system, MV3 build, live + e2e verification, Web Store policy compliance and listing copy, light/dark store assets (also from React/Next UIs), dashboard publishing and GA4, a promo video with its own motion and sound per extension, YouTube and social cuts | `npx skills add Dev-Muhammad-Junaid/agent-skills@chrome-extension-launch -g` |
| `safari-extension-launch` | Take an MV3 extension to Safari on the Mac App Store: Safari compatibility fixes, Xcode wrapper with signing and a styled setup app, A-to-Z testing (WebKit suite, Chromium, live signed-in checks, guided Safari pass), App Review guideline pre-check with prepared replies, Mac screenshots, App Store Connect setup and build uploads | `npx skills add Dev-Muhammad-Junaid/agent-skills@safari-extension-launch -g` |
| `vps-project-setup` | Deploy any project to a Linux VPS — covers compatibility checks, PM2, tunneling, firewalls, CI/CD, and more | `npx skills add Dev-Muhammad-Junaid/agent-skills@vps-project-setup -g` |

## Installation

```bash
npx skills add Dev-Muhammad-Junaid/agent-skills@<skill-name> -g
