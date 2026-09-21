const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const moment = require('moment');
const Data = require('pro.db');
const { prefix, owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: 'unmute',
  aliases: ['تكلم'],
  run: async (client, message, args) => {
    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
      return; 
    }

    const Color = Data.get(`Guild_Color = ${message.guild.id}`) || '#192029';
    if (!Color) return;

    const allowedRole = message.guild.roles.cache.get(Data.get(`Allow - Command mute = [ ${message.guild.id} ]`));
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

    if (!isAuthorAllowed && message.author.id !== allowedRole && !message.member.permissions.has(PermissionFlagsBits.MuteMembers)) {
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
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}تكلم <@${message.author.id}>**`);
      return message.reply({ embeds: [embed] });
    }

    let role = member.guild.roles.cache.find((role) => role.name === 'Muted');
    if (!role) {
      return message.react('❎');
    }

    member.roles.remove(role)
      .then(() => {
        message.react('✅');
      })
      .catch((error) => {
        console.error(error);
      //  console.log('An error occurred while unmuting the member.');
      });

    const prisonData = Data.get(`Muted_Member_${member.id}`);
    const prisonReason = prisonData ? prisonData.reason : "سبب الاسكات غير معروف";

    // التحقق من أن الشخص الذي يفك الميوت هو نفسه الذي أعطاه أو أن يكون من الأونرز
    if (prisonData && prisonData.by && prisonData.by !== message.author.id && !owners.includes(message.author.id)) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription('❌ **لا يستطيع ازالة العقوبة الا الشخص الذي قام باعطائها!**')
        ]
      });
    }

    let logChannel = Data.get(`logtmuteuntmute_${message.guild.id}`);

    logChannel = message.guild.channels.cache.find(channel => channel.id === logChannel);

    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL({ extension: 'png' }) })
        .setColor('#312e5d')
        .setDescription(`**فك الآسكات الكتابي\n\nالعضو : ${member}\nبواسطة : ${message.author}\n[Message](${message.url})\nفّك فيـ : \`${moment().format('HH:mm')}\`**\n\`\`\`Mute : ${prisonReason}\`\`\` `)       
        .setThumbnail(`https://cdn.discordapp.com/attachments/1091536665912299530/1153875266066710598/image_1.png`)
        .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL({ extension: 'png' }) });
      logChannel.send({ embeds: [logEmbed] });
    }

    if (Data.has(`Muted_Member_${member.id}`)) {
      await Data.delete(`Muted_Member_${member.id}`);
    } else {
   //   console.log('No data found to delete.');
    }
  },
};
