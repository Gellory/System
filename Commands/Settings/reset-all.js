const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Data = require("pro.db");
const { owners, prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: 'reset-all',
  run: async (client, message, args) => {

    if (!owners.includes(message.author.id)) return message.react('❌');

    const allUsers = await Data.fetchAll();
    let totalPoints = 0;
    let usersCount = 0;
    for (const [key, value] of Object.entries(allUsers)) {
        if (key.endsWith("_points") || key.endsWith("_voice")) {
            totalPoints += value;
            usersCount++;
        }
    }

    const confirmationMessage = await message.channel.send({
        content: `هل ترغب حقًا في مسح جميع النقاط لجميع المستخدمين؟\n**إجمالي النقاط:** ${totalPoints}\n**عدد الأشخاص:** ${usersCount}`,
        components: [
            new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('confirm')
                        .setLabel('نعم')
                        .setStyle(ButtonStyle.Success),
                    new ButtonBuilder()
                        .setCustomId('cancel')
                        .setLabel('إلغاء')
                        .setStyle(ButtonStyle.Danger)
                )
        ]
    });

    // Listen for button click
    const filter = interaction => interaction.user.id === message.author.id;
    const collector = confirmationMessage.createMessageComponentCollector({ filter, time: 15000 });

    collector.on('collect', async interaction => {
        if (interaction.customId === 'confirm') {
            for (const [key, value] of Object.entries(allUsers)) {
                if (key.endsWith("_points") || key.endsWith("_voice")) {
                    Data.delete(key); // Delete points data
                }
            }
            message.reply("> **تم مسح النقاط لجميع المستخدمين.** ✅");
            confirmationMessage.delete();
            collector.stop();
        } else if (interaction.customId === 'cancel') {
            message.reply("> **تم إلغاء عملية مسح النقاط لجميع المستخدمين.** ✅");
            confirmationMessage.delete();
            collector.stop();
        }
    });

    collector.on('end', () => {
        confirmationMessage.delete();
    });
  }
};
