const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const { prefix, owners } = require(`${process.cwd()}/config`);
const db = require("pro.db");
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

module.exports = {
    name: "scolors",
    description: "To set channel room",
    usage: "scolors <channel>",
    run: async (client, message) => {
        console.log('Command scolors executed by:', message.author.tag);

        if (!owners.includes(message.author.id)) {
            console.log('User not in owners list');
            return message.react('❌');
        }
        const isEnabled = db.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) {
            return; 
        }
    

        const Color = db.get(`Guild_Color_${message.guild.id}`) || '#192029';

        const mentionedChannel = message.mentions.channels.first();
        const channelIdArgument = message.content.split(" ")[1];
        const channel = mentionedChannel || message.guild.channels.cache.get(channelIdArgument);

        if (!channel) {
            console.log('No channel provided');
            const embed = new EmbedBuilder()
                .setColor(Color)
                .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}scolors <#${message.channel.id}>**`);
            return message.reply({ embeds: [embed] });
        }
        
        console.log('Channel found:', channel.name);


        const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
                .setCustomId('clearOptions')
                .setPlaceholder('قم باختيار الخيار المناسب لك.')
                .addOptions([
                    {
                        label: 'علبة الألوان',
                        description: 'لإختيار علبه الآلوان بنظام القائمة',
                        value: 'colorsClear',
                        emoji: { id: '1438214259073875968' }
                    },
                    {
                        label: 'علبة الألوان',
                        description: 'لإختيار علبه الآلوان بنظام العادي',
                        value: 'normalClear',
                        emoji: { id: '1438214259073875968' }
                    },
                    {
                        label: 'تحديد خلفية علبة الألوان',
                        description: 'لإضافة صورة خلفية لعلبة الألوان',
                        value: 'setColorBackground',
                        emoji: { id: '1438214259073875968' }
                    },
                    {
                        label: 'تحديد دقائق المسح التلقائي',
                        description: 'لتحديد دقائق المسح التلقائي للشات',
                        value: 'setAutoClearMinutes',
                        emoji: { id: '1438214259073875968' }
                    },
                    {
                        label: 'تحديد رولات الألوان',
                        description: 'لتحديد رولات صلاحية الألوان',
                        value: 'setColorRoles',
                        emoji: { id: '1438214259073875968' }
                    },
                    {
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

        try {
            const sentMessage = await message.reply({ 
                content: '**اختار النظام المفضل لديك لعلبة الألوان.**', 
                components: [row, buttonRow] 
            });
            console.log('Message sent successfully');

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
                } else if (selectedValue === 'setColorBackground') {
                    await interaction.deferUpdate();
                    
                    const embed = new EmbedBuilder()
                        .setColor(Color)
                        .setDescription('**يرجى إرفاق الصورة التي تريد استخدامها كخلفية لعلبة الألوان.**');
                    
                    await interaction.followUp({ embeds: [embed] });
                    
                    const messageCollector = interaction.channel.createMessageCollector({
                        filter: m => {
                            console.log('Filter check - User ID:', m.author.id, 'Expected:', message.author.id);
                            console.log('Filter check - Attachments size:', m.attachments.size);
                            return m.author.id === message.author.id && m.attachments.size > 0;
                        },
                        max: 1,
                        time: 60000
                    });
                    
                    messageCollector.on('collect', async m => {
                        console.log('Collected message for background image:', m.attachments.size, 'attachments');
                        console.log('Message content:', m.content);
                        console.log('All attachments:', Array.from(m.attachments.values()));
                        
                        const attachment = m.attachments.first();
                        if (attachment) {
                            console.log('Attachment URL:', attachment.url);
                            console.log('Attachment filename:', attachment.name);
                            console.log('Attachment content type:', attachment.contentType);
                        }
                        
                        const isValidImage = attachment && (
                            attachment.url.endsWith('.png') || 
                            attachment.url.endsWith('.jpg') || 
                            attachment.url.endsWith('.jpeg') || 
                            attachment.url.endsWith('.gif') ||
                            attachment.contentType?.startsWith('image/')
                        );
                        
                        if (isValidImage) {
                            try {
                                // إنشاء مجلد fontes إذا لم يكن موجوداً
                                const fontesDir = path.join(process.cwd(), 'fontes');
                                if (!fs.existsSync(fontesDir)) {
                                    fs.mkdirSync(fontesDir, { recursive: true });
                                }
                                
                                // حفظ الصورة في مجلد fontes
                                const fileName = `colorbg_${message.guild.id}_${Date.now()}.png`;
                                const filePath = path.join(fontesDir, fileName);
                                
                                const response = await fetch(attachment.url);
                                const buffer = await response.buffer();
                                fs.writeFileSync(filePath, buffer);
                                
                                // حفظ مسار الصورة في قاعدة البيانات
                                db.set(`colorBackground_${message.guild.id}`, fileName);
                                
                                await m.react('✅');
                                await sentMessage.delete();
                            } catch (error) {
                                console.error(error);
                                await m.reply('**حدث خطأ أثناء حفظ الصورة.**');
                            }
                        } else {
                            await m.reply('**يرجى إرفاق صورة بصيغة صحيحة (png, jpg, jpeg, gif).**');
                        }
                    });
                    
                    messageCollector.on('end', (collected, reason) => {
                        if (reason === 'time') {
                            interaction.followUp('**انتهى الوقت. يرجى المحاولة مرة أخرى.**').catch(() => {});
                        }
                    });
                    
                } else if (selectedValue === 'setAutoClearMinutes') {
                    await interaction.deferUpdate();
                    
                    const embed = new EmbedBuilder()
                        .setColor(Color)
                        .setDescription('**يرجى إرسال عدد الدقائق للمسح التلقائي (مثال: 5)**');
                    
                    await interaction.followUp({ embeds: [embed] });
                    
                    const messageCollector = interaction.channel.createMessageCollector({
                        filter: m => m.author.id === message.author.id,
                        max: 1,
                        time: 30000
                    });
                    
                    messageCollector.on('collect', async m => {
                        const minutes = parseInt(m.content);
                        if (!isNaN(minutes) && minutes > 0) {
                            db.set(`autoClearMinutes_${message.guild.id}`, minutes);
                            await m.react('✅');
                            await sentMessage.delete();
                        } else {
                            await m.reply('**يرجى إدخال رقم صحيح أكبر من صفر.**');
                        }
                    });
                    
                    messageCollector.on('end', (collected, reason) => {
                        if (reason === 'time') {
                            interaction.followUp('**انتهى الوقت. يرجى المحاولة مرة أخرى.**').catch(() => {});
                        }
                    });
                    
                } else if (selectedValue === 'setColorRoles') {
                    await interaction.deferUpdate();
                    
                    const embed = new EmbedBuilder()
                        .setColor(Color)
                        .setDescription('**يرجى إرسال لون الرول بصيغة HEX (مثال: #FF0000)**');
                    
                    await interaction.followUp({ embeds: [embed] });
                    
                    const messageCollector = interaction.channel.createMessageCollector({
                        filter: m => m.author.id === message.author.id,
                        max: 1,
                        time: 30000
                    });
                    
                    messageCollector.on('collect', async m => {
                        const color = m.content.trim();
                        if (/^#[0-9A-F]{6}$/i.test(color)) {
                            db.set(`textColor_${message.guild.id}`, color);
                            await m.react('✅');
                            await sentMessage.delete();
                        } else {
                            await m.reply('**يرجى إدخال لون بصيغة HEX صحيحة (مثال: #FF0000).**');
                        }
                    });
                    
                    messageCollector.on('end', (collected, reason) => {
                        if (reason === 'time') {
                            interaction.followUp('**انتهى الوقت. يرجى المحاولة مرة أخرى.**').catch(() => {});
                        }
                    });
                    
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

        } catch (error) {
            console.error('Error sending message:', error);
            return message.reply('**حدث خطأ أثناء إرسال القائمة.**');
        }
    },
};