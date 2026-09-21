const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { prefix, owners } = require(`${process.cwd()}/config`);
const db = require("pro.db");
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

module.exports = {
    name: "setchats",
    description: "إعدادات الشات المتقدمة",
    usage: "#setchats",
    run: async (client, message) => {
        console.log('Command setchats executed by:', message.author.tag);

        if (!owners.includes(message.author.id)) {
            console.log('User not in owners list');
            return message.react('❌');
        }

        const isEnabled = db.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) {
            return;
        }

        const Color = db.get(`Guild_Color_${message.guild.id}`) || '#192029';

        // جلب الشاتات المحفوظة
        const lineChannels = await db.get("Channels") || [];
        const picChannels = db.get(`setChannels_${message.guild.id}`) || [];
        
        // إنشاء قائمة الشاتات
        let lineChannelsList = "لا يوجد شاتات محددة";
        let picChannelsList = "لا يوجد شاتات محددة";
        let reactChannelsList = "لا يوجد شاتات محددة";
        
        if (lineChannels.length > 0) {
            lineChannelsList = lineChannels.map(ch => {
                const channel = message.guild.channels.cache.get(ch.channelID);
                return channel ? `${channel}` : "شات غير موجود";
            }).join('\n') || "لا يوجد شاتات محددة";
        }
        
        if (picChannels.length > 0) {
            picChannelsList = picChannels.map(chId => {
                const channel = message.guild.channels.cache.get(chId);
                return channel ? `${channel}` : "شات غير موجود";
            }).join('\n') || "لا يوجد شاتات محددة";
        }
        
        // جلب شاتات الريأكشن
        const allChannels = message.guild.channels.cache.filter(ch => ch.type === 0);
        const reactChannels = [];
        allChannels.forEach(channel => {
            if (db.has(`RoomInfo_${channel.id}`)) {
                reactChannels.push(channel);
            }
        });
        
        if (reactChannels.length > 0) {
            reactChannelsList = reactChannels.map(ch => `${ch}`).join('\n') || "لا يوجد شاتات محددة";
        }

        // إنشاء الإيمبيد الرئيسي مع الأزرار بداخله
        const mainEmbed = new EmbedBuilder()
            .setColor(Color)
            .setTitle('**⚙️ إعدادات الشات المتقدمة**')
            .setDescription('**اختر الوظيفة التي تريد إعدادها:**\n\n' +
                '� **[ Line ]** - إضافة فاصل تلقائي للشات\n' +
                '� **[ React ]** - إضافة رياكشن تلقائي للشات\n' +
                '� **[ Pic ]** - تحديد شات للصور فقط')
            .addFields(
                { name: '**📝 شاتات الفاصل التلقائي:**', value: lineChannelsList, inline: false },
                { name: '**😊 شاتات الريأكشن التلقائي:**', value: reactChannelsList, inline: false },
                { name: '**🖼️ شاتات الصور فقط:**', value: picChannelsList, inline: false }
            )
            .setFooter({ 
                text: 'ZaraStore • اضغط على الزر المناسب للوظيفة المطلوبة', 
                iconURL: 'https://i.ibb.co/DfpnHFFz/logo3d.png'
            })
            .setTimestamp();

        // إنشاء الأزرار
        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('setLine')
                    .setLabel('Line')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('<:logo:1498436727029628979>'),
                new ButtonBuilder()
                    .setCustomId('setReact')
                    .setLabel('React')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('<:logo:1498436727029628979>'),
                new ButtonBuilder()
                    .setCustomId('setPic')
                    .setLabel('Pic')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('<:logo:1498436727029628979>')
            );

        const sentMessage = await message.reply({ 
            embeds: [mainEmbed], 
            components: [row] 
        });

        const filter = interaction => {
            return ['setLine', 'setReact', 'setPic'].includes(interaction.customId) 
                && interaction.user.id === message.author.id;
        };

        const collector = sentMessage.createMessageComponentCollector({ 
            filter, 
            time: 60000 
        });

        collector.on('collect', async interaction => {
            if (interaction.customId === 'setLine') {
                await handleSetLine(interaction, message, Color);
            } else if (interaction.customId === 'setReact') {
                await handleSetReact(interaction, message, Color);
            } else if (interaction.customId === 'setPic') {
                await handleSetPic(interaction, message, Color);
            }
        });

        collector.on('end', (collected, reason) => {
            if (collected.size === 0) {
                sentMessage.edit({ components: [] }).catch(() => {});
            }
        });
    },
};

