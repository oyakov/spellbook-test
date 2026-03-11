name: python-programming
description: >
  Python programming for operational support, scripting, data processing, and AI integration.
  Use this skill whenever generating Python scripts for automation, system administration,
  data scraping, or connecting to remote systems. Focus on modern Python (3.10+) features,
  clean code practices (PEP 8), and robust error handling to replace complex Bash/PowerShell logic.

## When to use
- Creating operational scripts to automate project tasks
- Replacing complex Bash or PowerShell scripts to avoid their syntax quirks
- SCRAPING web content or monitoring remote systems
- Implementing data processing pipelines or AI-related logic
- Setting up secure connections and system configurations
- Writing test suites with progress bars and detailed logging
- Building cross-platform CLI tools

## Core Concepts

### Modern Python Features (3.10+)
- **Structural Pattern Matching** — use `match` and `case` for more readable branching compared to `if-elif` chains.
- **Type Hinting** — always use type annotations (`int`, `str`, `List[T]`, `Optional[T]`) to improve code clarity and catch errors early.
- **`pathlib`** — use for object-oriented filesystem paths instead of `os.path`.
- **`asyncio`** — for high-performance concurrent I/O operations (scraping, API calls).
- **Context Managers** — always use `with` statements for resource management (files, network connections).

### Error Handling
- Use specific exception types (`ValueError`, `FileNotFoundError`) instead of generic `Exception`.
- Implement retry logic for network-bound operations.
- Use `try-except-finally` to ensure clean resource release.

## Instructions

### Operational Scripting Patterns

**Robust File Operations:**
```python
from pathlib import Path

def process_data(input_file: str, output_dir: str):
    input_path = Path(input_file)
    output_path = Path(output_dir)
    
    if not input_path.exists():
        raise FileNotFoundError(f"Input file not found: {input_path}")
        
    output_path.mkdir(parents=True, exist_ok=True)
    
    data = input_path.read_text(encoding="utf-8")
    # Process data...
    (output_path / "processed.txt").write_text(data, encoding="utf-8")
```

**Remote System Interaction (with `subprocess`):**
```python
import subprocess

def run_remote_command(command: str):
    try:
        result = subprocess.run(
            command, 
            shell=True, 
            capture_output=True, 
            text=True, 
            check=True
        )
        return result.stdout
    except subprocess.CalledProcessError as e:
        print(f"Command failed with return code {e.returncode}")
        print(f"Error output: {e.stderr}")
        return None
```

### Best Practices
1. **Virtual Environments** — always use `venv` or `poetry` to manage dependencies.
2. **PEP 8 Compliance** — follow standard naming conventions (`snake_case` for functions/variables, `PascalCase` for classes).
3. **Docstrings** — use Google or NumPy style docstrings for all public functions and classes.
4. **Logging** — use the `logging` module instead of `print` for better control over output levels.
5. **Testing** — use `pytest` for comprehensive testing of your scripts.

## Constraints
- **NEVER** use mutable default arguments (e.g., `def func(a=[])`).
- **NEVER** use generic `except Exception:` without logging the error.
- **NEVER** hardcode sensitive data — use `python-dotenv` or environment variables.
- **NEVER** use `shell=True` in `subprocess` unless absolutely necessary (security risk).
- **ALWAYS** close resources using context managers (`with`).
- **ALWAYS** include a `requirements.txt` or `pyproject.toml` for dependencies.
- **ALWAYS** use f-strings for string formatting.

## References
- [Python Official Documentation](https://docs.python.org/3/)
- [Real Python](https://realpython.com/)
- [Python Packaging User Guide](https://packaging.python.org/)
- [PEP 8 Style Guide](https://peps.python.org/pep-0008/)
