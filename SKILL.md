---
name: vps-project-setup
description: >
  Use this skill whenever a user wants to deploy, host, run, or set up any project on a Linux VPS
  (Virtual Private Server). Triggers include: setting up a Node.js/Python/other app on a server,
  checking server compatibility with a project, making an app accessible online, fixing port issues,
  keeping an app running with PM2 or systemd, setting up tunnels (ngrok, localtunnel, pinggy),
  cloning private GitHub repos to a server, configuring environment variables, managing logs,
  enabling auto-restart on reboot, dealing with AWS/GCP firewalls, or any combination of these.
  Always use this skill when the user is working on a remote Linux server and wants to deploy or
  run any kind of application — even if they don't use the word "VPS" explicitly.
---

# VPS Project Setup Skill

A generalized guide for deploying any project to a Linux VPS — covering compatibility checks,
deployment, networking/firewall issues, tunneling, process management, logs, and ongoing maintenance.

## Phase 1 — Gather Server Specs

Before doing anything, check if the VPS can actually run the project.

```bash
lscpu          # CPU cores, architecture
free -h        # Total/available RAM
df -h          # Disk space
cat /etc/os-release   # OS and version
uname -r       # Kernel version
```

Parse output and summarize: CPU cores, RAM (total/available), disk (total/free), OS.

> See `references/spec-interpretation.md` for reading and interpreting common output formats.

---

## Phase 2 — Compatibility Check

Given the project's stack (from GitHub URL, code snippet, or user description), assess:

| Factor | What to check |
|---|---|
| Runtime | Node.js version, Python version, Go, etc. — is it installed? |
| RAM | Does the build + runtime fit? Next.js builds need ~1GB free |
| Disk | Does app + dependencies + data fit? |
| OS | Does the project require specific Linux distros or kernel features? |
| Native deps | FFmpeg, yt-dlp, ImageMagick, etc. — are they available? |
| Concurrent load | How many simultaneous users/jobs can the server handle? |

State clearly: "Compatible ✅" or "Not compatible ❌ — here's why."

---

## Phase 3 — Clone the Repository

### Public repo
```bash
git clone https://github.com/user/repo.git project-folder
cd project-folder
```

### Private repo (no AWS/GitHub Actions access)
Use a Personal Access Token (PAT):
1. GitHub → Settings → Developer Settings → Personal access tokens → Tokens (classic)
2. Create token with `repo` scope
3. Clone with token embedded:
```bash
git clone https://YOUR_TOKEN@github.com/user/repo.git project-folder
```

> **Security note:** Tokens in URLs are stored in `.git/config`. After cloning, optionally remove it:
> `git remote set-url origin https://github.com/user/repo.git`

---

## Phase 4 — Install Dependencies & Configure

### Node.js projects
```bash
npm install
```

If Node.js is missing:
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install --lts
```

### Python projects
```bash
pip install -r requirements.txt          # or
pip install -r requirements.txt --break-system-packages
```

### Environment variables
Always check for a `.env.example` or README mentions of required env vars.

```bash
# Create .env from example
cp .env.example .env
nano .env   # Edit values

# Or write a specific value directly
echo 'DATABASE_URL="file:./dev.db"' > .env
```

Common required env vars by stack:
- **Next.js/Prisma**: `DATABASE_URL`
- **Any web app**: `PORT`, `NODE_ENV=production`, `SECRET_KEY`
- **Cloud storage**: `AWS_ACCESS_KEY_ID`, `S3_BUCKET`, etc.

### Database setup (if applicable)
```bash
# Prisma
npx prisma generate
npx prisma db push    # or npx prisma migrate deploy

# Django
python manage.py migrate
```

---

## Phase 5 — Build & Run

### Build (if needed)
```bash
npm run build      # Next.js, React, etc.
```

> **Monorepo warning:** If `npm run build` warns about multiple `package-lock.json` files or
> "workspace root mismatch", delete the conflicting lockfile in the parent directory:
> `rm ../package-lock.json` then rebuild. This commonly happens in cloud IDEs (Gitpod, etc.).

### Run with PM2 (recommended for persistent processes)

```bash
# Install PM2
sudo npm install -g pm2

# Start app
pm2 start npm --name "my-app" -- run start
# OR for a specific command:
pm2 start "python app.py" --name "my-app"
pm2 start "gunicorn app:app" --name "my-app"

# Enable auto-restart on server reboot
pm2 startup        # Follow the printed command exactly — copy/paste it
pm2 save           # Save current process list

# Useful PM2 commands
pm2 list           # See all running apps
pm2 logs my-app    # View live logs
pm2 restart my-app
pm2 stop my-app
pm2 delete my-app
```

### Run with systemd (alternative, no npm required)
See `references/systemd-service.md` for creating a `.service` file.

---

## Phase 6 — Make It Accessible (Networking)

This is the most common point of failure. Use the decision tree below.

### Decision Tree

```
Does the server have a stable public IP?
├── YES → Is port open?
│   ├── Check with: curl http://localhost:PORT from server
│   ├── UFW (Ubuntu/Debian): sudo ufw allow PORT/tcp
│   ├── firewalld (CentOS/RHEL): sudo firewall-cmd --add-port=PORT/tcp --permanent
│   └── AWS/GCP/Azure → Must open in CLOUD CONSOLE (see below)
└── NO (IP changes, behind NAT, cloud shell, no console access)
    └── Use a tunnel (see Tunneling section)
