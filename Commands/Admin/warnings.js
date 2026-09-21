const { Message, Client, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const deb = require('pro.db')

module.exports = {
  name: "warnings",
  aliases: ["تحذيرات", "warni"],
  description: "الحصول على قائمة التحذيرات للسيرفر أو لعضو.",
  run: async (client, message, args) => {

    const isEnabled = deb.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
        return; 
    }


    const Color = deb.get(`Guild_Color = ${message.guild.id}`) || '#192029';
    if (!Color) return;


    const Pro = require(`pro.db`)
    const db = Pro.get(`Allow - Command warn = [ ${message.guild.id} ]`)
const allowedRole = message.guild.roles.cache.get(db);
const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

if (!isAuthorAllowed && message.author.id !== db  && !message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
// إجراءات للتصرف عندما لا يتحقق الشرط
return;
}

    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
   // const permission = message.member.permissions.has("MANAGE_MESSAGES");


    if (!args[0]) {
      return message.reply({ content: `**يرجى ارفاق منشن العضو او الايدي .**`, allowedMentions: { parse: [] } }).catch((err) => {
        console.log(`لم أتمكن من الرد على الرسالة: ` + err.message)
      })
    }

    if (!member) {
      return message.reply({ content: `🙄 **لا يمكنني العثور على هذا العضو**`, allowedMentions: { parse: [] } }).catch((err) => {
        console.log(`لم أتمكن من الرد على الرسالة: ` + err.message)
      })
    }

    let warns = await deb.fetch(`warns_${member.id}`)
    if (!warns) {
      return message.reply({ content: `> **هذا المستخدم لا يملك تحذيرات**`, allowedMentions: { parse: [] } })
    }

    let reason = deb.get(`reason_${member.id}`)
    let warnedby = deb.get(`messageauthor_${member.id}`)
    let time = deb.get(`time_${member.id}`)

    if (!warns == null) {
      warns = 0;
    }

    let embed = new EmbedBuilder()
    .setColor(`${Color || `#192029`}`)
    .setAuthor({ name: message.guild.name, iconURL: message.guild.iconURL({ extension: 'png' }) })
      .setThumbnail(member.displayAvatarURL({ extension: 'png' }) )
      .setFooter({ text: `طلب بواسطة ${message.author.tag}`, iconURL: message.author.displayAvatarURL({ extension: 'png' }) })
      .setDescription(`**
> ${member}: العضو
> <@!${warnedby}>: تحذير من قبل
> هذا المستخدم لديه (\`${warns}\`) تحذيرات**`)

    message.reply({ embeds: [embed], allowedMentions: { parse: [] } })
  },
};