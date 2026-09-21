const { EmbedBuilder } = require("discord.js");
const { prefix } = require(`${process.cwd()}/config`);
const Discord = require("discord.js");
const db = require('pro.db');

module.exports = {
  name: "color",
  aliases: ["لون"],
  description: "to choose specific color",
  cooldowns: [10],
  ownerOnly: false,
  run: async (client, message, args) => {

    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
        return; 
    }

    let setChannel = db.get(`setChannel_${message.guild.id}`);
    if (setChannel && message.channel.id !== setChannel) return;
    
  const Color = db.get(`Guild_Color = ${message.guild?.id}`) || `#192029`;
  if (!Color) return; 

    if (!args[0]) {
      const Embed = new EmbedBuilder()
      .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}color 1**`)
      .setColor(`${Color || `#192029`}`)
      message.reply({ embeds: [Embed] });
    }

   const allowedColors = Array.from({ length: 200 }, (_, i) => (i + 1).toString());

    if (!allowedColors.includes(args[0])) {
      return;
    }

    let a = message.guild.roles.cache.find(zeny => {
      return zeny.name.toLowerCase() === `${""}${args.join(" ").toLowerCase()}${""}`;
    });

    if (!a) {
      return message.react("✅");
    }


    const memberRoles = [...message.member.roles.cache.values()];
    memberRoles.forEach(danessa => {
      if (allowedColors.includes(danessa.name.toLowerCase()) && args.join(" ").toLowerCase() !== danessa.name.toLowerCase()) {
        if (message.member.roles.cache.find(erikson => {
          return erikson.id === danessa.id;
        })) {
          message.member.roles.remove(danessa).catch(tyonnah => {
            return message.channel.send(tyonnah.message);
          });
        }
      }
    });

  await message.member.roles.add(a).then((g) => {
  return message.react("✅");

}).catch(kainyn => {
  return message.channel.send(kainyn.message);
});
  }
};