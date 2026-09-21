const fs = require("fs");
const { EmbedBuilder, PermissionFlagsBits, parseEmoji } = require("discord.js");
const { prefix } = require(`${process.cwd()}/config`);
const Pro = require("pro.db");
const axios = require("axios");

const emojiFolder = `${process.cwd()}/Saved/aemoji`;
if (!fs.existsSync(emojiFolder)) {
    fs.mkdirSync(emojiFolder, { recursive: true });
}

module.exports = {
    name: "aemoji",
    aliases: ["eo"],
    run: async (client, message) => {
        const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) return;

        if (!message.guild || message.author.bot) return;

        const Color = Pro.get(`Guild_Color = ${message.guild.id}`) || "#192029";

        const db = Pro.get(`Allow - Command aemoji = [ ${message.guild.id} ]`);
        const allowedRole = message.guild.roles.cache.get(db);
        const isAuthorAllowed =
            allowedRole && message.member.roles.cache.has(allowedRole.id);

        if (
            !isAuthorAllowed &&
            message.author.id !== db &&
            !message.member.permissions.has(
                PermissionFlagsBits.ManageEmojisAndStickers
            )
        ) {
            return;
        }

        const emojisInContent = message.content.match(
            /<?(a)?:?(\w{2,32}):(\d{17,19})>?/gi
        );

        if (!emojisInContent) {
            const embed = new EmbedBuilder()
                .setColor(Color)
                .setDescription(
                    `**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}aemoji 😘😢**`
                );
            await message.reply({ embeds: [embed] });
            return;
        }

        const emojisArray = [];

        for (const emote of emojisInContent) {
            const emoji = parseEmoji(emote);
            if (!emoji?.id) continue;

            const link = `https://cdn.discordapp.com/emojis/${emoji.id}.${
                emoji.animated ? "gif" : "png"
            }`;

            try {
                // تحميل الإيموجي كـ Buffer (حل discord.js v14)
                const response = await axios.get(link, {
                    responseType: "arraybuffer",
                });
                const buffer = Buffer.from(response.data);

                const createdEmoji = await message.guild.emojis.create({
                    attachment: buffer,
                    name: emoji.name,
                });

                emojisArray.push(createdEmoji.toString());

                // حفظ الإيموجي محليًا
                fs.writeFileSync(
                    `${emojiFolder}/${createdEmoji.name}.${
                        emoji.animated ? "gif" : "png"
                    }`,
                    buffer
                );

                const logChannelId = Pro.get(`logemoji_${message.guild.id}`);
                const logChannel = client.channels.cache.get(logChannelId);

                if (logChannel) {
                    const emojiEmbed = new EmbedBuilder()
                        .setAuthor({
                            name: message.author.tag,
                            iconURL: message.author.displayAvatarURL({
                                extension: "png",
                                size: 1024,
                            }),
                        })
                        .setColor("#192029")
                        .setDescription(
                            `**إضافة إيموجي**\n\n**بواسطة : <@${message.author.id}>**\n**الإيموجي : ${createdEmoji.toString()}**\n**رابط الإيموجي :** [Link](${createdEmoji.url})`
                        )
                        .setThumbnail(createdEmoji.url)
                        .setFooter({
                            text: "Pal Store",
                            iconURL:
                                "https://i.ibb.co/ccPmn8cg/zaraicon.webp",
                        });

                    logChannel.send({ embeds: [emojiEmbed] });
                }
            } catch (error) {
                if (
                    error.message &&
                    error.message.includes("No emoji slots available")
                ) {
                    await message.reply("Emoji - 0 slots available");
                } else {
                    console.error(error);
                }
            }
        }

        if (emojisArray.length > 0) {
            await message.react("✅");
        }
    },
};
