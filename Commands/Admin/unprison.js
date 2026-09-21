const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { prefix, owners } = require(`${process.cwd()}/config`);
const Pro = require(`pro.db`);
const moment = require('moment');
const Data = require('pro.db');
const { logPunishment } = require('../../utils/punishmentLogger');

module.exports = {
  name: 'unprison',
  aliases: ['عفو', "فك"],
  run: async (client, message, args) => {

    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
      return;
    }


    const Color = Pro.get(`Guild_Color = ${message.guild.id}`) || '#192029';
    if (!Color) return;

    const db = Pro.get(`Allow - Command unprison = [ ${message.guild.id} ]`)
    const allowedRole = message.guild.roles.cache.get(db);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

    if (!isAuthorAllowed && message.author.id !== db && !message.member.permissions.has(PermissionFlagsBits.MuteMembers)) {
      // إجراءات للتصرف عندما لا يتحقق الشرط
      return;
    }

    let member;
    if (message.mentions.members.size > 0) {
      member = message.mentions.members.first();
    } else {
      const memberId = args[0];
      member = message.guild.members.cache.get(memberId);
    }

    if (!member) {
      const embed = new EmbedBuilder()
        .setColor(`${Color || `#192029`}`)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}عفو <@${message.author.id}>**`);
      return message.reply({ embeds: [embed] });
    }

    let role = member.guild.roles.cache.find((role) => role.name === 'prison');
    if (!role || !Pro.get(`MutedMember_${member.id}`)) {
      // إذا لم يكن العضو مسجونًا، أرسل رسالة توضح ذلك
      return message.reply(`**${member} ليس مسجونًا!**`);
    }

    const prisonData = Pro.get(`MutedMember_${member.id}`);
    const prisonReason = prisonData ? prisonData.reason : "سبب السجن غير معروف";

    // التحقق من أن الشخص الذي يفك السجن هو نفسه الذي أعطاه أو أن يكون من الأونرز
    if (prisonData && prisonData.by && prisonData.by !== message.author.id && !owners.includes(message.author.id)) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription('❌ **لا يستطيع ازالة العقوبة الا الشخص الذي قام باعطائها!**')
        ]
      });
    }

    member.roles.remove(role)
      .then(async () => {
        message.react('✅');

        // Log the unprison action
        await logPunishment(
          message.guild.id,
          member.id,
          message.author.id,
          'unprison',
          `Released from prison. Original reason: ${prisonReason}`,
          null
        );

        let logChannel = Data.get(`logprisonunprison_${message.guild.id}`);
        logChannel = message.guild.channels.cache.find(channel => channel.id === logChannel);

        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL({ extension: 'png' }) })
            .setColor('#707487')
            .setDescription(`**فك سجن\n\nالعضو : ${member}\nبواسطة : ${message.author}\n[Message](${message.url})\nفّك فيـ : \`${moment().format('HH:mm')}\`**\n\`\`\`Prison : ${prisonReason}\`\`\` `)
            .setThumbnail('https://cdn.discordapp.com/attachments/1091536665912299530/1224588302393540638/bars.png?ex=661e09bb&is=660b94bb&hm=198f684aacf261c80430479f57f365b8c3dd11aa914b5c382240a2adbe33b00a&')
            .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL({ extension: 'png' }) });
          logChannel.send({ embeds: [logEmbed] });
        }

        // حذف معلومات السجن من قاعدة البيانات
        Pro.delete(`MutedMember_${member.id}`);
      })
      .catch((error) => {
        console.error(error);
        //    console.log('An error occurred while unmuting the member.');
      });


  },
};
