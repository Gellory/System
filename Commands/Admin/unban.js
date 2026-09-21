const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { prefix, owners } = require(`${process.cwd()}/config`);
const Pro = require(`pro.db`);
const { logPunishment } = require("../../utils/punishmentLogger");

module.exports = {
  name: "unban",
  aliases: ["unban"],
  description: "فك الحظر عن عضو",
  usage: ["!unban @user"],
  run: async (client, message, args, config) => {


    const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
        return; 
    }

    const Color = Pro.get(`Guild_Color = ${message.guild.id}`) || '#192029';
    if (!Color) return;

    const db = Pro.get(`Allow - Command ban = [ ${message.guild.id} ]`)
const allowedRole = message.guild.roles.cache.get(db);
const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

if (!isAuthorAllowed && message.author.id !== db  && !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
// إجراءات للتصرف عندما لا يتحقق الشرط
return;
}
    if (!message.guild.members.me.permissions.has(PermissionFlagsBits.BanMembers)) {
      return message.reply({
        content: "🙄 **لا يمكنني فك الحظر لهذا العضو. يرجى التحقق من صلاحياتي وموقع دوري.**",
        allowedMentions: { parse: [] },
        ephemeral: true,
      });
    }
    // التأكد من توفر منشن العضو المحظور
    const userArg = args[0];
    if (!userArg) {
      const embed = new EmbedBuilder()
      .setColor(`${Color || `#192029`}`)
      .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}unban <@${message.author.id}>**`);
      return message.reply({ embeds: [embed] });
    }


    let userID = userArg.match(/\d+/); 
    if (!userID) {
      return message.reply({
        content: "🙄 **يرجى ذكر منشن العضو المحظور أو استخدام الآيدي**",
        allowedMentions: { parse: [] },
        ephemeral: true,
      });
    }

    // فك الحظر عن المستخدم المحدد
    message.guild.members.unban(userID[0])
      .then(async () => {
        // Log the unban as a punishment
        await logPunishment(
          message.guild.id,
          userID[0],
          message.author.id,
          'unban',
          'تم فك الحظر',
          null
        );

        const embed = new EmbedBuilder()
          .setDescription(`**تم فك حظره بنجاح** <@${userID[0]}> ✅`)
          .setColor(`${Color || `#192029`}`)
          message.reply({ embeds: [embed], allowedMentions: { parse: [] } });

          const logbanunban = Pro.get(`logbanunban_${message.guild.id}`); // Fetching log pic channel ID from the database
          const logChannel = message.guild.channels.cache.get(logbanunban);
          if (!logChannel) return;
      
          const executor = message.author; // Assuming the executor is the user who triggered the unban
          const logEmbed = new EmbedBuilder()
              .setAuthor({ name: executor.tag, iconURL: executor.displayAvatarURL({ extension: 'png' }) })
              .setDescription(`**تم فك حظر العضو**\n\n**لـ : <@${userID[0]}>**\n**بواسطة : ${executor}**\n\`\`\`Reason : No reason\`\`\`\ `)
              .setColor(`#880013`)
              .setThumbnail('https://cdn.discordapp.com/attachments/1091536665912299530/1209554198660784138/551F8C85-8827-41AF-9286-256F63BE21294.png?ex=65e75821&is=65d4e321&hm=ed8e5c25e1f53f41c15e6df59e9d9d3ab34779455e250f47f978b842f385976d&' )
              .setFooter({ text: message.guild.name, iconURL: message.guild.iconURL({ extension: 'png' }) })
          logChannel.send({ embeds: [logEmbed] });
      
      })



      .catch((error) => {
        console.error(`Failed to unban user: ${error}`);
        message.reply({
          content: "🙄 **حدث خطأ أثناء محاولة إزالة الحظر عن العضو المحدد**",
          allowedMentions: { parse: [] },
          ephemeral: true,
        });
      });
  },
};