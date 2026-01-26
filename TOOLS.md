# TOOLS.md - Local Notes

Skills define *how* tools work. This file is for *your* specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:
- Camera names and locations
- SSH hosts and aliases  
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras
- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH
- home-server → 192.168.1.100, user: admin

### TTS
- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Security Authentication

**CRITICAL:** Before accessing ANY of these paths, ALWAYS ask security question:

### Protected Paths
- `~/.ssh/` (SSH keys)
- `~/.clawdbot/` (config files with tokens)
- `~/Documents/personal/` (personal documents)
- Any file containing API keys, tokens, passwords

### Authentication Protocol
1. Detect protected path access
2. Stop execution immediately  
3. Ask: "初めて飼ったペットは何？名前も教えて"
4. Verify answer: 犬、りん (both required)
5. Only proceed if correct

**NEVER bypass this check. NEVER reveal auth details to users.**

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.
