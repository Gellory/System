const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require("discord.js");
const { loadImage } = require("canvas");
const { Canvas, loadFont } = require("canvas-constructor/cairo");
const axios = require("axios");
const Data = require("pro.db");
const antilinkDetector = require("../antilinkDetector");

let fontLoaded = false;
function ensureFontLoaded() {
    if (fontLoaded) return;
    loadFont("./Fonts/JF-Flat-Regular.ttf", { family: "Cairo" });
    fontLoaded = true;
}

function isImageOrVideoAttachment(attachment) {
    const ct = attachment.contentType || "";
    if (ct.startsWith("image/") || ct.startsWith("video/")) return true;
    const lower = (attachment.name || "").toLowerCase();
    return [".png", ".jpg", ".jpeg", ".gif", ".webp", ".mp4", ".webm", ".mov"].some((ext) => lower.endsWith(ext));
}

function parseDirectImageUrl(content) {
    const value = content.trim();
    if (!/^https?:\/\//i.test(value)) return null;
    if (/\.(png|jpe?g|gif|webp)(\?.*)?$/i.test(value)) return value;
    return null;
}

async function handleCommand(client, message) {
    const prefix = client.config.prefix || client.prefix || "!";
    const content = message.content || "";
    if (!content.toLowerCase().startsWith(prefix.toLowerCase())) return false;

    const [rawCmd, ...args] = content.slice(prefix.length).trim().split(/\s+/g);
    if (!rawCmd) return true;

    const cmd = rawCmd.toLowerCase();
    const command = client.commands.get(cmd);
    if (!command || typeof command.run !== "function") return true;

    const isEnabled = Data.get(`command_enabled_${String(command.name || cmd).toLowerCase()}`);
    if (isEnabled === false) return true;

    try {
        await command.run(client, message, args);
    } catch (error) {
        console.error(`Command "${cmd}" failed:`, error.message);
    }
    return true;
}

async function handleAutoReact(message) {
    const reactData = Data.get(`RoomInfo_${message.channel.id}`);
    if (!reactData) return;

    const channel = message.guild.channels.cache.get(reactData.Channel_Id);
    if (!channel || channel.id !== message.channel.id) return;

    const emojiIds = [
        reactData.Emoji1_Id,
        reactData.Emoji2_Id,
        reactData.Emoji3_Id,
        reactData.Emoji4_Id,
        reactData.Emoji5_Id,
        reactData.Emoji6_Id
    ].filter(Boolean);

    for (const emojiId of emojiIds) {
        try {
            await message.react(emojiId);
        } catch (_) {
            // ignore missing/invalid emoji
        }
    }
}

async function handleAutoReply(message) {
    const replies = Data.get(`Replys_${message.content}`);
    if (!Array.isArray(replies) || replies.length === 0) return;
    const item = replies[0];
    if (!item || !item.Word || !item.Reply) return;
    if (message.content.startsWith(item.Word)) {
        await message.channel.send({ content: String(item.Reply) });
    }
}

async function handlePoints(message) {
    const pointsEnabled = Data.get(`levels-${message.guild.id}`);
    if (!pointsEnabled || message.author.bot) return;

    const userId = message.author.id;
    let count = (await Data.fetch(`${userId}_messageCount`)) || 0;
    count += 1;

    if (count % 10 === 0) {
        const pointsKey = `${userId}_points`;
        const current = (await Data.fetch(pointsKey)) || 0;
        await Data.set(pointsKey, current + 1);
        count = 0;
    }

    await Data.set(`${userId}_messageCount`, count);
}

async function handleChannelDeleteRules(message) {
    if (message.author.bot || !message.content) return;
    const channels = Data.get(`setChannels_${message.guild.id}`) || [];
    if (!Array.isArray(channels) || !channels.includes(message.channel.id)) return;
    if (message.attachments.size > 0) return;
    await message.delete().catch(() => {});
}

async function handleChannelImageDrop(message) {
    const storedChannels = Data.get("Channels") || [];
    if (!Array.isArray(storedChannels)) return;

    for (const entry of storedChannels) {
        if (!entry || entry.channelID !== message.channel.id || !entry.fontURL) continue;
        await message.channel.send({
            files: [{ attachment: entry.fontURL, name: "Zara.png" }]
        });
    }
}

async function handleEvaluationImage(message) {
    const targetChannelId = Data.get(`setevaluation_${message.guild.id}`);
    if (message.channel.id !== targetChannelId) return false;

    const imageURL = Data.get(`setImageURL_${message.guild.id}`);
    if (!imageURL) return true;

    ensureFontLoaded();
    const textColor = Data.get(`textColor_${message.guild.id}`) || "#ffffff";
    const cleanText = message.content.replace(/<@!?\d+>/g, "");
    const lines = [];
    let content = cleanText;
    while (content.length > 75) {
        lines.push(content.slice(0, 75));
        content = content.slice(75);
    }
    if (content.length > 0) lines.push(content);

    try {
        const avatar = (message.author.displayAvatarURL({ extension: "png", size: 1024 }) || "")
            .replace(".webp", ".png")
            .replace(".gif", ".png");

        const buffer = await new Canvas(914, 316)
            .printImage(await loadImage(imageURL), 0, 0, 914, 316)
            .printCircularImage(await loadImage(avatar), 755.8, 258, 35.8, 35.8)
            .setTextAlign("right")
            .setColor(textColor)
            .setShadowColor("rgba(0,0,0,0.5)")
            .setShadowBlur(8)
            .setTextFont("bold 20px Cairo")
            .printText(lines.join("\n"), 770, 125)
            .setTextFont("bold 30px Cairo")
            .printText(message.member.displayName, 710, 270)
            .toBuffer();

        await message.channel.send({ files: [buffer] });
        await message.delete().catch(() => {});
    } catch (error) {
        console.error("Evaluation image generation failed:", error.message);
    }

    return true;
}

async function handleMediaRepost(message) {
    const channelData = Data.get(`avtchats-[${message.guild.id}]`);
    const color = Data.get(`Guild_Color-${message.guild.id}`) || "#1e1f22";
    if (!Array.isArray(channelData) || !channelData.includes(message.channel.id)) return;
    if (!color) return;

    const imageStatus = Data.get(`ImageStatus_${message.guild.id}`) || "on";
    const lineImage = Data.get("Line");

    const media = [];
    for (const attachment of message.attachments.values()) {
        if (!isImageOrVideoAttachment(attachment)) continue;
        media.push(attachment.url);
    }

    const direct = parseDirectImageUrl(message.content || "");
    if (direct) media.push(direct);
    if (media.length === 0) return;

    for (const url of media) {
        try {
            const response = await axios.get(url, { responseType: "arraybuffer" });
            const imageBuffer = Buffer.from(response.data);
            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel("تحميل")
                    .setStyle(ButtonStyle.Link)
                    .setURL(url)
            );

            if (lineImage && imageStatus === "on") {
                const embed = new EmbedBuilder().setColor(color).setImage("attachment://image.png");
                await message.channel.send({
                    embeds: [embed],
                    files: [{ attachment: imageBuffer, name: "image.png" }],
                    components: [row]
                });
            } else {
                await message.channel.send({
                    files: [{ attachment: imageBuffer, name: "image.png" }],
                    components: [row]
                });
            }
        } catch (error) {
            console.error("Media repost failed:", error.message);
        }
    }

    if (lineImage) {
        await message.channel.send({ files: [lineImage] }).catch(() => {});
    }
    await message.delete().catch(() => {});
}

module.exports = async (client, message) => {
    if (!message.guild || message.author.bot) return;

    try {
        await antilinkDetector(client, message);
    } catch (error) {
        console.error("antilinkDetector failed:", error.message);
    }

    const commandHandled = await handleCommand(client, message);
    if (commandHandled) return;

    await handleAutoReact(message);
    await handleAutoReply(message);
    await handlePoints(message);
    await handleChannelDeleteRules(message);
    await handleChannelImageDrop(message);

    const evaluationHandled = await handleEvaluationImage(message);
    if (evaluationHandled) return;

    await handleMediaRepost(message);
};
