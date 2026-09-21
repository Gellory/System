const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { prefix } = require(`${process.cwd()}/config`);
const Pro = require(`pro.db`);

module.exports = {
  name: 'setnick', // اسم الأمر
  aliases: ["اسم"],
  run: (client, message, args) => {
    const Color = Pro.get(`Guild_Color = ${message.guild.id}`) || '#192029';
    if (!Color) return;

    const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
      return; 
    }

    const db = Pro.get(`Allow - Command setnick = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(db);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

    if (!isAuthorAllowed && message.author.id !== db && !message.member.permissions.has(PermissionFlagsBits.ManageNicknames)) {
      // إجراءات للتصرف عندما لا يتحقق الشرط
      return;
    }

    const member = message.mentions.members.first();
    const name = args.slice(1).join(" ");

    if (!member) {
      const embed = new EmbedBuilder()
        .setColor(`${Color || `#192029`}`)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}setnick <@${message.author.id}> ;زارا **`);
      return message.reply({ embeds: [embed] });
    }

    if (!name) {
      member.setNickname('').then(() => {
        message.react('✅');
        sendLogMessage(message, member, '');
      }).catch(() => { message.react('❌'); });
    } else {
      member.setNickname(name).then(() => {
        message.react('✅');
        sendLogMessage(message, member, name);
      }).catch(() => { message.react('❌'); });
    }
  }
};

function sendLogMessage(message, member, newNickname) {
  const logChannelId = Pro.get(`lognickname_${message.guild.id}`);
  const logChannel = message.guild.channels.cache.get(logChannelId);
  if (!logChannel) return;

  const embed = new EmbedBuilder()
    .setColor("#C88EA7")
    .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL({ extension: 'png', size: 1024 }) })
    .setThumbnail('https://cdn.discordapp.com/attachments/1091536665912299530/1208201551014002848/signature.png?ex=65e26c61&is=65cff761&hm=89f278d848d3acedc08f9f708b70e7c24bd42974df694028f833e9b27f0ceda4&')
    .setDescription(`**تم تغيير الكنية\n\nالعضو : ${member}\nبواسطة : ${message.author}**\n\`\`\`Nickname => ${newNickname || "إزالة الكنية"}\`\`\` `)
    .setFooter({ text: message.author.username, iconURL: message.author.displayAvatarURL({ extension: 'png', size: 1024 }) });
  logChannel.send({ embeds: [embed] });
}
