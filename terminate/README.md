# 🌌 Terminate
> The zero-dependency AI shell booster. 

Terminate is a revolutionary shell extension that bridges the gap between traditional CLI tools, complex pipelines, and modern AI. It lives inside your terminal and activates only when you need it.

## 🚀 Instant Install
Run the universal bootstrap to install on **macOS** or **Linux** (ARM64/x64):

```bash
curl -fsSL https://terminate.ashubh.dev/get | bash
```

## 🛠 Operation Modes

### 1. Tool Mode (`:`)
Execute internal system tools with typed arguments.
```bash
:math.add num1=10 num2=20
```

### 2. Pipeline Mode (`--`)
Chain tools together into complex workflows. Use `$n` to reference the output of previous steps.
```bash
-- :math.add num1=10 num2=20 | :json.extract text="The result is $1"
```

### 3. Shell Escape (`!`)
Quickly drop into a persistent shell environment.
```bash
! ls -la
```

### 4. AI Consultant (`@`)
Talk to your terminal in natural language.
```bash
@ "Find all large log files and gzip them"
```

---

## 📂 Configuration
All core logic is managed within `~/.terminate/core`.
- **Customization**: Shell hooks are automatically injected into `~/.zshrc`, `~/.bashrc`, or `config.fish`.
- **Infrastructure**: Proxied via `terminate.ashubh.dev` for high-speed delivery.
