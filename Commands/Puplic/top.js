const { EmbedBuilder } = require('discord.js');
const Data = require("pro.db");

module.exports = {
  name: 'top',
  aliases: ['top'],
  run: async (client, message, args) => {

    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
        return; 
    }


    const Color = Data.get(`Guild_Color = ${message.guild.id}`) || '#192029';
    if (!Color) return;


    let setChannel = Data.get(`setChannel_${message.guild.id}`);
    if (setChannel && message.channel.id !== setChannel) return;

    const allUsers = await Data.fetchAll();
    const userTextEntries = Object.entries(allUsers).filter(([key, value]) => key.endsWith("_points"));
    const userVoiceEntries = Object.entries(allUsers).filter(([key, value]) => key.endsWith("_voice"));
    userTextEntries.sort((a, b) => b[1] - a[1]);
    userVoiceEntries.sort((a, b) => b[1] - a[1]);
    const topTextUsers = userTextEntries.slice(0, 8);
    const topVoiceUsers = userVoiceEntries.slice(0, 8);

    if (topTextUsers.length === 0 && topVoiceUsers.length === 0) {
        message.react("🍇");
        return; // توقف إذا لم تكن هناك بيانات لعرضها
    }

    let embed = new EmbedBuilder();

    if (topTextUsers.length > 0 && topVoiceUsers.length === 0) {
        embed.addFields([{ name: "Text Level", value: formatTopUsers(topTextUsers), inline: true }]);
        embed.setColor(`${Color || `#192029`}`)

    }
    else if (topVoiceUsers.length > 0 && topTextUsers.length === 0) {
        embed.addFields([{ name: "Voice Level", value: formatTopUsers(topVoiceUsers), inline: true }]);
        embed.setColor(`${Color || `#192029`}`)

    }
    else {
        embed.addFields(
            { name: "Text Level", value: formatTopUsers(topTextUsers), inline: true },
            { name: "Voice Level", value: formatTopUsers(topVoiceUsers), inline: true }
        );
        embed.setColor(`${Color || `#192029`}`)
    }

    message.reply({ embeds: [embed] });
  }
};

function formatTopUsers(users) {
  return users.map(([key, value], index) => `**#${index + 1}. <@${key.split("_")[0]}> ${value} Xp**`).join('\n');
}