// دالة معالجة إضافة الخط
async function handleSetLine(interaction, message, Color) {
    await interaction.deferUpdate();
    
    const embed = new EmbedBuilder()
        .setColor(Color)
        .setTitle('**📝 إضافة فاصل تلقائي**')
        .setDescription('**يرجى منشن الشات الذي تريد إضافة الفاصل التلقائي إليه**')
        .setFooter({ text: 'ZaraStore • ', iconURL: 'https://i.ibb.co/DfpnHFFz/logo3d.png' });

    await interaction.followUp({ embeds: [embed] });

    const channelCollector = interaction.channel.createMessageCollector({
        filter: m => m.author.id === message.author.id && m.mentions.channels.size > 0,
        max: 1,
        time: 30000
    });

    channelCollector.on('collect', async m => {
        const channel = m.mentions.channels.first();
        if (!channel) {
            return m.reply('**يرجى منشن شات صحيح**');
        }

        const lineEmbed = new EmbedBuilder()
            .setColor(Color)
            .setTitle('**📝 إضافة فاصل تلقائي**')
            .setDescription('**يرجى إرفاق صورة الفاصل التلقائي**')
            .setFooter({ text: 'ZaraStore • ', iconURL: 'https://i.ibb.co/DfpnHFFz/logo3d.png' });

        await m.reply({ embeds: [lineEmbed] });

        const imageCollector = interaction.channel.createMessageCollector({
            filter: msg => msg.author.id === message.author.id && msg.attachments.size > 0,
            max: 1,
            time: 60000
        });

        imageCollector.on('collect', async msg => {
            const attachment = msg.attachments.first();
            if (!attachment) {
                return msg.reply('**يرجى إرفاق صورة صحيحة**');
            }

            try {
                // حفظ الصورة
                const imageFileName = `Line_${channel.id}.png`;
                const imagePath = path.join(process.cwd(), "Fonts", imageFileName);
                
                // إنشاء مجلد Fonts إذا لم يكن موجوداً
                if (!fs.existsSync(path.join(process.cwd(), "Fonts"))) {
                    fs.mkdirSync(path.join(process.cwd(), "Fonts"), { recursive: true });
                }

                const response = await fetch(attachment.url);
                const buffer = await response.buffer();
                fs.writeFileSync(imagePath, buffer);

                // حفظ في قاعدة البيانات
                const storedChannels = await db.get("Channels") || [];
                const existingChannelIndex = storedChannels.findIndex(ch => ch.channelID === channel.id);
                
                if (existingChannelIndex !== -1) {
                    storedChannels[existingChannelIndex].fontURL = imagePath;
                } else {
                    storedChannels.push({ channelID: channel.id, fontURL: imagePath });
                }

                db.set("Channels", storedChannels);

                const successEmbed = new EmbedBuilder()
                    .setColor(Color)
                    .setTitle('**✅ تمت إضافة الفاصل التلقائي**')
                    .setDescription(`**تم إضافة الفاصل التلقائي إلى شات ${channel} بنجاح**`)
                    .setFooter({ text: 'ZaraStore • ', iconURL: 'https://i.ibb.co/DfpnHFFz/logo3d.png' })
                    .setTimestamp();

                await msg.reply({ embeds: [successEmbed] });
                await msg.react('✅');

            } catch (error) {
                console.error(error);
                await msg.reply('**حدث خطأ أثناء حفظ الصورة**');
            }
        });
    });
}

