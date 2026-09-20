const fs = require("fs");
const path = require("path");
const {
    Client,
    GatewayIntentBits,
    Partials,
    Collection,
    ActivityType
} = require("discord.js");

if (process.cwd() !== __dirname) {
    process.chdir(__dirname);
}

const configPath = path.join(__dirname, "config.json");
const config = require(configPath);
const token = config.token;

if (!token || typeof token !== "string") {
    throw new Error("Missing bot token in config.json");
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildBans,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildEmojisAndStickers,
        GatewayIntentBits.GuildMessageReactions
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
        Partials.GuildMember,
        Partials.User
    ]
});

module.exports = client;

client.commands = new Collection();
client.slashCommands = new Collection();
client.config = config;
client.prefix = config.prefix || "!";

process.removeAllListeners("multipleResolves");

function updateInviteLink() {
    if (!client.user) return;
    const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${client.user.id}&permissions=8&scope=bot`;
    if (config.botId === inviteUrl) return;
    config.botId = inviteUrl;
    try {
        fs.writeFileSync(configPath, JSON.stringify(config, null, 4), "utf8");
    } catch (error) {
        console.error("Failed to update config.json:", error.message);
    }
}

function setPresence() {
    if (!client.user) return;
    client.user.setActivity("Pal Store", {
        type: ActivityType.Streaming,
        url: "https://twitch.tv/ZaraStore"
    });
}

try {
    require("./handler")(client);
} catch (error) {
    console.error("Failed to initialize handler:", error.message);
}

try {
    require("./Extras/Guild/Index.js");
} catch (error) {
    console.error("Failed to initialize Extras/Guild/Index.js:", error.message);
}

client.once("ready", () => {
    setPresence();
    updateInviteLink();
    try {
        client.emit("clientReady");
    } catch (_) {
        // keep compatibility with extra modules
    }
});

client.on("guildCreate", (guild) => {
    if (config.Guild && guild.id !== config.Guild) {
        guild.leave().catch(() => {});
    }
});

process.on("unhandledRejection", (reason) => {
    console.error("Unhandled Rejection:", reason);
});

process.on("uncaughtException", (error) => {
    console.error("Uncaught Exception:", error);
});

process.on("uncaughtExceptionMonitor", (error, origin) => {
    console.error("Uncaught Exception Monitor:", origin, error.message);
});

client.login(token).catch((error) => {
    console.error("Bot login failed:", error.message);
    process.exit(1);
});
