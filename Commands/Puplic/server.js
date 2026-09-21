const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const db = require("pro.db");
const Data = require("pro.db");

module.exports = {
  name: 'server',
  aliases: ["سيرفر"],
  run: async (client, message, args) => {

    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
        return; 
    }

      const Color = db.get(`Guild_Color = ${message.guild?.id}`)  || `#192029`
                if (!Color) return;
        let setchannek = Data.get(`setChannel_${message.guild.id}`);
        if (setchannek && message.channel.id !== setchannek) return; // Check if setChannel is defined and if the message is not in the specified channel
    
        await message.guild.members.fetch();
        const members = message.guild.members.cache;
        const channels = message.guild.channels.cache;
        const emojis = message.guild.emojis.cache.size;
        const firstFiveEmojis = message.guild.emojis.cache.map(emoji => emoji).slice(0, 5).join(' ');
        const boostCount = message.guild.premiumSubscriptionCount;
        const verificationLevel = message.guild.verificationLevel;
        const rolesCount = message.guild.roles.cache.size;

        await message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor(`${Color  || `#192029`}`)
            //  .setAuthor({ name: `${message.guild.name}'معلومات`, iconURL: message.guild.iconURL({ dynamic: true, size: 1024, format: 'png' }) })
            //  .setThumbnail(message.guild.iconURL({ dynamic: true, size: 1024, format: 'png' }))
              .addFields(
                { name: '🆔 سيرفر ايدي:', value: `${message.guildId}`, inline: true },
                { name: '📆 تاريخ الإنشاء:', value: `**<t:${Math.floor(message.guild.createdTimestamp / 1000)}:R>**`, inline: true },
                { name: '👑 مالك السيرفر:', value: `<@!${message.guild.ownerId}>`, inline: true },
                { name: `👥  الاعضاء (${message.guild.memberCount}):`, value: `**${members.filter(member => member.presence?.status === 'online').size + members.filter(member => member.presence?.status === 'idle').size + members.filter(member => member.presence?.status === 'dnd').size}** Online | Idle | DND\n**${members.filter(member => !['online', 'idle', 'dnd'].includes(member.presence?.status)).size}** Offline\n**${members.filter(member => member.user.bot).size}** Bot`, inline: true },
                { name: `💬 الرومات (${message.guild.channels.cache.size}):`, value: `**${channels.filter(channel => channel.type === 0).size}** Text | **${channels.filter(channel => channel.type === 2).size}** Voice\n**${channels.filter(channel => channel.type === 4).size}** Category`, inline: true },
                { name: `🌐 آخر:`, value: `Verification Level: **${verificationLevel}**\nBoosts: **${boostCount}** 🔮\nRoles: **${rolesCount}**`, inline: true },
                { name: `🛡️ الإموجيات (${emojis}):`, value: `**${firstFiveEmojis}**`, inline: true },
              )
          ]
        });
      
  }
};
