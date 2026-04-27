# Spec Interpretation Guide

## Reading `lscpu`
- `CPU(s)`: total virtual cores available
- `Thread(s) per core: 1` → no hyperthreading, 1 core = 1 thread
- `Hypervisor vendor: KVM` → this is a VPS, not bare metal
- `BogoMIPS` → rough speed indicator, not directly comparable across architectures

## Reading `free -h`
```
              total   used   free   shared  buff/cache  available
Mem:           15Gi   1.9Gi  2.6Gi   32Mi      11Gi       13Gi
```
- **available** is what actually matters — not `free`. Linux uses spare RAM as disk cache (buff/cache), which is instantly reclaimed by apps.
- `Swap: 0B` → no swap configured. Fine if RAM is sufficient; risky if RAM-heavy workloads spike.

## Reading `df -h`
```
Filesystem   Size  Used  Avail  Use%  Mounted on
overlay      126G   11G   109G   10%  /
```
- `overlay` filesystem = running inside Docker or LXC container
- Root filesystem (`/`) is the one that matters for app storage

## Recommended Minimums by Stack

| Stack | Min RAM | Min Disk | Notes |
|---|---|---|---|
| Node.js (small app) | 512MB | 5GB | Build may need 1GB temporarily |
| Next.js (prod build) | 1GB | 10GB | Build is RAM-heavy |
| Python/Flask/FastAPI | 256MB | 2GB | Very lightweight |
| PostgreSQL | 512MB | 10GB+ | Depends on dataset |
| MySQL/MariaDB | 512MB | 10GB+ | Depends on dataset |
| Redis | 256MB | 1GB | RAM-based, size = dataset |
| Docker (any app) | +512MB overhead | +5GB overhead | Containers add overhead |
