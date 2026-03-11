---
name: bash-syntax-guide
description: >
  Bash syntax reference for AI agents. Use this skill whenever generating shell commands
  or scripts, automating Linux/macOS tasks, working in CI/CD pipelines, or operating in
  a Bash/sh/zsh terminal — even for simple commands, because quoting and error handling
  mistakes are the #1 source of agent-generated script failures.
---

# Bash Syntax Guide

This skill provides expert knowledge for writing and executing Bash commands and scripts. Bash (Bourne Again SHell) is the default shell for most Linux distributions and macOS, widely used for automation, system administration, and CI/CD workflows.

## When to use

- Agent needs to execute commands in a Bash/sh/zsh terminal
- Generating .sh scripts or inline shell commands
- Automating Linux/macOS system administration
- Working with CI/CD pipelines (GitHub Actions, GitLab CI, Jenkins)
- Agent operates inside Unix-like environments (containers, WSL, cloud VMs)

## Core Syntax Rules

### Shebang & Script Setup

```bash
#!/usr/bin/env bash
# ✅ Portable shebang — works across systems

set -euo pipefail
# -e  → exit on error
# -u  → treat unset variables as errors
# -o pipefail → catch errors in piped commands

# ❌ NEVER omit set -euo pipefail in scripts — silent failures are the #1 agent mistake
```

### Comments

```bash
# Single line comment

: '
Multi-line comment
using null command
'
```

### Command Separators

```bash
# Newlines separate commands
echo "first"
echo "second"

# Semicolons for one-liners
echo "first"; echo "second"

# && — run next only if previous succeeded
mkdir build && cd build

# || — run next only if previous failed
cd /tmp || exit 1

# & — run in background
long_process &
```

## Quoting — Critical for Agents

### Single vs Double Quotes

```bash
name="World"

# Double quotes → variable expansion + some escapes
echo "Hello, $name"          # Output: Hello, World
echo "Tab:\tline"            # Output: Tab:\tline (no interpretation!)
echo -e "Tab:\tline"         # Output: Tab:    line (with -e flag)

# Single quotes → completely literal
echo 'Hello, $name'          # Output: Hello, $name
echo 'No escapes: \n \t'    # Output: No escapes: \n \t

# $'...' — ANSI-C quoting (supports \n, \t)
echo $'Line1\nLine2'         # Output: Line1 (newline) Line2
```

### When to Use Which Quotes

```bash
# ✅ Double quotes — when you need variable expansion
echo "Processing file: $filename"

# ✅ Single quotes — for literal strings, regex, jq filters
grep '^ERROR' logfile
jq '.data[] | .name' response.json

# ✅ No quotes — ONLY for simple assignments or numeric comparisons
count=42

# ❌ NEVER leave variables unquoted in commands
rm $file          # ❌ breaks on spaces, globs
rm "$file"        # ✅ safe
```

> [!IMPORTANT]
> **AGENT RULE:** ALWAYS double-quote variable expansions: `"$var"`, `"${var}"`, `"$(cmd)"`. Unquoted variables are the #1 source of Bash bugs.

### Escaping

```bash
# Backslash escapes single characters
echo "Price is \$100"        # Output: Price is $100
echo "She said \"hello\""  # Output: She said "hello"

# Inside single quotes — NO escaping possible
echo 'Can'\''t stop'         # Output: Can't stop (end-quote, escaped quote, reopen)

# Inside double quotes — only these need escaping: $ ` " \ !
echo "Backtick: \`cmd\`"    # Escaped backtick
```

## Variables

### Declaration & Assignment

```bash
# ❌ NEVER put spaces around =
var = "value"     # ❌ runs 'var' as command with args '=' and 'value'
var="value"        # ✅ correct assignment

# Types
str="hello"
num=42
arr=("one" "two" "three")
declare -A map=([key1]="val1" [key2]="val2")

# Read-only
readonly API_URL="https://api.example.com"

# Export to child processes
export MY_VAR="value"
```

### Variable Expansion

```bash
# Basic
echo "$var"
echo "${var}"          # Explicit boundary: ${var}iable

# Default values
${var:-default}         # Use 'default' if var is unset or empty
${var:=default}         # Set var to 'default' if unset or empty
${var:+alternate}       # Use 'alternate' if var IS set
${var:?"error msg"}    # Exit with error if var is unset

