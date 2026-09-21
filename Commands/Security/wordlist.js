const { EmbedBuilder, Client, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const { owners } = require(`${process.cwd()}/config`);
const dtb = require(`pro.db`);
const Pro = require(`pro.db`);

module.exports = {
    name: "wordlist",
    aliases: ["wordlist"],
    description: "Show all words in the database.",
  
    run: async (client, message) => {
        if (!owners.includes(message.author.id)) return message.react('❌');
        
        const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) {
            return; 
        }

        const words = dtb.get(`word_${message.guild.id}`);
        if (!Array.isArray(words) || words.length === 0) {
            return message.reply({ content: "**لا يوجد كلمات يعاقب كاتبها .**" });
        }

        // تقسيم الكلمات إلى صفحات (كل صفحة 25 كلمة)
        const itemsPerPage = 25;
        const pages = [];
        
        for (let i = 0; i < words.length; i += itemsPerPage) {
            const pageWords = words.slice(i, i + itemsPerPage);
            pages.push(pageWords);
        }

        let currentPage = 0;

        // دالة لإنشاء الـ Embed للصفحة الحالية
        const createEmbed = (pageIndex) => {
            const pageWords = pages[pageIndex];
            const startIndex = pageIndex * itemsPerPage;
            
            const embed = new EmbedBuilder()
                .setTitle(`📝 قائمة الكلمات المحظورة`)
                .setDescription(`**إجمالي الكلمات:** ${words.length} كلمة`)
                .setColor(0x0099FF)
                .setFooter({ 
                    text: `الصفحة ${pageIndex + 1}/${pages.length} • ${startIndex + 1}-${Math.min(startIndex + itemsPerPage, words.length)} من ${words.length}` 
                })
                .setTimestamp();

            // إضافة الحقول (25 كحد أقصى)
            pageWords.forEach((wordObject, index) => {
                const globalIndex = startIndex + index;
                const addedByUser = client.users.cache.get(wordObject.addedBy);
                const addedByTag = addedByUser?.tag || "مستخدم غير معروف";
                
                embed.addFields({
                    name: `#${globalIndex + 1} - ${wordObject.word || "بدون اسم"}`,
                    value: `👤 أضافها: ${addedByUser ? `<@${addedByUser.id}>` : "غير معروف"}\n🆔 ID: ${wordObject.addedBy || "N/A"}`,
                    inline: true
                });
            });

            return embed;
        };

        // إنشاء الأزرار للتنقل بين الصفحات
        const createButtons = (pageIndex) => {
            const row = new ActionRowBuilder();
            
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId('first')
                    .setLabel('⏮️ الأولى')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(pageIndex === 0),
                
                new ButtonBuilder()
                    .setCustomId('prev')
                    .setLabel('◀️ السابقة')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(pageIndex === 0),
                
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('▶️ التالية')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(pageIndex === pages.length - 1),
                
                new ButtonBuilder()
                    .setCustomId('last')
                    .setLabel('⏭️ الأخيرة')
                    .setStyle(ButtonStyle.Secondary)
                    .setDisabled(pageIndex === pages.length - 1)
            );

            return row;
        };

        // إرسال الرسالة الأولى
        const sentMessage = await message.reply({
            embeds: [createEmbed(currentPage)],
            components: pages.length > 1 ? [createButtons(currentPage)] : []
        });

        // إذا كان هناك صفحة واحدة فقط، لا نحتاج إلى collector
        if (pages.length <= 1) return;

        // إنشاء collector للتعامل مع الأزرار
        const filter = (interaction) => interaction.user.id === message.author.id;
        const collector = sentMessage.createMessageComponentCollector({
            filter,
            time: 60000 // 60 ثانية
        });

        collector.on('collect', async (interaction) => {
            if (!interaction.isButton()) return;

            await interaction.deferUpdate();

            switch (interaction.customId) {
                case 'first':
                    currentPage = 0;
                    break;
                case 'prev':
                    if (currentPage > 0) currentPage--;
                    break;
                case 'next':
                    if (currentPage < pages.length - 1) currentPage++;
                    break;
                case 'last':
                    currentPage = pages.length - 1;
                    break;
            }

            await interaction.editReply({
                embeds: [createEmbed(currentPage)],
                components: [createButtons(currentPage)]
            });
        });

        collector.on('end', () => {
            sentMessage.edit({ components: [] }).catch(() => {});
        });
    }
};