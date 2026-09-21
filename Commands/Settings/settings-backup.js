const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    PermissionsBitField
} = require("discord.js");
const Data = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);

const SNAPSHOTS_KEY = (guildId) => `settings_snapshots_${guildId}`;
const AUTO_KEY = (guildId) => `settings_backup_auto_${guildId}`;
const MAX_SNAPSHOTS = 20;
const MIN_INTERVAL_MINUTES = 5;
const MAX_INTERVAL_MINUTES = 1440;
const RESTORE_PREFIX = "sb_restore";

function hasAccess(message) {
    if (owners.includes(message.author.id)) return true;
    return message.member.permissions.has(PermissionsBitField.Flags.Administrator);
}

function readAllData() {
    return Data.fetchAll() || {};
}

function getGuildChannelIdSet(guild) {
    return new Set(guild.channels.cache.map((c) => c.id));
}

function classifyKey(key, guildId, guildChannelIds) {
    const rolesPrefixes = [
        `autorole_${guildId}`,
        `setChannels_${guildId}`,
        `avtchats-[${guildId}]`,
        `Guild_Color-${guildId}`,
        `colorRoom_${guildId}`
    ];
    if (rolesPrefixes.some((prefix) => key.startsWith(prefix))) {
        return "roles";
    }

    if (key.startsWith("RoomInfo_")) {
        const channelId = key.replace("RoomInfo_", "");
        if (guildChannelIds.has(channelId)) return "roles";
    }

    const automodPrefixes = [
        `antibots-${guildId}`,
        `anticreate-${guildId}`,
        `antiDelete-${guildId}`,
        `antijoinEnabled_${guildId}`,
        `antijoinPunishment_${guildId}`,
        `antilinks-${guildId}`,
        `spamProtection_${guildId}`,
        `word_${guildId}`,
        `wanti_${guildId}`,
        `logprotection_${guildId}`,
        `logantidelete_${guildId}`,
        `logantijoinbots_${guildId}`,
        `logblocklist_${guildId}`
    ];
    if (automodPrefixes.some((prefix) => key.startsWith(prefix))) {
        return "automod";
    }

    const customPrefixes = [
        `menuOptions_${guildId}`,
        `customCommands_${guildId}`,
        `aliases_${guildId}`
    ];
    if (customPrefixes.some((prefix) => key.startsWith(prefix))) {
        return "custom";
    }

    return null;
}

function collectSnapshotData(guild) {
    const allData = readAllData();
    const channelIds = getGuildChannelIdSet(guild);
    const data = {};
    const counts = { roles: 0, automod: 0, custom: 0, total: 0 };

    for (const [key, value] of Object.entries(allData)) {
        const bucket = classifyKey(key, guild.id, channelIds);
        if (!bucket) continue;
        data[key] = value;
        counts[bucket] += 1;
        counts.total += 1;
    }

    return { data, counts };
}

function saveSnapshot(guild, createdBy, label = null) {
    const { data, counts } = collectSnapshotData(guild);
    const snapshots = Data.get(SNAPSHOTS_KEY(guild.id)) || [];
    const snapshot = {
        id: Date.now().toString(),
        createdAt: Date.now(),
        createdBy,
        label: label || null,
        counts,
        data
    };
    snapshots.unshift(snapshot);
    if (snapshots.length > MAX_SNAPSHOTS) {
        snapshots.length = MAX_SNAPSHOTS;
    }
    Data.set(SNAPSHOTS_KEY(guild.id), snapshots);
    return snapshot;
}

function getSnapshots(guildId) {
    return Data.get(SNAPSHOTS_KEY(guildId)) || [];
}

function getSnapshotByRef(guildId, snapshotRef) {
    const snapshots = getSnapshots(guildId);
    if (snapshots.length === 0) return null;
    if (!snapshotRef || snapshotRef.toLowerCase() === "latest") return snapshots[0];
    return snapshots.find((s) => s.id === snapshotRef) || null;
}

function normalizeScope(scope) {
    const value = (scope || "full").toLowerCase();
    if (value === "roles" || value === "automod" || value === "custom" || value === "full") {
        return value;
    }
    return null;
}