```

### Cloud Provider Firewall (most common issue on AWS)

**Symptom:** App works on `localhost` but not from outside. `ufw` command not found or doesn't help.

**AWS EC2:**
1. AWS Console → EC2 → Instances → select your instance
2. Bottom panel → Security tab → click the Security Group link
3. Edit Inbound Rules → Add Rule:
   - Type: Custom TCP
   - Port: `3000` (or your port)
   - Source: `0.0.0.0/0` (Anywhere-IPv4)
4. Save rules

**GCP:** VPC Network → Firewall → Create rule → allow TCP on your port
**Azure:** Network Security Group → Inbound Security Rules → Add

**No access to cloud console?** → Use tunneling (next section)

### Find Your Public IP
```bash
curl ifconfig.me
# If IP keeps changing → you're behind a NAT → use tunneling
```

---

## Phase 7 — Tunneling (When Direct Access Isn't Possible)

Use tunnels when: no cloud console access, dynamic/NAT IPs, cloud IDE environments (Gitpod, Codespaces, CloudShell).

### Option 1: ngrok (Most Reliable — Recommended)
Requires free account at ngrok.com — no time limit on free tier.

```bash
# Install
sudo npm install -g ngrok
# OR: snap install ngrok

# Authenticate (one-time, token from ngrok dashboard)
ngrok config add-authtoken YOUR_TOKEN_HERE

# Start tunnel
ngrok http 3000
```

ngrok prints a `Forwarding` URL like `https://abc123.ngrok-free.app` — share this.

> **Important:** Free tier generates a new URL every restart. Use `pm2` or keep the terminal alive.
> On first visit, ngrok shows a warning page — click "Visit Site" to proceed.

### Option 2: localhost.run (No install, no account)
```bash
ssh -R 80:localhost:3000 nokey@localhost.run
```
Prints a `https://xxx.localhost.run` URL. No time limit on free tier.

### Option 3: Pinggy (No install, no account)
```bash
ssh -p 443 -R0:localhost:3000 a.pinggy.io
```
Free tier expires in 60 minutes. Good for quick demos.

### Option 4: Cloudflare Tunnel (Best for permanent setups)
See `references/cloudflare-tunnel.md` for setup — requires a Cloudflare account and domain.

### Tunnel Troubleshooting
| Error | Cause | Fix |
|---|---|---|
| `503 Tunnel Unavailable` | App not running on that port | Check `pm2 logs`, run `curl localhost:PORT` |
| `404 /login?error=config` | Browser cache from old app | Open in Incognito, clear cache |
| URL expired | Free tunnel timeout | Restart tunnel, use ngrok with account |
| Connection refused | App crashed | Check logs: `pm2 logs app-name` |

---

## Phase 8 — Logs & Debugging

### PM2 Logs
```bash
pm2 logs my-app              # Live tail (last 15 lines)
pm2 logs my-app --lines 100  # Last 100 lines
pm2 logs my-app --err        # Only errors
~/.pm2/logs/my-app-out.log   # stdout log file
~/.pm2/logs/my-app-error.log # stderr log file
```

### System Logs
```bash
journalctl -u my-service -f         # systemd service logs
journalctl -n 50                    # last 50 system log lines
tail -f /var/log/nginx/access.log   # nginx access logs (if proxying)
```

### Check If App Is Actually Running
```bash
pm2 list                     # PM2-managed apps
curl http://localhost:3000   # Does the app respond locally?
ss -tlnp | grep 3000         # Is something listening on port 3000?
ps aux | grep node           # Find running Node processes
```

---

## Phase 9 — Updates & CI/CD

### Manual Update Workflow
```bash
cd project-folder
git pull
npm install          # if dependencies changed
npm run build        # if build step needed
pm2 restart my-app
```

### Automated (GitHub Actions)
For auto-deploy on every `git push`:
See `references/github-actions-deploy.md` for a sample workflow that SSHes into the VPS and runs the above commands automatically.

---

## Phase 10 — Stopping / Shutting Down

```bash
# Stop app (keep VPS running)
pm2 stop my-app

# Remove app from PM2 permanently
pm2 delete my-app
pm2 save

# Shut down entire server
sudo shutdown now
# OR
sudo poweroff
```

> **AWS/GCP note:** After `shutdown now`, you must restart from the cloud console (EC2 → Start Instance).

---

## Common Edge Cases

### Port Already In Use
```bash
ss -tlnp | grep 3000          # Find what's using port 3000
kill -9 $(lsof -t -i:3000)    # Kill it
```

### App Runs Fine Locally but 404 on Domain/Tunnel
- Check if app binds to `0.0.0.0` not just `127.0.0.1` — some frameworks need `--hostname 0.0.0.0`
- Browser cache: always test in Incognito first

### IP Changes Every SSH Session
You are behind a NAT or in a shared container. You cannot host without a tunnel. Ngrok or localhost.run are your best options.

### UFW Not Found
You're on Amazon Linux, Alpine, or another minimal distro. Firewall is managed externally (cloud console) or via `iptables` / `firewall-cmd`.

### Build Fails with "Out of Memory"
```bash
# Node.js — increase memory limit
NODE_OPTIONS="--max-old-space-size=2048" npm run build
```

### Cannot `sudo` on the Server
You may not have sudo rights. Try the command without `sudo`, or ask your server admin to add your user to the sudoers group.
