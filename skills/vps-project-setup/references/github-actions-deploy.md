# GitHub Actions Auto-Deploy to VPS

## Prerequisites
1. SSH access to your VPS
2. An SSH key pair (generate with `ssh-keygen -t ed25519`)
3. Public key added to `~/.ssh/authorized_keys` on the VPS
4. Private key added as a GitHub Secret (`VPS_SSH_KEY`)

## Add GitHub Secrets
In your repo: Settings → Secrets and variables → Actions → New repository secret

| Secret | Value |
|---|---|
| `VPS_HOST` | Your VPS IP or domain |
| `VPS_USER` | SSH username (e.g. `ubuntu`) |
| `VPS_SSH_KEY` | Contents of your private key (`~/.ssh/id_ed25519`) |

## Sample Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to VPS

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Deploy via SSH
        uses: appleboy/ssh-action@v1.0.0
        with:
          host: ${{ secrets.VPS_HOST }}
          username: ${{ secrets.VPS_USER }}
          key: ${{ secrets.VPS_SSH_KEY }}
          script: |
            cd ~/project-folder
            git pull origin main
            npm install --production
            npm run build
            pm2 restart my-app
            pm2 save
```

## Notes
- Replace `project-folder` and `my-app` with your actual values
- For Python: replace npm commands with `pip install -r requirements.txt` and `pm2 restart app`
- The `pm2 save` ensures the process list is preserved across reboots
