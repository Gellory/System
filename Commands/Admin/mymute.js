const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { prefix, owners } = require(`${process.cwd()}/config`);
const db = require("pro.db");

module.exports = {
  name: 'mymute',
  aliases: ["اسكاتي",],
  run: async (client, message, args) => {

    const allowDb = db.get(`Allow - Command mute = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(allowDb);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

    if (!isAuthorAllowed && message.author.id !== allowDb && !message.member.permissions.has(PermissionFlagsBits.MuteMembers) && !owners.includes(message.author.id)) {
      return;
    }

    let member;
    const Color = db.get(`Guild_Color = ${message.guild.id}`) || '#192029';
    if (!Color) return;

    if (!args[0]) {
      const embed = new EmbedBuilder()
        .setColor(`${Color || `#192029`}`)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}mymute <@${message.author.id}>**`);
      return message.reply({ embeds: [embed] });
    }

    if (message.mentions.members.size > 0) {
      member = message.mentions.members.first();
    } else {
      member = message.guild.members.cache.get(args[0]);
    }



    const prisonData = db.get(`Muted_Member_${member.id}`);
    if (!prisonData) {
      return message.reply("**العضو ليس لديه إي عقوبة محفوظه**");
    }

    const selectedOption = prisonData.reason;
    const timeLeft = prisonData.time;
    const endDate = prisonData.times;
    const channel = prisonData.channel.id;
    const by = prisonData.by; 

    const logEmbed = new EmbedBuilder()
    .setColor('#312e5d')
    .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL({ extension: 'png' }) })
      .setDescription(`**معلومات الميوت\n\nبواسطة : <@${by}> (${message.guild.members.cache.get(by).user.tag})\nالعضو : <@${member.id}> (${member.user.tag})\n الوقت : \`${timeLeft}\`\nوقت الانتهاء : \`${endDate}\`**\n\`\`\`Mute : ${selectedOption}\`\`\``) 
      .setThumbnail(`https://cdn.discordapp.com/attachments/1091536665912299530/1153875266066710598/image_1.png`)
      .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL({ extension: 'png' }) });

    message.channel.send({ embeds: [logEmbed] });
  }
};
