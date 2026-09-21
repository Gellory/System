const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { prefix } = require(`${process.cwd()}/config`);
const Data = require('pro.db');

module.exports = {
  name: 'clearlog',
  aliases: ['مسح-سجل', 'صفر-سجل', 'حذف-سجل', 'مسح سجل', 'صفر سجل', 'حذف سجل', 'مسح السجل'],
  run: async (client, message, args) => {
    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
      return;
    }

    const Color = Data.get(`Guild_Color = ${message.guild.id}`) || '#192029';
    if (!Color) return;

    // Permission check
    const Pro = require(`pro.db`);
    const allowDb = Pro.get(`Allow - Command sajal = [ ${message.guild.id} ]`) || Pro.get(`Allow - Command clearlog = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(allowDb);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

    if (!isAuthorAllowed && message.author.id !== allowDb && !message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return message.react('❌');
    }

    // Get member from mention or ID
    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

    if (!member) {
      const embed = new EmbedBuilder()
        .setColor(`${Color || `#192029`}`)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}مسح سجل <@${message.author.id}>**`);
      return message.reply({ embeds: [embed] });
    }

    const guildId = message.guild.id;
    const userId = member.id;

    // Get all punishments for the user
    const punishments = Data.get(`punish_${guildId}_${userId}`) || [];

    if (punishments.length === 0) {
      const embed = new EmbedBuilder()
        .setColor(`${Color || `#192029`}`)
        .setDescription(`**❌ لا توجد عقوبات مسجلة للعضو ${member.user.tag} لمسحها**`);
      return message.reply({ embeds: [embed] });
    }

    // Delete all punishments
    Data.delete(`punish_${guildId}_${userId}`);

    const embed = new EmbedBuilder()
      .setColor(Color || '#00ff00')
      .setDescription(`**✅ تم مسح جميع العقوبات المسجلة للعضو ${member.user.tag}\n\nعدد العقوبات المحذوفة: \`${punishments.length}\`**`)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true, extension: 'png' }))
      .setFooter({ 
        text: `Pal Store`,
        iconURL: "https://i.ibb.co/ccPmn8cg/zaraicon.webp"
      })
      .setTimestamp();

    message.reply({ embeds: [embed] });
  }
};

