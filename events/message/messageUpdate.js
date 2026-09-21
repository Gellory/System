const db = require("pro.db");
const { EmbedBuilder, PermissionFlagsBits, ChannelType } = require("discord.js");

module.exports = async (client, oldMessage, newMessage) => {
  try {
    /* ================== حمايات أساسية ================== */
    if (!oldMessage || !newMessage) return;
    if (oldMessage.partial || newMessage.partial) return;
    if (!oldMessage.guild) return;
    if (!oldMessage.author) return;
    if (oldMessage.author.bot) return;
    if (oldMessage.channel.type === ChannelType.DM) return;

    const me = oldMessage.guild.members.me;
    if (!me) return;
    if (!me.permissions.has(PermissionFlagsBits.EmbedLinks)) return;

    /* ================== قناة اللوق ================== */
    const logChannelId = db.get(`channelmessage_${oldMessage.guild.id}`);
    const logChannel = oldMessage.guild.channels.cache.get(logChannelId);
    if (!logChannel) return;

    /* ================== تجاهل التعديلات الوهمية ================== */
    if (oldMessage.content === newMessage.content) return;

    /* ================== تجاهل الروابط فقط ================== */
    if (oldMessage.content && oldMessage.content.startsWith("https://")) return;

    /* ================== الإيمبد ================== */
    const embed = new EmbedBuilder()
      .setColor("#8cb9bd")
      .setAuthor({
        name: oldMessage.author.username,
        iconURL: oldMessage.author.displayAvatarURL({ extension: "png" }),
      })
      .setThumbnail("https://cdn.discordapp.com/attachments/1091536665912299530/1208178321851031654/EditMessage.png")
      .setDescription(
        `**تعديل رسالة**\n\n` +
        `**بواسطة :** <@${oldMessage.author.id}>\n` +
        `**فيـ :** ${oldMessage.channel}\n` +
        `**الرسالة :** [اضغط هنا للوصول](${oldMessage.url})\n\n` +
        `**الرسالة القديمة :**\n\`\`\`${oldMessage.content || "No Content"}\`\`\`\n` +
        `**الرسالة الجديدة :**\n\`\`\`${newMessage.content || "No Content"}\`\`\``
      )
      .setFooter({
        text: client.user.username,
        iconURL: client.user.displayAvatarURL({ extension: "png" }),
      });

    await logChannel.send({ embeds: [embed] });

  } catch (err) {
    console.error("MessageUpdate Error:", err);
  }
};
