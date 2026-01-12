# ALauncher CLI Guide

Complete guide for using the ALauncher command-line interface tools.

## Table of Contents

- [Overview](#overview)
- [Starting CLI](#starting-cli)
- [Commands Reference](#commands-reference)
  - [System Commands](#system-commands)
  - [User Management](#user-management)
  - [Profile Management](#profile-management)
  - [Client Download](#client-download)
  - [File Management](#file-management)
  - [Assets Management](#assets-management)
  - [Version Management](#version-management)
  - [Launcher Management](#launcher-management)
  - [Notifications](#notifications)
  - [Statistics](#statistics)
- [Common Workflows](#common-workflows)

---

## Overview

ALauncher includes a powerful CLI for managing users, profiles, files, and game clients. The CLI provides interactive commands with confirmation prompts and progress indicators.

### Features

- Interactive command-line interface
- Tab completion support
- Colored output for better readability
- Progress bars for long operations
- Confirmation prompts for destructive operations
- Table-formatted data display

---

## Starting CLI

### From Backend Directory

```bash
cd packages/backend
npm run cli
```

### Available Shortcuts

Once in the CLI, you can use these shortcuts:

| Shortcut | Action |
|----------|--------|
| `exit` / `quit` | Close the CLI |
| `clear` / `cls` | Clear console |
| `help` | Show all commands |
| `help <command>` | Show detailed help for command |
| `status` | Show system status |
| `dashboard` | Show system dashboard |

---

## Commands Reference

### System Commands

#### `help [command]`

Show help for all commands or a specific command.

```bash
help                    # Show all commands
help profile            # Show profile command help
help user               # Show user command help
```

#### `status`

Display system status and statistics.

```bash
status
```

**Output:**
- Database connection status
- User count
- Profile count
- Version count
- Memory usage
- System uptime

#### `dashboard`

Show comprehensive system dashboard.

```bash
dashboard
```

#### `clear` / `cls`

Clear the console screen.

```bash
clear
# or
cls
```

---

### User Management

#### `user list [--all]`

List all users in the system.

```bash
user list               # Show active users only
user list --all         # Include banned users
```

**Output columns:** Username, Email, Role, Banned, Created, Last Login

#### `user create <username> <password> [--email <email>] [--role <USER|ADMIN>]`

Create a new user account.

```bash
user create testuser password123
user create admin admin123 --role ADMIN
user create player pass123 --email player@example.com --role USER
```

**Notes:**
- Password is hashed automatically using bcrypt
- UUID is generated automatically for Minecraft
- Default role is USER if not specified

#### `user delete <username>`

Delete a user (requires confirmation).

```bash
user delete testuser
```

#### `user ban <username> [--reason <reason>]`

Ban a user account.

```bash
user ban testuser
user ban testuser --reason "Violation of server rules"
```

#### `user unban <username>`

Unban a user account.

```bash
user unban testuser
```

#### `user role <username> <USER|ADMIN>`

Change user role.

```bash
user role testuser ADMIN
user role testuser USER
```

#### `user info <username>`

Show detailed user information.

```bash
user info testuser
```

**Output:**
- Username, ID, UUID
- Email address
- Role
- Ban status and reason
- Account creation date
- Last login time
- Active sessions count
- Notifications count

---

### Profile Management

#### `profile list [--all]`

List all client profiles.

```bash
profile list            # Show enabled profiles only
profile list --all      # Include disabled profiles
```

**Output columns:** ID, Title, Version, Server, Enabled, Sort, Created

#### `profile info <id>`

Show detailed profile information.

```bash
profile info abc12345-def6-7890-ghij-klmnopqrstuv
```

**Output:**
- Profile ID and title
- Minecraft version
- Server address and port
- Main class and JVM arguments
- Client directory
- Asset index
- Tags (VANILLA, MODS, AUTO-DOWNLOADED)

#### `profile add <title> <loader> <version> [serverAddress] [serverPort]`

Create a new client profile.

```bash
# Basic profiles
profile add "Vanilla 1.21" Vanilla 1.21.0
profile add "Forge 1.12.2" Forge 1.12.2
profile add "Fabric 1.20.1" Fabric 1.20.1

# With server configuration
profile add "My Server" Fabric 1.20.1 192.168.1.100 25565
```

**Loaders:**
- `Vanilla` - Official Minecraft client
- `Forge` - Minecraft Forge mod loader
- `Fabric` - Fabric mod loader

**Automatic configuration:**
- JVM version is set based on Minecraft version
- Main class and arguments are configured per loader
- Assets are downloaded automatically
- Proper launch arguments are generated

#### `profile sync <id>`

Sync client files for a profile from the updates directory.

```bash
profile sync abc12345-def6-7890-ghij-klmnopqrstuv
```

**What it does:**
- Scans `updates/<clientDirectory>/` for files
- Adds new files to database
- Updates existing files with new hashes
- Verifies file integrity

#### `profile set-jvm <id> <version>`

Set Java version for a profile.

```bash
profile set-jvm abc12345-def6-7890-ghij-klmnopqrstuv 8
profile set-jvm abc12345-def6-7890-ghij-klmnopqrstuv 17
```

**Valid versions:** 8, 11, 16, 17, 21

#### `profile enable <id>`

Enable a profile.

```bash
profile enable abc12345-def6-7890-ghij-klmnopqrstuv
```

#### `profile disable <id>`

Disable a profile.

```bash
profile disable abc12345-def6-7890-ghij-klmnopqrstuv
```

#### `profile delete <id>`

Delete a profile (requires confirmation).

```bash
profile delete abc12345-def6-7890-ghij-klmnopqrstuv
```

---

### Client Download

#### `client download <title> <loader> <version> [serverAddress] [serverPort]`

Download client from official sources and create profile automatically.

```bash
# Download and setup clients
client download "My Vanilla" Vanilla 1.21.0
client download "Forge Server" Forge 1.12.2
client download "Fabric Client" Fabric 1.20.1

# With server configuration
client download "My Server" Vanilla 1.20.4 192.168.1.100 25565
```

**What it does:**
1. Downloads client JAR from official sources
2. Downloads and installs Forge/Fabric if specified
3. Creates profile with proper configuration
4. Downloads required assets
5. Sets up proper launch arguments

**Progress indicators show:**
- Download stage
- Progress percentage
- Current file being downloaded
- Speed and elapsed time

#### `client list`

List all auto-downloaded clients.

```bash
client list
```

**Output columns:** ID, Title, Version, Directory, Status, Created

---

### File Management

#### `file sync <version|clientDirectory>`

Sync files for a version or specific client directory.

```bash
# Sync by version
file sync 1.12.2

# Sync by client directory
file sync hitech
file sync vanilla-1.21
```

**What it does:**
- Scans updates directory for files
- Calculates SHA-256 hashes
- Adds/updates files in database
- Tracks file sizes and types

#### `file verify <version>`

Verify integrity of all files for a version.

```bash
file verify 1.12.2
```

**Output:**
- Total files checked
- Valid files count
- Invalid files count

#### `file stats <version>`

Show sync statistics for a version.

```bash
file stats 1.12.2
```

**Output:**
- Total files
- Verified files
- Failed files
- Last sync timestamp

#### `file list <version>`

List all files for a version.

```bash
file list 1.12.2
```

**Output columns:** Path, Type, Size, Verified, Status

#### `file delete <version> <filePath>`

Delete a specific file from database.

```bash
file delete 1.12.2 libraries/net/minecraftforge/forge/1.12.2-14.23.5.2860/forge-1.12.2-14.23.5.2860.jar
```

**Note:** File must be deleted from disk first.

#### `file delete-all <version>`

Delete all files for a version from database (requires confirmation).

```bash
file delete-all 1.12.2
```

#### `file cleanup`

Remove files with empty clientDirectory from database.

```bash
file cleanup
```

---

### Assets Management

#### `assets download <version>`

Download Minecraft assets for a specific version.

```bash
assets download 1.12.2
assets download 1.20.4
assets download 1.21.0
```

**What it does:**
- Fetches asset index from Mojang
- Downloads all required assets
- Stores in `updates/assets/<assetIndex>/`
- Shows progress bar with speed indicator

**Progress information:**
- Current/total files
- Percentage complete
- Download speed
- Elapsed time
- Current file name

#### `assets list`

List all downloaded asset indexes.

```bash
assets list
```

**Output columns:** Asset Index, Files, Size, Status

#### `assets check <version>`

Check if assets are downloaded for a version.

```bash
assets check 1.12.2
```

**Output:**
- Asset index for version
- Whether index file exists
- Number of asset files
- Assets directory location

---

### Version Management

#### `version list [--all]`

List all client versions.

```bash
version list            # Show enabled versions only
version list --all      # Include disabled versions
```

**Output columns:** Version, Title, Files, Default, Enabled, Created

#### `version info <version>`

Show detailed version information.

```bash
version info 1.12.2
```

**Output:**
- Version number and title
- Main class
- JVM version requirement
- Client JAR path and size
- Total file count
- File type breakdown

#### `version sync <version>`

Sync files for a version from updates directory.

```bash
version sync 1.12.2
```

#### `version verify <version>`

Verify integrity of all files for a version.

```bash
version verify 1.12.2
```

#### `version stats <version>`

Show sync statistics for a version.

```bash
version stats 1.12.2
```

#### `version enable <version>`

Enable a version.

```bash
version enable 1.12.2
```

#### `version disable <version>`

Disable a version.

```bash
version disable 1.12.2
```

---

### Launcher Management

#### `launcher list [--all]`

List all launcher versions.

```bash
launcher list            # Show enabled versions only
launcher list --all      # Include disabled versions
```

**Output columns:** Version, Size, Required, Enabled, URL, Created

#### `launcher info <version>`

Show launcher version information.

```bash
launcher info 1.0.224
```

**Output:**
- Version number
- Download URL
- File size and hash
- Required update flag
- Release notes
- Creation date

#### `launcher create <version> [--url <url>] [--required]`

Create a new launcher version.

```bash
launcher create 1.0.225
launcher create 1.0.225 --url http://example.com/launcher.exe --required
```

#### `launcher enable <version>`

Enable a launcher version.

```bash
launcher enable 1.0.225
```

#### `launcher disable <version>`

Disable a launcher version.

```bash
launcher disable 1.0.224
```

#### `launcher delete <version>`

Delete a launcher version (requires confirmation).

```bash
launcher delete 1.0.224
```

---

### Notifications

#### `notify send <username> <type> <title> <message>`

Send notification to a specific user.

```bash
notify send testuser LAUNCHER_UPDATE_AVAILABLE "Update Available" "New version 1.0.225 is available"
notify send testuser SYSTEM_MESSAGE "Maintenance" "Server maintenance in 1 hour"
```

**Available types:**
- `LAUNCHER_UPDATE_AVAILABLE`
- `SYSTEM_MESSAGE`
- `PROFILE_UPDATE`
- `GAME_CRASH`
- `DOWNLOAD_COMPLETE`

#### `notify send-all <type> <title> <message>`

Send notification to all users.

```bash
notify send-all SYSTEM_MESSAGE "Server Restart" "Server will restart in 30 minutes"
```

#### `notify list <username> [--unread]`

List notifications for a user.

```bash
notify list testuser
notify list testuser --unread
```

**Output columns:** Type, Title, Read, Created

#### `notify clear <username>`

Clear all notifications for a user.

```bash
notify clear testuser
```

#### `notify types`

List all available notification types.

```bash
notify types
```

---

### Statistics

#### `stats users`

Show user statistics.

```bash
stats users
```

**Output:**
- Total users
- Active users (last 30 days)
- Banned users
- Administrators count
- Regular users count

#### `stats launches [--days <n>]`

Show game launch statistics.

```bash
stats launches
stats launches --days 7
stats launches --days 30
```

**Output:**
- Total launches
- Top profiles by launches
- Top versions by launches

#### `stats crashes [--days <n>]`

Show crash statistics.

```bash
stats crashes
stats crashes --days 7
```

**Output:**
- Total crashes
- Top profiles by crashes
- Recent crashes with details

#### `stats sessions [--days <n>]`

Show game session statistics.

```bash
stats sessions
stats sessions --days 30
```

**Output:**
- Total sessions
- Active sessions
- Completed sessions
- Average session duration

#### `stats errors [--days <n>]`

Show launcher error statistics.

```bash
stats errors
stats errors --days 7
```

**Output:**
- Total errors
- Errors by type
- Recent errors with details

---

## Common Workflows

### Setting Up a New Forge Server

```bash
# 1. Download Forge client with auto-configuration
client download "My Forge Server" Forge 1.12.2

# 2. Add mods to the client directory
# (manually copy mods to updates/<clientDirectory>/mods/)

# 3. Sync files to database
profile sync <profile-id-from-step-1>

# 4. Verify integrity
file verify <clientDirectory>
```

### Creating a Vanilla Profile

```bash
# 1. Create profile
profile add "Vanilla 1.21" Vanilla 1.21.0

# 2. Download client JAR manually to updates/<clientDirectory>/client.jar

# 3. Sync files
profile sync <profile-id>

# 4. Download assets
assets download 1.21.0
```

### Managing Users

```bash
# Create admin user
user create admin securePass123 --role ADMIN --email admin@example.com

# Create regular user
user create player pass123

# Ban problematic user
user ban badplayer --reason "Griefing"

# Unban user
user unban badplayer

# Check user info
user info admin
```

### Monitoring System Health

```bash
# Check overall status
status

# View dashboard
dashboard

# Check recent crashes
stats crashes --days 7

# Check launcher errors
stats errors --days 7

# View active sessions
stats sessions
```

### Bulk Operations

```bash
# Notify all users of maintenance
notify send-all SYSTEM_MESSAGE "Maintenance" "Server downtime in 1 hour"

# Cleanup orphaned files
file cleanup

# Verify all versions
version verify 1.12.2
version verify 1.20.4
```

---

## Tips and Best Practices

1. **Always verify files after syncing** - Use `file verify` to ensure integrity
2. **Use descriptive profile titles** - Helps identify profiles in lists
3. **Set appropriate JVM versions** - Match JVM to Minecraft version requirements
4. **Download assets during setup** - Use `assets download` to avoid delays during game launch
5. **Monitor statistics regularly** - Use `stats` commands to track usage and issues
6. **Test profiles before enabling** - Disable profiles while testing, enable when ready
7. **Use `--all` flag carefully** - Shows disabled/banned items that may need attention