function restoreSnapshot(guild, snapshot, scope) {
    const allData = readAllData();
    const guildChannelIds = getGuildChannelIdSet(guild);
    const selectedKeys = Object.keys(snapshot.data).filter((key) => {
        const bucket = classifyKey(key, guild.id, guildChannelIds);
        return scope === "full" ? !!bucket : bucket === scope;
    });

    for (const key of Object.keys(allData)) {
        const bucket = classifyKey(key, guild.id, guildChannelIds);
        if (!bucket) continue;
        if (scope !== "full" && bucket !== scope) continue;
        Data.delete(key);
    }

    for (const key of selectedKeys) {
        Data.set(key, snapshot.data[key]);
    }

    return { restoredCount: selectedKeys.length };
}

function scheduleAutoSnapshot(client, guild, intervalMinutes) {
    if (!client.settingsBackupIntervals) {
        client.settingsBackupIntervals = new Map();
    }

    const existing = client.settingsBackupIntervals.get(guild.id);
    if (existing) {
        clearInterval(existing);
        client.settingsBackupIntervals.delete(guild.id);
    }

    if (!intervalMinutes) return;

    const intervalMs = intervalMinutes * 60 * 1000;
    const timer = setInterval(() => {
        const config = Data.get(AUTO_KEY(guild.id));
        if (!config || !config.enabled) return;
        const snapshot = saveSnapshot(guild, "AUTO", `Auto-${intervalMinutes}m`);
        Data.set(AUTO_KEY(guild.id), {
            ...config,
            lastRunAt: Date.now(),
            lastSnapshotId: snapshot.id
        });
    }, intervalMs);

    client.settingsBackupIntervals.set(guild.id, timer);
}

function ensureAutoScheduler(client, guild) {
    const config = Data.get(AUTO_KEY(guild.id));
    if (!config || !config.enabled || !config.intervalMinutes) return;
    if (!client.settingsBackupIntervals) {
        client.settingsBackupIntervals = new Map();
    }
    if (client.settingsBackupIntervals.has(guild.id)) return;
    scheduleAutoSnapshot(client, guild, config.intervalMinutes);
}

function createSnapshotEmbed(guild, snapshot, title = "Snapshot Created") {
    return new EmbedBuilder()
        .setColor("#2f3136")
        .setTitle(title)
        .addFields(
            { name: "Snapshot ID", value: `\`${snapshot.id}\`` },
            { name: "Created", value: `<t:${Math.floor(snapshot.createdAt / 1000)}:R>` },
            { name: "Roles Policy", value: `\`${snapshot.counts.roles}\``, inline: true },
            { name: "Automod", value: `\`${snapshot.counts.automod}\``, inline: true },
            { name: "Custom", value: `\`${snapshot.counts.custom}\``, inline: true },
            { name: "Total Keys", value: `\`${snapshot.counts.total}\`` }
        )
        .setFooter({ text: guild.name });
}

