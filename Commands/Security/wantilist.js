const { EmbedBuilder } = require('discord.js');
const Pro = require('pro.db');
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: 'wantilist',
  aliases: ['عرض-المحظورين'],
  run: async (client, message, args) => {

    if (!owners.includes(message.author.id)) return message.react('❌');
    const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
        return; 
    }

    const Color = Pro.get(`Guild_Color = ${message.guild.id}`) || '#192029';
    if (!Color) return;
    
    const wantilist = Pro.get(`wanti_${message.guild.id}`) || [];
    
    if (wantilist.length === 0) {
      return message.react('❌');
    }
    
    const embed = new EmbedBuilder()
    .setColor(Color)
    .setDescription(wantilist.map((userID, index) => `\`#${index + 1}\` <@${userID}>`).join('\n'));
    
    // أرسل Embed
    message.reply({ embeds: [embed] });
  },
};
