/**
 * Setup & Onboarding Tool
 * Core system tool to handle initial configuration and authentication
 */

const fs = require("fs")
const path = require("path")
const config = require("../scripts/helpers/config")

/**
 * Initialize the user's workspace
 * @param {object} args
 * @param {string} args.workspace - Absolute path to user folder
 */
exports.init = async ({ workspace }) => {
  const finalWorkspace = workspace || path.join(process.env.HOME || process.env.USERPROFILE, "cli-tools")
  const resolvedPath = path.resolve(finalWorkspace)
  
  try {
    // Create directory structure if needed
    if (!fs.existsSync(resolvedPath)) {
      fs.mkdirSync(resolvedPath, { recursive: true })
    }
    
    const toolsDir = path.join(resolvedPath, "tools")
    const workflowsDir = path.join(resolvedPath, "workflows")
    const validatorsDir = path.join(toolsDir, "validators")
    
    if (!fs.existsSync(toolsDir)) fs.mkdirSync(toolsDir)
    if (!fs.existsSync(workflowsDir)) fs.mkdirSync(workflowsDir)
    if (!fs.existsSync(validatorsDir)) fs.mkdirSync(validatorsDir, { recursive: true })
    
    // Update config.json (assumes config.json exists at core root)
    const configPath = path.join(config.corePath, "config.json")
    let currentConfig = {}
    
    if (fs.existsSync(configPath)) {
      currentConfig = JSON.parse(fs.readFileSync(configPath, "utf8"))
    }
    
    currentConfig.userPath = resolvedPath
    fs.writeFileSync(configPath, JSON.stringify(currentConfig, null, 2))
    
    // Create an example tool in the new directory
    const exampleTool = path.join(toolsDir, "hello.js")
    if (!fs.existsSync(exampleTool)) {
      fs.writeFileSync(exampleTool, `exports.world = async () => { return "Hello from your custom workspace!" };\n`)
    }
    
    return `SUCCESS: Workspace initialized at ${resolvedPath}`
  } catch (err) {
    throw new Error(`Failed to initialize workspace: ${err.message}`)
  }
}

/**
 * Interactive Shell Selection TUI (Node.js Version)
 * Opens /dev/tty directly to bypass Bash subshell stdin redirection
 */
exports.select_shells = async () => {
    const readline = require('readline');
    const fs = require('fs');

    // Detect shells
    const available = [];
    const execSync = require('child_process').execSync;
    const isMac = process.platform === 'darwin';
    for (const s of ['zsh', 'bash', 'fish']) {
        if (isMac && s === 'bash') continue;
        try { execSync(`command -v ${s}`, { stdio: 'ignore' }); available.push(s); } catch (e) {}
    }

    if (available.length === 0) return "";

    // Open /dev/tty directly — works even inside Bash $() subshells
    const ttyFd = fs.openSync('/dev/tty', 'r+');
    const tty = new (require('tty').ReadStream)(ttyFd);
    const ttyOut = fs.createWriteStream('/dev/null', { fd: ttyFd, autoClose: false });
    const ttyWrite = (str) => fs.writeSync(ttyFd, str);

    let cursor = 0;
    const selected = new Set();
    const currentName = require('path').basename(process.env.SHELL || 'zsh');
    if (available.includes(currentName)) selected.add(currentName);
    else selected.add(available[0]);

    const MENU_HEIGHT = available.length + 3;

    const render = (redraw = false) => {
        if (redraw) ttyWrite(`\x1b[${MENU_HEIGHT}A`); // move up to redraw
        ttyWrite("\x1b[1mSELECT TERMINALS TO ACTIVATE TERMINATION:\x1b[0m\n");
        ttyWrite("\x1b[2m↑↓ navigate   space select/deselect   enter confirm\x1b[0m\n");
        ttyWrite("--------------------------------------------------------\n");
        available.forEach((shell, i) => {
            const arrow = i === cursor ? "\x1b[36m>\x1b[0m " : "  ";
            const box   = selected.has(shell) ? "[\x1b[36mx\x1b[0m]" : "[ ]";
            const label = i === cursor ? `\x1b[36m${shell}\x1b[0m` : shell;
            ttyWrite(`${arrow}${box} ${label}\n`);
        });
    };

    tty.setRawMode(true);
    readline.emitKeypressEvents(tty);
    ttyWrite("\u001B[?25l"); // hide cursor

    return new Promise((resolve) => {
        tty.on('keypress', (str, key) => {
            if (!key) return;

            if (key.name === 'up') {
                cursor = (cursor - 1 + available.length) % available.length;
                render(true);
            } else if (key.name === 'down') {
                cursor = (cursor + 1) % available.length;
                render(true);
            } else if (key.name === 'space') {
                const shell = available[cursor];
                if (selected.has(shell)) selected.delete(shell);
                else selected.add(shell);
                render(true);
            } else if (key.name === 'return') {
                if (selected.size > 0) {
                    ttyWrite("\u001B[?25h"); // restore cursor
                    ttyWrite("\n");
                    tty.setRawMode(false);
                    tty.pause();
                    fs.closeSync(ttyFd);

                    const result = Array.from(selected).join(",");
                    // Write to temp file — avoids $() subshell stdout capture issues
                    require('fs').writeFileSync('/tmp/.terminate_shells', result);
                    resolve(result);
                    setTimeout(() => process.exit(0), 10);
                }
            } else if (key.ctrl && key.name === 'c') {
                ttyWrite("\u001B[?25h");
                process.exit(1);
            }
        });

        render(false);
    });
};

/**
 * Authenticate the user against Terminate Server
 */
exports.login = async () => {
  return "SUCCESS: (Dev Mode) Authentication skipped."
}

/**
 * Log out and clear local credentials
 */
exports.logout = async () => {
  return "SUCCESS: Logged out from Terminate platform."
}
