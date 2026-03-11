---
name: powershell-syntax-guide
description: >
  PowerShell syntax reference for AI agents. Use this skill whenever generating PowerShell
  commands or scripts, automating Windows tasks, working with Azure/AD/M365 via PowerShell,
  or operating in a PowerShell terminal — even for simple commands, because PowerShell syntax
  differs significantly from Bash and cmd, and small mistakes cause silent failures.
---

# PowerShell Syntax Guide

This skill provides expert knowledge for writing and executing PowerShell commands and scripts. PowerShell is an object-oriented shell and scripting language, built on the .NET framework, designed for task automation and configuration management.

## When to use

- Agent needs to execute commands in a PowerShell terminal
- Generating .ps1 scripts or inline PowerShell commands
- Automating Windows system administration tasks
- Working with Azure, Active Directory, or Microsoft 365 via PowerShell
- Agent operates inside environments where `cmd.exe` syntax will NOT work (e.g., VS Code terminal set to pwsh)

## Core Syntax Rules

### Cmdlet Naming Convention

PowerShell uses **Verb-Noun** pattern. Always use approved verbs:

```powershell
# ✅ Correct
Get-Process
Set-Content
New-Item
Remove-Item
Invoke-RestMethod

# ❌ Wrong — not valid cmdlet names
list-processes
create-file
delete-folder
```

### Semicolons vs Newlines

```powershell
# Newlines separate statements (preferred)
Get-Process
Get-Service

# Semicolons for one-liners
Get-Process; Get-Service

# ❌ NEVER use && or || — those are bash, not PowerShell (pwsh 7+ supports them but avoid for compatibility)
```

### Comments

```powershell
# Single line comment

<#
  Multi-line
  comment block
#>
```

## String Quoting — Critical for Agents

### Single vs Double Quotes

```powershell
# Double quotes → variable expansion + escape sequences
$name = "World"
Write-Host "Hello, $name"         # Output: Hello, World
Write-Host "Tab:`tNew line:`n"    # Interprets escapes

# Single quotes → literal, NO expansion
Write-Host 'Hello, $name'         # Output: Hello, $name
Write-Host 'No escapes: `t `n'    # Output: No escapes: `t `n
```

### Here-Strings (multiline)

```powershell
# Expanding here-string
$body = @"
Hello, $name
Line 2
"@

# Literal here-string
$json = @'
{"key": "value", "$notExpanded": true}
'@
```

> [!IMPORTANT]
> **AGENT RULE:** When generating JSON, regex, or paths — always use **single quotes** or **here-strings** to avoid accidental variable expansion.

### Escaping

```powershell
# Backtick ` is the escape character (NOT backslash)
Write-Host "Price is `$100"       # Output: Price is $100
Write-Host "Quote: `"nested`""    # Escaped double quote

# Inside single quotes — double the single quote
Write-Host 'It''s working'        # Output: It's working

# ❌ NEVER use backslash for escaping — \ is a path separator in PowerShell
```

## Variables & Types

```powershell
# Variables always start with $
$myVar = "hello"
$count = 42
$arr = @(1, 2, 3)
$hash = @{ Name = "Alice"; Age = 30 }

# Type casting
[int]$port = "8080"
[string[]]$names = @("Alice", "Bob")
[datetime]$date = "2025-01-15"

# Environment variables
$env:PATH
$env:USERPROFILE
$env:MY_CUSTOM_VAR = "value"
```

### Special Variables

```powershell
$null          # null value
$true / $false # boolean
$_             # current pipeline object
$PSVersionTable # version info
$LASTEXITCODE  # exit code from last native command
$?             # success/failure of last command
$Error         # array of recent errors
$PWD           # current directory
$HOME          # user home directory
```

## Pipeline — The Core Paradigm

```powershell
# Objects flow through pipeline (NOT text like bash)
Get-Process | Where-Object { $_.CPU -gt 100 } | Sort-Object CPU -Descending | Select-Object -First 5

# Pipeline variable is $_  or $PSItem
Get-Service | ForEach-Object { $_.DisplayName.ToUpper() }

# Filtering patterns
Get-ChildItem -Recurse | Where-Object { $_.Extension -eq '.log' -and $_.Length -gt 1MB }
```