# String operations
${#var}                 # String length
${var^^}                # Uppercase
${var,,}                # Lowercase
${var%.*}               # Remove shortest suffix match (file → strip extension)
${var##*/}              # Remove longest prefix match (path → basename)
${var/old/new}          # Replace first occurrence
${var//old/new}         # Replace all occurrences
```

### Special Variables

```bash
$0             # Script name
$1 $2 ... $9   # Positional parameters
$@             # All parameters (individually quoted)
$*             # All parameters (as single string)
$#             # Number of parameters
$$             # Current PID
$!             # Last background PID
$?             # Exit code of last command
$_             # Last argument of previous command
```

> [!IMPORTANT]
> **AGENT RULE:** Use `"$@"` (quoted) to pass arguments. Never use `$*` unquoted.

## Conditionals

### Test Syntax

```bash
# ✅ Preferred — [[ ]] (Bash-specific, safer)
if [[ "$str" == "hello" ]]; then
    echo "match"
fi

# Legacy — [ ] (POSIX, more portable but fragile)
if [ "$str" = "hello" ]; then
    echo "match"
fi

# ❌ NEVER forget spaces inside brackets
if ["$str" == "hello"]; then    # ❌ syntax error
if [[ "$str" == "hello" ]]; then # ✅ spaces required
```

### String Comparisons

```bash
[[ "$a" == "$b" ]]     # Equal
[[ "$a" != "$b" ]]     # Not equal
[[ "$a" < "$b" ]]      # Less than (lexicographic)
[[ "$a" > "$b" ]]      # Greater than
[[ -z "$a" ]]           # Empty string
[[ -n "$a" ]]           # Non-empty string
[[ "$a" == *.log ]]     # Glob pattern match
[[ "$a" =~ ^[0-9]+$ ]]  # Regex match
```

### Numeric Comparisons

```bash
# Inside [[ ]] — use -eq, -ne, -gt, -lt, -ge, -le
[[ $a -eq $b ]]
[[ $a -gt 10 ]]

# Inside (( )) — use ==, !=, >, <, >=, <=
(( a == b ))
(( a > 10 ))

# ❌ NEVER use == for numbers inside [[ ]] — it's string comparison
[[ 10 == 9 ]]    # ❌ string compare, works but misleading
[[ 10 -eq 9 ]]   # ✅ numeric compare
```

### File Tests

```bash
[[ -f "$file" ]]    # Regular file exists
[[ -d "$dir" ]]     # Directory exists
[[ -e "$path" ]]    # Anything exists
[[ -r "$file" ]]    # Readable
[[ -w "$file" ]]    # Writable
[[ -x "$file" ]]    # Executable
[[ -s "$file" ]]    # Non-empty file
[[ -L "$link" ]]    # Symlink
[[ "$a" -nt "$b" ]] # a newer than b
```

### If/Elif/Else

```bash
if [[ "$status" == "success" ]]; then
    echo "Done"
elif [[ "$status" == "pending" ]]; then
    echo "Waiting..."
else
    echo "Failed: $status"
fi

# One-liner
[[ -f config.yaml ]] && source_config || use_defaults
```

### Case Statement

```bash
case "$action" in
    start|begin)
        start_service
        ;;
    stop)
        stop_service
        ;;
    restart)
        stop_service
        start_service
        ;;
    *)
        echo "Unknown action: $action" >&2
        exit 1
        ;;
esac
```

## Loops

```bash
# For loop — iterate over list
for item in "${arr[@]}"; do
    echo "$item"
done

# For loop — C-style
for (( i=0; i<10; i++ )); do
    echo "$i"
done

# While loop
while IFS= read -r line; do
    echo "$line"
done < "$file"

# Until loop
until [[ "$status" == "ready" ]]; do
    status=$(check_status)
    sleep 1
done

# ❌ NEVER: for i in $(ls *.txt) — breaks on spaces, use glob instead
# ✅ CORRECT: for f in *.txt; do ... done
```

> [!IMPORTANT]
> **AGENT RULE:** When iterating files, use globs (`*.txt`), `find`, or `while read`. Never parse `ls` output.

## Pipelines & Redirection

### Pipes

```bash
# Chain commands — stdout of left feeds stdin of right
cat access.log | grep 'ERROR' | awk '{print $1}' | sort -u

# ✅ Better — useless use of cat
grep 'ERROR' access.log | awk '{print $1}' | sort -u

# Capture pipeline output
result=$(grep 'ERROR' access.log | wc -l)
```

### Redirection

```bash
# stdout to file
echo "data" > output.txt        # Overwrite
echo "more" >> output.txt       # Append

# stderr to file
command 2> errors.log

# Both stdout and stderr
command > all.log 2>&1          # Traditional
command &> all.log              # Bash shorthand

# Discard output
command > /dev/null 2>&1

# stdin from file
while read -r line; do echo "$line"; done < input.txt

# Here document
cat <<EOF
Hello, $name
Line 2
EOF

