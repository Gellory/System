const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { prefix, owners } = require(`${process.cwd()}/config`);
const db = require("pro.db");

module.exports = {
    name: "setclear",
    description: "To set channel room",
    usage: "!setclear <channel>",
    run: async (client, message) => {

        if (!owners.includes(message.author.id)) return message.react('❌');
        const isEnabled = db.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) {
            return; 
        }
    

        const Color = db.get(`Guild_Color_${message.guild.id}`) || '#192029';

        const mentionedChannel = message.mentions.channels.first();
        const channelIdArgument = message.content.split(" ")[1];
        const channel = mentionedChannel || message.guild.channels.cache.get(channelIdArgument);

        if (!channel) {
            const embed = new EmbedBuilder()
                .setColor(Color)
                .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}setclear <#${message.channel.id}>**`);
            return message.reply({ embeds: [embed] });
        }


        const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('clearOptions')
                .setPlaceholder('قم باختيار الخيار المناسب لك.')
                .addOptions([
                    {
                        label: 'علبة الألوان',
                        description: 'لإختيار علبه الآلوان بنظام القائمة',
                        value: 'colorsClear',
                        emoji: { id: '1438214259073875968' } // استخدام object للإيموجي
                    },
                    {
                        label: 'علبة الألوان',
                        description: 'لإختيار علبه الآلوان بنظام العادي',
                        value: 'normalClear',
                        emoji: { id: '1438214259073875968' }
                    },{
                        label: 'إلغاء تحديد',
                        description: 'لإلغاء تحديد شاتات علبه الآلوان المحفوظه',
                        value: 'Deletecolorslinst',
                        emoji: { id: '1438214259073875968' }
                    },
                ]),
        );

        const deleteButton = new ButtonBuilder()
            .setCustomId('Cancel2')
            .setLabel('الغاء')
            .setStyle(ButtonStyle.Danger);

        const buttonRow = new ActionRowBuilder().addComponents(deleteButton);

        const sentMessage = await message.reply({ 
            content: '**اختار النظام المفضل لديك لعلبة الألوان.**', 
            components: [row, buttonRow] 
        });

        const filter = interaction => {
            return (interaction.customId === 'clearOptions' || interaction.customId === 'Cancel2') 
                && interaction.user.id === message.author.id;
        };

        const collector = sentMessage.createMessageComponentCollector({ 
            filter, 
            time: 60000 
        });

        collector.on('collect', async interaction => {
            if (interaction.isStringSelectMenu() && interaction.customId === 'clearOptions') {
                const selectedValue = interaction.values[0];
                
                if (selectedValue === 'colorsClear') {
                    if (db.has(`avtclear`)) {
                        db.delete(`avtclear`);
                        await message.react("✅");
                    }
                    db.set(`Channel = [ Colors ]`, channel.id);
                    await interaction.deferUpdate();
                    await message.react("✅");
                    await sentMessage.delete();
                } else if (selectedValue === 'normalClear') {
                    if (db.has(`Channel = [ Colors ]`)) {
                        db.delete(`Channel = [ Colors ]`);
                        await message.react("✅");
                    }
                    db.set(`avtclear`, channel.id);
                    await interaction.deferUpdate();
                    await message.react("✅");
                    await sentMessage.delete();
                } else if (selectedValue === 'Deletecolorslinst') {
                    if (db.has(`Channel = [ Colors ]`)) {
                        db.delete(`Channel = [ Colors ]`);
                        await message.react("✅");
                    }
                    if (db.has(`avtclear`)) {
                        db.delete(`avtclear`);
                        await message.react("✅");
                    }
                    await interaction.deferUpdate();
                    await sentMessage.delete();
                }
                collector.stop();
                
            } else if (interaction.isButton() && interaction.customId === 'Cancel2') {
                await interaction.deferUpdate();
                await sentMessage.delete();
                collector.stop();
            }
        });

        collector.on('end', (collected, reason) => {
            if (collected.size === 0) {
                sentMessage.edit({ components: [] }).catch(() => {});
            }
        });
    },
};