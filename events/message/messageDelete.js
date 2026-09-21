const db = require("pro.db");
const { EmbedBuilder, ChannelType } = require("discord.js");

module.exports = async (client, message) => {
  try {
    // حماية أساسية
    if (!message) return;
    if (message.partial) return;
    if (!message.guild) return;
    if (!message.author) return;
    if (message.author.bot) return;

    if (message.channel.type === ChannelType.DM) return;

    /* ================== سجل الصور ================== */
    const logPicId = db.get(`logpic_${message.guild.id}`);
    const logPicChannel = message.guild.channels.cache.get(logPicId);

    if (logPicChannel && message.attachments.size > 0) {
      for (const attachment of message.attachments.values()) {
        if (!attachment.contentType) continue;

        if (
          attachment.contentType.startsWith("image/") ||
          attachment.contentType.startsWith("video/")
        ) {
          await logPicChannel.send({ files: [attachment.url] });

          const embed = new EmbedBuilder()
            .setColor("#EAD196")
            .setAuthor({
              name: message.author.username,
              iconURL: message.author.displayAvatarURL({ extension: "png" }),
            })
            .setDescription(
              `**حذف صورة / فيديو**\n\n` +
              `**بواسطة :** <@${message.author.id}>\n` +
              `**فيـ :** ${message.channel}\n` +
              `\`\`\`الرسالة : No Message\`\`\``
            )
            .setThumbnail("https://cdn.discordapp.com/attachments/1091536665912299530/1208176130297831465/picmessage.png")
            .setFooter({
              text: client.user.username,
              iconURL: client.user.displayAvatarURL({ extension: "png" }),
            });

          await logPicChannel.send({ embeds: [embed] });
        }
      }
    }

    /* ================== سجل الرسائل ================== */
    const logMsgId = db.get(`channelmessage_${message.guild.id}`);
    const logMsgChannel = message.guild.channels.cache.get(logMsgId);
    if (!logMsgChannel) return;

    const embed = new EmbedBuilder()
      .setColor("#8cb9bd")
      .setAuthor({
        name: message.author.username,
        iconURL: message.author.displayAvatarURL({ extension: "png" }),
      })
      .setDescription(
        `**حذف رسالة**\n\n` +
        `**بواسطة :** <@${message.author.id}>\n` +
        `**فيـ :** ${message.channel}\n` +
        `\`\`\`الرسالة : ${message.content || "No Message"}\`\`\``
      )
      .setThumbnail("https://cdn.discordapp.com/attachments/1091536665912299530/1208175403748036658/message.png")
      .setFooter({
        text: client.user.username,
        iconURL: client.user.displayAvatarURL({ extension: "png" }),
      });

    await logMsgChannel.send({ embeds: [embed] });

  } catch (err) {
    console.error("MessageDelete Error:", err);
  }
};