# Here document — no expansion
cat <<'EOF'
Literal $name
No expansion
EOF

# Here string
grep "pattern" <<< "$string_var"
```

### Process Substitution

```bash
# Use output of command as a file
diff <(sort file1.txt) <(sort file2.txt)

# Feed command output to another command expecting a file
paste <(cut -f1 data.tsv) <(cut -f3 data.tsv)
```

## Functions

```bash
# ✅ Preferred function syntax
my_function() {
    local name="$1"       # ALWAYS use local variables
    local count="${2:-0}" # Default value

    if [[ -z "$name" ]]; then
        echo "Error: name is required" >&2
        return 1
    fi

    echo "$name: $count"
    return 0
}

# Call
result=$(my_function "Alice" 42)

# ❌ NEVER use global variables inside functions unless intentional
# ❌ NEVER forget to check required arguments
```

> [!IMPORTANT]
> **AGENT RULE:** Always use `local` for function variables. Global variable leaks cause subtle bugs in scripts.

## Error Handling

### set Options

```bash
set -e          # Exit on any error
set -u          # Error on undefined variables
set -o pipefail # Catch pipe failures
set -x          # Debug mode — print each command (remove in production)

# Combined
set -euo pipefail
```

### Trap

```bash
# Cleanup on exit
cleanup() {
    rm -f "$tmpfile"
    echo "Cleaned up"
}
trap cleanup EXIT

# Handle specific signals
trap 'echo "Interrupted" >&2; exit 130' INT TERM

# Trap on error
trap 'echo "Error on line $LINENO" >&2' ERR
```

### Explicit Error Checking

```bash
# Check command success
if ! command -v docker &>/dev/null; then
    echo "Error: docker not installed" >&2
    exit 1
fi

# Check exit codes
curl -sSf "$url" -o "$output" || {
    echo "Download failed" >&2
    exit 1
}

# Validate inputs
: "${API_KEY:?Error: API_KEY environment variable is required}"
```

> [!IMPORTANT]
> **AGENT RULE:** Always start scripts with `set -euo pipefail` and add `trap cleanup EXIT` for temp files. Never assume commands succeed.

## Decision Tree

Agent needs to run a shell command
├── Is the environment Bash/sh/zsh?
│   ├── YES → Use Bash syntax from this skill
│   └── NO → Use appropriate shell skill (PowerShell, cmd)
├── Writing a script or a one-liner?
│   ├── Script → Add shebang + set -euo pipefail + trap cleanup EXIT
│   └── One-liner → Use && / || for chaining
├── Working with variables?
│   ├── ALWAYS double-quote: "$var", "$(cmd)", "${arr[@]}"
│   └── Exception: inside (( )) arithmetic
├── Need conditionals?
│   ├── String comparison → [[ "$a" == "$b" ]]
│   ├── Numeric comparison → (( a > b )) or [[ $a -gt $b ]]
│   └── File check → [[ -f "$file" ]]
├── Iterating over items?
│   ├── Files → for f in *.ext or find + while read
│   ├── Lines in file → while IFS= read -r line
│   └── Array → for item in "${arr[@]}"
├── Need output formatting?
│   └── Use printf instead of echo (portable, predictable)
└── Handling errors?
    ├── Script → set -euo pipefail + trap
    ├── Single command → cmd || { echo "failed" >&2; exit 1; }
    └── Check tool exists → command -v tool &>/dev/null

## Constraints

- **NEVER** leave variables unquoted — always `"$var"`, `"$(cmd)"`
- **NEVER** put spaces around `=` in assignments
- **NEVER** parse `ls` output — use globs or `find`
- **NEVER** use backticks `` `cmd` `` — use `$(cmd)` for command substitution
- **NEVER** omit `set -euo pipefail` in scripts
- **NEVER** use global variables in functions — always `local`
- **NEVER** use `echo` for formatted output — use `printf`
- **ALWAYS** quote `"$@"` when passing arguments
- **ALWAYS** use `[[ ]]` over `[ ]` (safer, supports regex, no word splitting)
- **ALWAYS** add error handling: `trap`, `|| exit`, or explicit checks
- **ALWAYS** use `command -v` to check if a tool exists before using it
- **ALWAYS** redirect errors to stderr: `echo "error" >&2`

## References

- [GNU Bash Manual](https://www.gnu.org/software/bash/manual/bash.html)
- [Bash Pitfalls — Greg's Wiki](https://mywiki.wooledge.org/BashPitfalls)
- [ShellCheck — Static Analysis](https://www.shellcheck.net/)
- [Google Shell Style Guide](https://google.github.io/styleguide/shellguide.html)
