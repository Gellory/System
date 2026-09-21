const { StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { owners } = require(`${process.cwd()}/config`);
const config = require(`${process.cwd()}/config`);
const Data = require('pro.db');
const Pro = require('pro.db');

module.exports = {
  name: "setrjoin",
  run: async (client, message, args) => {

    if (!owners.includes(message.author.id)) return message.react('❌');

    const punishmentMenu = new StringSelectMenuBuilder()
      .setCustomId('punishmentMenu')
      .setPlaceholder('يرجى الاختيار ..')
      .addOptions([
        {
          label: 'Kick',
          value: 'kick',
          emoji: '<:logo:1498436727029628979>',
          description: 'طرد الحسابات الجديدة من السيرفر',
        },
        {
          label: 'Ban',
          value: 'ban',
          emoji: '<:logo:1498436727029628979>',
          description: 'حظر الحسابات الجديدة من السيرفر',
        },
        {
          label: 'prison',
          value: 'prison',
          emoji: '<:logo:1498436727029628979>',
          description: 'سجن الحسابات الجديدة من السيرفر',
        },
      ]);

    const selectRow = new ActionRowBuilder()
      .addComponents(punishmentMenu);

    const deleteButton = new ButtonBuilder()
      .setCustomId('joincanls')
      .setLabel('الغاء')
      .setStyle(ButtonStyle.Secondary);

    const buttonRow = new ActionRowBuilder().addComponents(deleteButton);

    const reply = await message.reply({ content: '**أختار الاجراء المنآسب لك.**', components: [selectRow, buttonRow] });

    const filter = (interaction) => interaction.user.id === message.author.id;
    const collector = message.channel.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async (interaction) => {
      if (!interaction.isStringSelectMenu()) return;

      const punishment = interaction.values[0];

      // Save the chosen punishment to the database
      await Data.set(`antijoinPunishment_${message.guild.id}`, punishment);

      // Delete the message
      try {
        await reply.delete();
        message.react("✅");
      } catch (error) {
        console.error('Error deleting message:', error);
      }

      collector.stop();

      switch (punishment) {
        case 'kick':
          // Handle kick action
          break;
        case 'ban':
          // Handle ban action
          break;
        case 'prison':
          // Handle mute action
          break;
        default:
          // Handle default action
          break;
      }
    });

    client.on('interactionCreate', async (interaction) => {
      if (!interaction.isButton()) return;

      if (interaction.customId === 'joincanls') {
        try {
          await interaction.message.delete();
        } catch (error) {
          console.error('Error deleting message:', error);
        }
      }
    });
  },
};