### Pipeline vs Bash Pitfalls

```powershell
# ❌ Bash thinking — text parsing
ps aux | grep nginx

# ✅ PowerShell — object filtering
Get-Process | Where-Object { $_.ProcessName -eq 'nginx' }

# ❌ Bash — piping to file
echo "data" > file.txt

# ✅ PowerShell — proper cmdlets (> works but Set-Content is idiomatic)
"data" | Set-Content -Path file.txt
Get-Content file.txt  # not cat
```

## Parameter Binding

```powershell
# Named parameters (recommended for agents — most explicit)
Get-ChildItem -Path "C:\Logs" -Filter "*.log" -Recurse

# Positional parameters (avoid in scripts — ambiguous)
Get-ChildItem "C:\Logs"

# Switch parameters — no value needed
Get-ChildItem -Recurse   # ✅
Get-ChildItem -Recurse $true   # ❌ common agent mistake

# Splatting — best for complex calls
$params = @{
    Path      = "C:\Logs"
    Filter    = "*.log"
    Recurse   = $true
    ErrorAction = 'Stop'
}
Get-ChildItem @params
```

> [!IMPORTANT]
> **AGENT RULE:** Always use **named parameters** for clarity. Never rely on positional binding.

## Error Handling

### Try/Catch/Finally

```powershell
try {
    # -ErrorAction Stop converts non-terminating errors to terminating
    Get-Item -Path "C:\nonexistent" -ErrorAction Stop
}
catch [System.Management.Automation.ItemNotFoundException] {
    Write-Warning "File not found: $($_.Exception.Message)"
}
catch {
    Write-Error "Unexpected error: $_"
}
finally {
    # Always runs — cleanup here
}
```

### ErrorAction Preference

```powershell
# Per-command
Get-Service -Name "fake" -ErrorAction SilentlyContinue

# Script-wide
$ErrorActionPreference = 'Stop'   # Make all errors terminating

# Values: Continue (default), Stop, SilentlyContinue, Inquire, Ignore
```

> [!IMPORTANT]
> **AGENT RULE:** Always set `$ErrorActionPreference = 'Stop'` at script start, or use `-ErrorAction Stop` on critical commands. Default behavior silently continues — agents MUST catch failures.

### Validating Command Success

```powershell
# For native commands (exe), check $LASTEXITCODE
git clone https://repo.url
if ($LASTEXITCODE -ne 0) {
    throw "git clone failed with exit code $LASTEXITCODE"
}

# For cmdlets, use -ErrorAction Stop + try/catch
```

## Operators — Key Differences from Other Languages

### Comparison Operators

```powershell
# PowerShell uses -eq, -ne, etc. NOT ==, !=
$a -eq $b      # equal
$a -ne $b      # not equal
$a -gt $b      # greater than
$a -lt $b      # less than
$a -ge $b      # greater or equal
$a -le $b      # less or equal

# String comparison (case-insensitive by default)
"Hello" -eq "hello"          # True
"Hello" -ceq "hello"         # False (case-sensitive)

# Pattern matching
"file.log" -like "*.log"     # wildcard
"file.log" -match "^file"    # regex
"file.log" -notmatch "temp"  # negated regex

# ❌ NEVER use ==, !=, >, < — these are NOT comparison operators in PowerShell
```

### Logical Operators

```powershell
$a -and $b
$a -or $b
-not $a
!$a            # shorthand for -not
```

### String Operators

```powershell
# Concatenation
"Hello" + " World"
"Repeat" * 3              # RepeatRepeatRepeat

# Replace
"Hello World" -replace 'World', 'PowerShell'
"data_123" -replace '\d+', 'XXX'   # regex replace

# Split / Join
"a,b,c" -split ','
@("a","b","c") -join ', '

# Contains / In
@(1,2,3) -contains 2       # True
2 -in @(1,2,3)             # True
"Hello" -like "*ell*"       # True
```