// دالة معالجة إضافة الريأكشن
async function handleSetReact(interaction, message, Color) {
    await interaction.deferUpdate();
    
    const embed = new EmbedBuilder()
        .setColor(Color)
        .setTitle('**😊 إضافة رياكشن تلقائي**')
        .setDescription('**يرجى منشن الشات الذي تريد إضافة الريأكشن التلقائي إليه**')
        .setFooter({ text: 'ZaraStore • ', iconURL: 'https://i.ibb.co/DfpnHFFz/logo3d.png' });

    await interaction.followUp({ embeds: [embed] });

    const channelCollector = interaction.channel.createMessageCollector({
        filter: m => m.author.id === message.author.id && m.mentions.channels.size > 0,
        max: 1,
        time: 30000
    });

    channelCollector.on('collect', async m => {
        const channel = m.mentions.channels.first();
        if (!channel) {
            return m.reply('**يرجى منشن شات صحيح**');
        }

        const reactEmbed = new EmbedBuilder()
            .setColor(Color)
            .setTitle('**😊 إضافة رياكشن تلقائي**')
            .setDescription('**يرجى إرفاق الريأكشن التلقائي (إيموجي)**')
            .setFooter({ text: 'ZaraStore • ', iconURL: 'https://i.ibb.co/DfpnHFFz/logo3d.png' });

        await m.reply({ embeds: [reactEmbed] });

        const emojiCollector = interaction.channel.createMessageCollector({
            filter: msg => msg.author.id === message.author.id && msg.content.trim().length > 0,
            max: 1,
            time: 30000
        });

        emojiCollector.on('collect', async msg => {
            const emoji = msg.content.trim();
            
            db.set(`RoomInfo_${channel.id}`, {
                Channel_Id: channel.id,
                Emoji1_Id: emoji,
                Emoji2_Id: null,
                Emoji3_Id: null,
                Emoji4_Id: null,
                Emoji5_Id: null,
                Emoji6_Id: null
            });

            const successEmbed = new EmbedBuilder()
                .setColor(Color)
                .setTitle('**✅ تمت إضافة الريأكشن التلقائي**')
                .setDescription(`**تم إضافة الريأكشن ${emoji} إلى شات ${channel} بنجاح**`)
                .setFooter({ text: 'ZaraStore • ', iconURL: 'https://i.ibb.co/DfpnHFFz/logo3d.png' })
                .setTimestamp();

            await msg.reply({ embeds: [successEmbed] });
            await msg.react('✅');
        });
    });
}

// دالة معالجة تحديد شات الصور
async function handleSetPic(interaction, message, Color) {
    await interaction.deferUpdate();
    
    const embed = new EmbedBuilder()
        .setColor(Color)
        .setTitle('**🖼️ تحديد شات الصور**')
        .setDescription('**يرجى منشن الشات الذي تريد تحديده للصور فقط**')
        .setFooter({ text: 'ZaraStore • ', iconURL: 'https://i.ibb.co/DfpnHFFz/logo3d.png' });

    await interaction.followUp({ embeds: [embed] });

    const channelCollector = interaction.channel.createMessageCollector({
        filter: m => m.author.id === message.author.id && m.mentions.channels.size > 0,
        max: 1,
        time: 30000
    });

    channelCollector.on('collect', async m => {
        const channel = m.mentions.channels.first();
        if (!channel) {
            return m.reply('**يرجى منشن شات صحيح**');
        }

        let channels = db.get(`setChannels_${message.guild.id}`) || [];
        
        if (!channels.includes(channel.id)) {
            channels.push(channel.id);
        }

        db.set(`setChannels_${message.guild.id}`, channels);

        const successEmbed = new EmbedBuilder()
            .setColor(Color)
            .setTitle('**✅ تم تحديد شات الصور**')
            .setDescription(`**تم تحديد شات ${channel} للصور فقط بنجاح**\n**سيتم حذف أي رسالة غير صور في هذا الشات تلقائياً**`)
            .setFooter({ text: 'ZaraStore' })
            .setTimestamp();

        await m.reply({ embeds: [successEmbed] });
        await m.react('✅');
    });
}
