const { EmbedBuilder, PermissionFlagsBits, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { prefix } = require(`${process.cwd()}/config`);
const Data = require('pro.db');
const moment = require('moment');
const { removePunishment } = require('../../utils/punishmentLogger');

module.exports = {
  name: 'sajal',
  aliases: ['سجل', 'log', 'record'],
  run: async (client, message, args) => {
    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
      return;
    }

    const Color = Data.get(`Guild_Color = ${message.guild.id}`) || '#192029';
    if (!Color) return;

    // Get member from mention or ID
    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

    if (!member) {
      const embed = new EmbedBuilder()
        .setColor(`${Color || `#192029`}`)
        .setDescription(`**Please use the command correctly .\n${prefix}record <@user>**`);
      return message.reply({ embeds: [embed] });
    }

    const guildId = message.guild.id;
    const userId = member.id;

    // Get all punishments for the user
    const punishments = Data.get(`punish_${guildId}_${userId}`) || [];

    if (punishments.length === 0) {
      const embed = new EmbedBuilder()
        .setColor(`${Color || `#192029`}`)
        .setDescription(`**❌ No punishment records found for ${member.user.tag}**`);
      return message.reply({ embeds: [embed] });
    }

    // Group punishments by type
    const byType = {};
    punishments.forEach(punish => {
      if (!byType[punish.type]) byType[punish.type] = [];
      byType[punish.type].push(punish);
    });

    // Current date and time
    const currentTime = new Date();
    const formattedTime = moment(currentTime).format('h:mm A');
    const formattedDate = moment(currentTime).format('MMMM Do YYYY');
    
    // Channel name
    const channelName = `#${message.channel.name}`;

    // Create main embed - English version
    const embed = new EmbedBuilder()
      .setColor('#1a1b1e') // Dark theme like in image
      .setTitle(`ZaraSystem`)
      .setDescription(`**APP**\n**${formattedTime}**`)
      .addFields(
        {
          name: `Punishment record for ${member.user.username}`,
          value: `\n**Total Punishments:** ${punishments.length}\n`,
          inline: false
        }
      )
      .setFooter({ 
        text: `Today at ${formattedTime}`,
        iconURL: "https://cdn.discordapp.com/emojis/1224797617235755040.png?size=96&quality=lossless"
      })
      .setTimestamp();

    // Type names in English with icons
    const typeNames = {
      'mute': '🔇 Text Mute',
      'vmute': '🔊 Voice Mute',
      'ban': '🔨 Ban',
      'kick': '👢 Kick',
      'warn': '⚠️ Warn',
      'prison': '🔒 Prison',
      'timeout': '⏱️ Timeout',
      'unprison': '🔓 Unprison',
      'untimeout': '✅ Untimeout'
    };

    // Add fields for each punishment type
    let fieldCount = 0;
    for (const [type, punishes] of Object.entries(byType)) {
      if (fieldCount >= 25) break; // Discord embed field limit
      
      const typeName = typeNames[type] || type;
      const typeIcon = typeName.split(' ')[0]; // Get the emoji
      
      // Format punishments for this type
      let valueText = '';
      punishes.slice(0, 10).forEach((p, i) => {
        const date = moment(p.timestamp).format('YYYY-MM-DD HH:mm');
        const mod = message.guild.members.cache.get(p.moderator)?.user.username || p.moderator;
        const reason = p.reason || 'No reason provided';
        const timeAgo = moment(p.timestamp).fromNow();
        const duration = p.duration ? `\nDuration: ${p.duration}` : '';
        
        valueText += `**${i + 1}. ${typeName}**\n`;
        valueText += `Reason: ${reason}\n`;
        valueText += `By: @${mod}\n`;
        valueText += `Date: ${date}\n`;
        valueText += `Ends: ${p.duration ? `${p.duration} later` : timeAgo}\n\n`;
      });
      
      if (punishes.length > 10) {
        valueText += `*and ${punishes.length - 10} more...*`;
      }

      // Discord embed field value limit is 1024 characters
      if (valueText.length > 1024) {
        valueText = valueText.substring(0, 1021) + '...';
      }

      embed.addFields({
        name: `**${typeName} (${punishes.length})**`,
        value: valueText || 'No punishments',
        inline: false
      });
      
      fieldCount++;
    }

    // Add channel info field
    embed.addFields({
      name: '\u200b',
      value: `${channelName}`,
      inline: false
    });

    // Create select menu for actions
    const actionMenu = new StringSelectMenuBuilder()
      .setCustomId('log_actions')
      .setPlaceholder('Select an action...')
      .addOptions([
        {
          label: 'Remove one punishment',
          value: 'remove_one',
          description: 'Select a punishment to remove',
          emoji: '<:logo:1498436727029628979>'
        },
        {
          label: 'Clear all records',
          value: 'remove_all',
          description: 'Delete all punishments for this user',
          emoji: '<:logo:1498436727029628979>'
        }
      ]);

    const menuRow = new ActionRowBuilder().addComponents(actionMenu);

    const msg = await message.reply({ embeds: [embed], components: [menuRow] });

    // Collector for action menu
    const actionFilter = (i) => i.isStringSelectMenu() && i.customId === 'log_actions' && i.user.id === message.author.id;
    const actionCollector = msg.createMessageComponentCollector({ filter: actionFilter, time: 60000 });

    actionCollector.on('collect', async (interaction) => {
      if (interaction.values[0] === 'remove_all') {
        // Delete all punishments
        Data.delete(`punish_${guildId}_${userId}`);

        const successEmbed = new EmbedBuilder()
          .setColor('#00ff00')
          .setTitle('✅ Success')
          .setDescription(`**All punishment records for ${member.user.username} have been cleared**\n\nDeleted: \`${punishments.length}\` punishments`)
          .setFooter({ 
            text: `Zara System`,
            iconURL: "https://i.ibb.co/ccPmn8cg/zaraicon.webp"
          })
          .setTimestamp();

        await interaction.update({ embeds: [successEmbed], components: [] });
        actionCollector.stop();
        
      } else if (interaction.values[0] === 'remove_one') {
        // Show punishment selection menu
        const punishmentOptions = punishments.slice(0, 25).map((p, index) => {
          const date = moment(p.timestamp).format('MM/DD');
          const reason = p.reason || 'No reason';
          const shortReason = reason.length > 30 ? reason.substring(0, 27) + '...' : reason;
          const typeName = typeNames[p.type] || p.type;
          
          return {
            label: `${index + 1}. ${shortReason}`,
            value: p.id.toString(),
            description: `${date} - ${typeName}`,
            emoji: '<:logo:1498436727029628979>'
          };
        });

        const punishmentMenu = new StringSelectMenuBuilder()
          .setCustomId('punishment_select')
          .setPlaceholder('Select punishment to remove...')
          .addOptions(punishmentOptions);

        const punishmentRow = new ActionRowBuilder().addComponents(punishmentMenu);

        const selectEmbed = new EmbedBuilder()
          .setColor('#1a1b1e')
          .setTitle('Select Punishment')
          .setDescription(`**Select which punishment to remove from ${member.user.username}'s record:**`)
          .setFooter({ 
            text: `Zara System`,
            iconURL: "https://i.ibb.co/ccPmn8cg/zaraicon.webp"
          });

        await interaction.update({ embeds: [selectEmbed], components: [punishmentRow] });

        // Collector for punishment selection
        const punishmentFilter = (i) => i.isStringSelectMenu() && i.customId === 'punishment_select' && i.user.id === message.author.id;
        const punishmentCollector = msg.createMessageComponentCollector({ filter: punishmentFilter, time: 60000, max: 1 });

        punishmentCollector.on('collect', async (punishmentInteraction) => {
          const punishId = parseInt(punishmentInteraction.values[0]);
          const removed = removePunishment(guildId, userId, punishId);

          if (removed) {
            const removedPunishment = punishments.find(p => p.id === punishId);
            const successEmbed = new EmbedBuilder()
              .setColor('#00ff00')
              .setTitle('✅ Success')
              .setDescription(`**Punishment removed successfully**\n\nType: \`${removedPunishment?.type || 'Unknown'}\`\nReason: \`${removedPunishment?.reason || 'No reason'}\`\nDate: \`${moment(removedPunishment?.timestamp).format('YYYY-MM-DD HH:mm')}\``)
              .setFooter({ 
                text: `Zara System`,
                iconURL: "https://i.ibb.co/ccPmn8cg/zaraicon.webp"
              })
              .setTimestamp();

            await punishmentInteraction.update({ embeds: [successEmbed], components: [] });
          } else {
            const errorEmbed = new EmbedBuilder()
              .setColor('#ff0000')
              .setTitle('❌ Error')
              .setDescription(`**Failed to remove punishment**`)
              .setFooter({ 
                text: `Zara System`,
                iconURL: "https://i.ibb.co/ccPmn8cg/zaraicon.webp"
              });

            await punishmentInteraction.update({ embeds: [errorEmbed], components: [] });
          }
          punishmentCollector.stop();
          actionCollector.stop();
        });

        punishmentCollector.on('end', async (collected) => {
          if (collected.size === 0) {
            await msg.edit({ components: [] }).catch(() => {});
          }
        });
      }
    });

    actionCollector.on('end', async (collected) => {
      if (collected.size === 0) {
        await msg.edit({ components: [] }).catch(() => {});
      }
    });
  }
};