const fs = require("fs");
const path = require("path");
const Data = require("pro.db");

function walkJsFiles(rootDir) {
    if (!fs.existsSync(rootDir)) return [];
    const files = [];
    const stack = [rootDir];

    while (stack.length > 0) {
        const current = stack.pop();
        const entries = fs.readdirSync(current, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(current, entry.name);
            if (entry.isDirectory()) {
                stack.push(fullPath);
                continue;
            }
            if (entry.isFile() && entry.name.endsWith(".js")) {
                files.push(fullPath);
            }
        }
    }

    return files.sort();
}

function loadCommandFile(client, filePath) {
    if (fs.statSync(filePath).size === 0) return false;

    const command = require(filePath);
    if (!command || !command.name || typeof command.run !== "function") {
        return false;
    }

    const commandName = String(command.name).toLowerCase();
    const isEnabled = Data.get(`command_enabled_${commandName}`);
    if (isEnabled === false) return false;

    const payload = { ...command };
    client.commands.set(commandName, payload);

    if (Array.isArray(command.aliases)) {
        for (const alias of command.aliases) {
            const aliasName = String(alias).toLowerCase();
            const aliasEnabled = Data.get(`command_enabled_${aliasName}`);
            if (aliasEnabled === false) continue;
            client.commands.set(aliasName, payload);
        }
    }

    return true;
}

function loadEventFile(client, filePath) {
    if (fs.statSync(filePath).size === 0) return false;

    const eventHandler = require(filePath);
    if (typeof eventHandler !== "function") return false;

    const eventName = path.basename(filePath, ".js");
    client.on(eventName, (...args) => {
        Promise.resolve(eventHandler(client, ...args)).catch((error) => {
            console.error(`Event "${eventName}" failed in ${filePath}:`, error.message);
        });
    });

    return true;
}

module.exports = (client) => {
    const commandsRoot = path.join(process.cwd(), "Commands");
    const eventsRoot = path.join(process.cwd(), "events");

    let commandCount = 0;
    for (const filePath of walkJsFiles(commandsRoot)) {
        try {
            if (loadCommandFile(client, filePath)) {
                commandCount += 1;
            }
        } catch (error) {
            console.error(`Failed loading command: ${filePath}`, error.message);
        }
    }

    let eventCount = 0;
    for (const filePath of walkJsFiles(eventsRoot)) {
        try {
            if (loadEventFile(client, filePath)) {
                eventCount += 1;
            }
        } catch (error) {
            console.error(`Failed loading event: ${filePath}`, error.message);
        }
    }

    console.log(`Loaded ${commandCount} command modules and ${eventCount} event modules.`);
};
