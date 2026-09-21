const db = require("pro.db");
const { EmbedBuilder } = require("discord.js");
const { prefix, owners } = require(`${process.cwd()}/config`);


module.exports = {
  name: 'pslist',
  run: async (client, message) => {

    if (!owners.includes(message.author.id)) return message.react('❌');

    if (!message.guild) return;
    const Color = db.get(`Guild_Color = ${message.guild.id}`) || '#192029';
    if (!Color) return;


    const antibotsStatus = db.get(`antibots-${message.guild.id}`) === 'on' ? 'مُفعل' : 'مُغلق';
    const anticreateStatus = db.get(`anticreate-${message.guild.id}`) === true ? 'مُفعل' : 'مُغلق';
    const antideleteStatus = db.get(`antiDelete-${message.guild.id}`) === true ? 'مُفعل' : 'مُغلق';
    const antijoinStatus = await db.get(`antijoinEnabled_${message.guild.id}`) === true ? 'مُفعل' : 'مُغلق';
    const antilinksStatus = db.get(`antilinks-${message.guild.id}`) === 'on' ? 'مُفعل' : 'مُغلق'; // New line
    const antispamStatus = db.get(`spamProtectionEnabled_${message.guild.id}`) === true ? 'مُفعل' : 'مُغلق'; // New line


    const embed = new EmbedBuilder()
   .setColor(`${Color || `#192029`}`)
    .setDescription(`\`#1\` Antibots: ${antibotsStatus}\n\`#2\` Anticreate: ${anticreateStatus}\n\`#3\` Antidelete: ${antideleteStatus}\n\`#4\` Antijoin: ${antijoinStatus}\n\`#5\` AntiLinks: ${antilinksStatus}\n\`#6\` AntiLinks: ${antilinksStatus}\n\`#7\` AntiSpam: ${antispamStatus}`);
   message.reply({ embeds: [embed] });


  }
}
