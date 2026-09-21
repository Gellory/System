const { ActionRowBuilder, ButtonBuilder, EmbedBuilder, ButtonStyle } = require('discord.js');
const Data = require("pro.db");
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
    name: 'total',
    aliases: ['rlevel'],
    run: async (client, message, args) => {

        const Color = Data.get(`Guild_Color = ${message.guild.id}`) || '#192029';
        if (!Color) return;

        if (!owners.includes(message.author.id)) return message.react('❌');

        const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) {
            return;
        }

        const allUsers = await Data.fetchAll();
        const userTextEntries = Object.entries(allUsers).filter(([key, value]) => key.endsWith("_points"));
        const userVoiceEntries = Object.entries(allUsers).filter(([key, value]) => key.endsWith("_voice"));

        let totalPoints = 0;

        const combinedEntries = userTextEntries.map(([key, value]) => {
            const userId = key.split("_")[0];
            const voicePoints = userVoiceEntries.find(([k, v]) => k.startsWith(userId)) ? userVoiceEntries.find(([k, v]) => k.startsWith(userId))[1] : 0;
            return [userId, value + voicePoints];
        });

        combinedEntries.sort((a, b) => b[1] - a[1]);
        let userPointsString = combinedEntries.map(([userId, points], index) => `**#${index + 1}.** <@${userId}>: ${points} XP`);

        if (userPointsString.length === 0) {
            message.react("🍇");
            return;
        }

        totalPoints = combinedEntries.reduce((acc, [, points]) => acc + points, 0);

        const totalPages = Math.ceil(userPointsString.length / 15);
        let page = 1;

        const sendList = (page) => {
            const start = (page - 1) * 15;
            const end = page * 15;
            const pageEntries = userPointsString.slice(start, end);
            const embed = new EmbedBuilder()
                .setDescription(pageEntries.join('\n'))
                .setColor(`${Color || `#192029`}`);
            return embed;
        };

        const messageToSend = await message.reply({ embeds: [sendList(page)], components: [createButtons()] });

        const filter = i => i.user.id === message.author.id;
        const collector = messageToSend.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 'previous') {
                page = Math.max(1, page - 1);
            } else if (i.customId === 'next') {
                page = Math.min(totalPages, page + 1);
            }

            await i.update({ embeds: [sendList(page)], components: [createButtons()] });
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                messageToSend.edit({ embeds: [sendList(page)], components: [] });
            }
        });

        function createButtons() {
            const previousButton = new ButtonBuilder()
                .setCustomId('previous')
                .setEmoji("⬅️")
                .setStyle(ButtonStyle.Primary);

            const nextButton = new ButtonBuilder()
                .setCustomId('next')
                .setEmoji("➡️")
                .setStyle(ButtonStyle.Primary);

            const row = new ActionRowBuilder()
                .addComponents(previousButton, nextButton);

            // Disable buttons if there are less than 2 pages
            if (totalPages <= 1) {
                row.components.forEach(component => component.setDisabled(true));
            }

            return row;
        }
    }
};
