const db = require("pro.db");
const humanizeDuration = require('humanize-duration');
const Discord = require('discord.js');
const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = async (client, channel) => {
  
        if (!channel.guild) return;
        if (!channel.guild.members.me.permissions.has(PermissionFlagsBits.EmbedLinks)) return;
        if (!channel.guild.members.me.permissions.has(PermissionFlagsBits.ViewAuditLog)) return;
        let logchannels = db.get(`logchannels_${channel.guild.id}`); // Fetching log pic channel ID from the database
        var logChannel = channel.guild.channels.cache.find(c => c.id === logchannels);
        if (!logChannel) return;
      
        if (channel.type === 0) {
          var roomType = 'Text';
        } else if (channel.type === 2) {
          var roomType = 'Voice';
        } else if (channel.type === 4) {
          var roomType = 'Category';
        }
      
        channel.guild.fetchAuditLogs().then(logs => {
          var userID = logs.entries.first().executor.id;
          client.users.fetch(userID).then(user => {
            let channelCreate = new EmbedBuilder()
              .setAuthor({ name: user.username, iconURL: user.displayAvatarURL({ extension: 'png' }) })
              .setThumbnail('https://cdn.discordapp.com/attachments/1093303174774927511/1138891156818772018/8C926555-671C-4F9C-9136-DAD2229375B4.png')
              .setDescription(`**إنشاء قناة**\n\n**بواسطة : <@${userID}>**\n**قناة : <#${channel.id}>**\n**إنشاء : ${roomType}**\n`)
              .setColor(`#524053`)
              .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL({ extension: 'png' }) })
            logChannel.send({ embeds: [channelCreate] });
          });
        });

    }

