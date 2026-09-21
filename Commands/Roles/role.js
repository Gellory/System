const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const db = require(`pro.db`);
const { prefix, owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: 'role',
  aliases: ["رول"],
  run: (client, message, args) => {


    const Color = db.get(`Guild_Color = ${message.guild.id}`) || '#192029';
    if (!Color) return;

    const Pro = require(`pro.db`);
    const allowDb = Pro.get(`Allow - Command role = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(allowDb);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

    if (!isAuthorAllowed && message.author.id !== allowDb && !message.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
      return;
    }

    if (message.author.bot) return;
    const a1rgs = message.content.split(" ");
    const command = a1rgs[0].toLowerCase();
    if (a1rgs.length < 3) {
      const embed = new EmbedBuilder()
      .setColor(`${Color || `#192029`}`)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}رول <@${message.author.id}> Pic**`);
      return message.reply({ embeds: [embed] });
    }
    

    const memberArg = a1rgs[1];
    const user = message.mentions.members.first() || message.guild.members.cache.find(member => member.id === memberArg || member.user.tag === memberArg || member.user.username === memberArg);
    if (!user) return message.react("❌");

    const roleArg = a1rgs[2];
    const role = message.mentions.roles.first() || message.guild.roles.cache.find(r => r.name === roleArg || r.id === roleArg || `<@&${roleArg}>` === roleArg);
    if (!role) return message.react("❌");

    if (message.member.roles.highest.position <= role.position && message.guild.ownerId !== message.member.id) {
      return message.react("❌");
    }

    if (user.roles.cache.has(role.id)) {
      user.roles.remove(role.id);
    } else {
      user.roles.add(role.id);
    }

    return message.react("✅");
  }
};