## File Operations

```powershell
# Paths — use Join-Path, not string concatenation
$logFile = Join-Path -Path $env:TEMP -ChildPath "agent.log"

# ❌ NEVER: $path = "$env:TEMP\agent.log" — breaks on Linux pwsh
# ✅ ALWAYS: Join-Path for cross-platform safety

# Read / Write
$content = Get-Content -Path $logFile -Raw              # whole file as string
$lines = Get-Content -Path $logFile                      # array of lines
"output" | Set-Content -Path $logFile -Encoding UTF8     # overwrite
"append" | Add-Content -Path $logFile -Encoding UTF8     # append

# Check existence
if (Test-Path -Path $logFile) { ... }

# Create directory
New-Item -Path "C:\Logs" -ItemType Directory -Force

# Copy / Move / Delete
Copy-Item -Path $src -Destination $dst -Recurse
Move-Item -Path $src -Destination $dst
Remove-Item -Path $target -Recurse -Force
```

## Functions

```powershell
function Get-ProjectStatus {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory)]
        [string]$ProjectName,

        [ValidateSet('Active','Archived','Draft')]
        [string]$Status = 'Active',

        [switch]$IncludeDetails
    )

    process {
        # Function body
        if ($IncludeDetails) {
            # ...
        }
        # Return objects, not strings
        [PSCustomObject]@{
            Name   = $ProjectName
            Status = $Status
        }
    }
}

# ❌ NEVER: function myFunc($a, $b) { ... } — no validation, no pipeline support
```

> [!IMPORTANT]
> **AGENT RULE:** Always use `[CmdletBinding()]` and typed `param()` blocks. This enables `-Verbose`, `-Debug`, `-ErrorAction` on your functions.

## Decision Tree

Agent needs to run a command
├── Is the environment PowerShell (pwsh/powershell.exe)?
│   ├── YES → Use PowerShell syntax from this skill
│   └── NO → Use appropriate shell skill (bash, zsh, cmd)
├── Need to process structured data?
│   ├── YES → Use pipeline with objects (ConvertFrom-Json, Select-Object, Where-Object)
│   └── NO → Simple cmdlet call with named params
├── Need to handle errors?
│   ├── Critical operation → try/catch + -ErrorAction Stop
│   ├── Optional operation → -ErrorAction SilentlyContinue
│   └── Native exe → Check $LASTEXITCODE
├── Building file paths?
│   └── ALWAYS use Join-Path (cross-platform safe)
├── Working with strings containing $, ", or special chars?
│   ├── No expansion needed → single quotes
│   ├── Expansion needed → double quotes with backtick escaping
│   └── Multi-line → here-strings (@"..."@ or @'...'@)
└── Script or one-liner?
    ├── Script → [CmdletBinding()], param(), $ErrorActionPreference = 'Stop'
    └── One-liner → named params, semicolons to separate

## Constraints

- **NEVER** use bash/sh/cmd syntax (&&, ||, >, >>, backslash escapes)
- **NEVER** use == != > < for comparison — use -eq -ne -gt -lt
- **NEVER** use positional parameters in generated scripts — always named
- **NEVER** build file paths with string concatenation — use `Join-Path`
- **NEVER** ignore errors — always set ErrorAction or $ErrorActionPreference
- **NEVER** use `Write-Host` for output that should be pipeline-consumable — use `Write-Output` or return objects
- **ALWAYS** quote paths with spaces
- **ALWAYS** use `-Encoding UTF8` when writing files to avoid BOM issues
- **ALWAYS** prefer single quotes for literals (JSON, regex, paths without variables)
- **ALWAYS** validate command existence with `Get-Command` before calling

## References

- [Microsoft PowerShell Docs](https://learn.microsoft.com/en-us/powershell/scripting/overview)
- [PowerShell Style Guide](https://poshcode.gitbook.io/powershell-practice-and-style)
- [About Quoting Rules](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_quoting_rules)
- [About Error Handling](https://learn.microsoft.com/en-us/powershell/module/microsoft.powershell.core/about/about_try_catch_finally)