module.exports = {
    name: "settings-backup",
    aliases: ["sbackup", "snapshot", "sb"],
    run: async (client, message, args) => {
        if (!hasAccess(message)) return message.react("❌");
        ensureAutoScheduler(client, message.guild);

        const sub = (args[0] || "").toLowerCase();
        if (!sub || sub === "help") {
            return message.reply(
                [
                    "**settings-backup commands:**",
                    "`settings-backup create [label]`",
                    "`settings-backup list`",
                    "`settings-backup restore <snapshotId|latest> [full|roles|automod|custom]`",
                    "`settings-backup auto <minutes|off|status>`"
                ].join("\n")
            );
        }

        if (sub === "create") {
            const label = args.slice(1).join(" ").trim() || null;
            const snapshot = saveSnapshot(message.guild, message.author.id, label);
            return message.reply({ embeds: [createSnapshotEmbed(message.guild, snapshot)] });
        }

        if (sub === "list") {
            const snapshots = getSnapshots(message.guild.id);
            if (snapshots.length === 0) {
                return message.reply("No snapshots found for this server.");
            }

            const lines = snapshots.slice(0, 10).map((s, idx) => {
                const label = s.label ? ` | ${s.label}` : "";
                return `\`${idx + 1}.\` ID: \`${s.id}\` | Total: \`${s.counts.total}\` | <t:${Math.floor(s.createdAt / 1000)}:R>${label}`;
            });

            return message.reply(lines.join("\n"));
        }

        if (sub === "auto") {
            const arg = (args[1] || "").toLowerCase();
            if (!arg || arg === "status") {
                const config = Data.get(AUTO_KEY(message.guild.id));
                if (!config || !config.enabled) {
                    return message.reply("Auto snapshot is currently `OFF`.");
                }
                const every = config.intervalMinutes;
                const lastRun = config.lastRunAt ? `<t:${Math.floor(config.lastRunAt / 1000)}:R>` : "Never";
                return message.reply(`Auto snapshot is ` + "`ON`" + ` every \`${every}\` minute(s). Last run: ${lastRun}`);
            }

            if (arg === "off") {
                Data.set(AUTO_KEY(message.guild.id), { enabled: false, intervalMinutes: null, lastRunAt: null });
                scheduleAutoSnapshot(client, message.guild, null);
                return message.reply("Auto snapshot has been disabled.");
            }

            const minutes = Number(arg);
            if (!Number.isInteger(minutes) || minutes < MIN_INTERVAL_MINUTES || minutes > MAX_INTERVAL_MINUTES) {
                return message.reply(`Interval must be an integer between ${MIN_INTERVAL_MINUTES} and ${MAX_INTERVAL_MINUTES} minutes.`);
            }

            Data.set(AUTO_KEY(message.guild.id), {
                enabled: true,
                intervalMinutes: minutes,
                lastRunAt: null
            });
            scheduleAutoSnapshot(client, message.guild, minutes);
            return message.reply(`Auto snapshot enabled every \`${minutes}\` minute(s).`);
        }

        if (sub === "restore") {
            const snapshotRef = args[1] || "latest";
            const snapshot = getSnapshotByRef(message.guild.id, snapshotRef);
            if (!snapshot) {
                return message.reply("Snapshot not found.");
            }

            const scope = normalizeScope(args[2]);
            if (!scope) {
                return message.reply("Invalid scope. Use: full, roles, automod, custom.");
            }

            if (scope !== "full") {
                const { restoredCount } = restoreSnapshot(message.guild, snapshot, scope);
                return message.reply(`Restore complete. Scope: \`${scope}\` | Keys restored: \`${restoredCount}\``);
            }

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`${RESTORE_PREFIX}:full:${snapshot.id}`)
                    .setLabel("Restore Full")
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId(`${RESTORE_PREFIX}:roles:${snapshot.id}`)
                    .setLabel("Roles")
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`${RESTORE_PREFIX}:automod:${snapshot.id}`)
                    .setLabel("Automod")
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`${RESTORE_PREFIX}:custom:${snapshot.id}`)
                    .setLabel("Custom")
                    .setStyle(ButtonStyle.Secondary)
            );

            const prompt = await message.reply({
                content: `Select restore type for snapshot \`${snapshot.id}\``,
                components: [row]
            });

            const collector = prompt.createMessageComponentCollector({
                time: 30000,
                filter: (i) => i.user.id === message.author.id
            });

            collector.on("collect", async (interaction) => {
                if (!interaction.customId.startsWith(`${RESTORE_PREFIX}:`)) return;
                const [, selectedScope, selectedId] = interaction.customId.split(":");
                const selectedSnapshot = getSnapshotByRef(message.guild.id, selectedId);
                if (!selectedSnapshot) {
                    await interaction.reply({ content: "Snapshot not found.", ephemeral: true });
                    return;
                }

                const { restoredCount } = restoreSnapshot(message.guild, selectedSnapshot, selectedScope);
                await interaction.update({
                    content: `Restore complete. Scope: \`${selectedScope}\` | Keys restored: \`${restoredCount}\``,
                    components: []
                });
                collector.stop("done");
            });

            collector.on("end", async (_, reason) => {
                if (reason === "done") return;
                await prompt.edit({ components: [] }).catch(() => {});
            });

            return;
        }

        return message.reply("Unknown subcommand. Use `settings-backup help`.");
    }
};
