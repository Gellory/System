const { ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, StringSelectMenuOptionBuilder, ComponentType } = require('discord.js');
const { createCanvas, loadImage, registerFont } = require('canvas');
const { owners } = require(`${process.cwd()}/config`);
const Data = require("pro.db");
const fs = require("fs");
const path = require("path");

// استيراد fetch بشكل صحيح لـ node-fetch v3
let fetch;
if (typeof globalThis.fetch === 'function') {
    fetch = globalThis.fetch;
} else {
    fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
}

module.exports = {
    name: 'edit-wlc',
    description: 'Edit user details',
    run: async (client, message, args) => {
        if (!owners.includes(message.author.id)) return message.react('❌');
        const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) {
            return; 
        }

        // تسجيل الخط
        const fontPath = path.join(process.cwd(), 'Fonts', 'Cairo-Regular.ttf');
        if (fs.existsSync(fontPath)) {
            registerFont(fontPath, { family: 'Cairo' });
        } else {
            console.warn('Font file not found:', fontPath);
        }

        // إنشاء القائمة المنسدلة
        const initialMenu = new StringSelectMenuBuilder()
            .setCustomId('edit_select')
            .setPlaceholder('اختر ما تريد تحريره')
            .addOptions([
                new StringSelectMenuOptionBuilder()
                    .setLabel('إحديثات الاسم')
                    .setValue('username')
                    .setEmoji('<:logo:1498436727029628979>'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('إحديثات الافتار')
                    .setValue('avatar')
                    .setEmoji('<:logo:1498436727029628979>'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('صورة الولكم')
                    .setValue('image')
                    .setEmoji('<:logo:1498436727029628979>'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('شات الولكم')
                    .setValue('channel')
                    .setEmoji('<:logo:1498436727029628979>'),
                new StringSelectMenuOptionBuilder()
                    .setLabel('رسالة الولكم')
                    .setValue('messg')
                    .setEmoji('<:logo:1498436727029628979>')
            ]);

        // إنشاء زر الإلغاء
        const deleteButton = new ButtonBuilder()
            .setCustomId('Cancele')
            .setLabel('إلغاء')
            .setStyle(ButtonStyle.Danger);

        const Cancele = new ActionRowBuilder()
            .addComponents(deleteButton);

        const initialMenuRow = new ActionRowBuilder()
            .addComponents(initialMenu);

        // إنشاء embed
        const embed = new EmbedBuilder()
            .setTitle('**يرجى تحديد نوع التعديل**')
            .setColor(0x0099FF)
            .setFooter({ 
                text: client.user.username,
                iconURL: client.user.displayAvatarURL()
            });

        const sentMessage = await message.reply({
            embeds: [embed],
            components: [initialMenuRow, Cancele]
        });

        // إنشاء collector للتفاعل مع القائمة
        const filter = (interaction) => interaction.user.id === message.author.id;
        const collector = sentMessage.createMessageComponentCollector({ 
            filter, 
            time: 120000,
            componentType: ComponentType.StringSelect
        });

        // معالجة زر الإلغاء بشكل منفصل
        sentMessage.createMessageComponentCollector({
            filter: (interaction) => interaction.user.id === message.author.id && interaction.customId === 'Cancele',
            time: 120000,
            componentType: ComponentType.Button
        }).on('collect', async (interaction) => {
            await interaction.deferUpdate();
            await sentMessage.delete();
            collector.stop();
        });

        // الاستماع للتفاعلات مع القائمة
        collector.on('collect', async (interaction) => {
            if (interaction.user.id !== message.author.id) return;
            
            const selectedOption = interaction.values[0];
            
            if (selectedOption === 'username') {
                await interaction.deferUpdate();
                await sentMessage.delete();
                
                if (message.author.bot) return;

                const canvas = createCanvas(826, 427);
                const ctx = canvas.getContext('2d');

                // Initial position of username
                let x = canvas.width / 2;
                let y = canvas.height / 2;

                // Initial font size
                let fontSize = 40;

                const username = message.author.displayName;

                // Load background image URL
                const backgroundImageURL = Data.get(`imgwlc_${message.guild.id}`);

                // Load background image if URL is provided
                let backgroundImage;
                if (backgroundImageURL) {
                    try {
                        backgroundImage = await loadImage(backgroundImageURL);
                        canvas.width = backgroundImage.width;
                        canvas.height = backgroundImage.height;
                        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
                    } catch (error) {
                        console.error('Error loading background image:', error);
                    }
                } else {
                    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                // Draw user's avatar with specified settings
                const userAvatarURL = message.author.displayAvatarURL({ extension: 'png', size: 1024 });
                try {
                    const avatar = await loadImage(userAvatarURL);
                    const avatarUpdates = Data.get(`editwel_${message.guild.id}`) || { size: 260, x: 233, y: 83.5, isCircular: true };
                    const { size, x: avatarX, y: avatarY, isCircular } = avatarUpdates;
                    ctx.save();
                    if (isCircular) {
                        ctx.beginPath();
                        ctx.arc(avatarX + size / 2, avatarY + size / 2, size / 2, 0, Math.PI * 2);
                        ctx.closePath();
                        ctx.clip();
                    }
                    ctx.drawImage(avatar, avatarX, avatarY, size, size);
                    ctx.restore();
                } catch (error) {
                    console.error('Error loading avatar:', error);
                }

                // Draw username on canvas
                ctx.font = `${fontSize}px Cairo`;
                ctx.fillStyle = '#FFFFFF';
                ctx.textAlign = 'center';
                ctx.fillText(username, x, y);

                // Create buttons
                const moveUpButton = new ButtonBuilder()
                    .setCustomId('up')
                    .setEmoji("⬆️")
                    .setStyle(ButtonStyle.Primary);

                const moveDownButton = new ButtonBuilder()
                    .setCustomId('down')
                    .setEmoji("⬇️")
                    .setStyle(ButtonStyle.Primary);

                const moveLeftButton = new ButtonBuilder()
                    .setCustomId('left')
                    .setEmoji("⬅️")
                    .setStyle(ButtonStyle.Primary);

                const moveRightButton = new ButtonBuilder()
                    .setCustomId('right')
                    .setEmoji("➡️")
                    .setStyle(ButtonStyle.Primary);

                const increaseSizeButton = new ButtonBuilder()
                    .setCustomId('increase')
                    .setEmoji("➕")
                    .setStyle(ButtonStyle.Success);

                const decreaseSizeButton = new ButtonBuilder()
                    .setCustomId('decrease')
                    .setEmoji("➖")
                    .setStyle(ButtonStyle.Danger);

                const saveButton = new ButtonBuilder()
                    .setCustomId('save')
                    .setEmoji("✅")
                    .setStyle(ButtonStyle.Success);

                // Add row for buttons
                const row1 = new ActionRowBuilder().addComponents(moveUpButton, moveDownButton);
                const row2 = new ActionRowBuilder().addComponents(moveLeftButton, moveRightButton);
                const row3 = new ActionRowBuilder().addComponents(decreaseSizeButton, increaseSizeButton);
                const row4 = new ActionRowBuilder().addComponents(saveButton);

                // Send canvas image with buttons
                const attachment = {
                    content: '**تعديل إعدادات الترحيب ⚙️**',
                    files: [{ attachment: canvas.toBuffer(), name: 'welcome-edit.png' }],
                    components: [row1, row2, row3, row4]
                };
                const usernameMessage = await message.channel.send(attachment);

                // Listen for button interactions
                const buttonFilter = (btnInteraction) => btnInteraction.message.id === usernameMessage.id && btnInteraction.user.id === message.author.id;
                const buttonCollector = usernameMessage.createMessageComponentCollector({
                    filter: buttonFilter,
                    time: 600000,
                    componentType: ComponentType.Button
                });

                let speed = 30;

                buttonCollector.on('collect', async (btnInteraction) => {
                    if (btnInteraction.replied) return;

                    await btnInteraction.deferUpdate();

                    if (btnInteraction.customId === 'up') {
                        y -= speed;
                    } else if (btnInteraction.customId === 'down') {
                        y += speed;
                    } else if (btnInteraction.customId === 'left') {
                        x -= speed;
                    } else if (btnInteraction.customId === 'right') {
                        x += speed;
                    } else if (btnInteraction.customId === 'increase') {
                        fontSize += 5;
                    } else if (btnInteraction.customId === 'decrease') {
                        fontSize -= 5;
                    } else if (btnInteraction.customId === 'save') {
                        Data.set(`editname_${message.guild.id}`, { size: fontSize, x, y, isCircular: true });
                        
                        row1.components.forEach(component => component.setDisabled(true));
                        row2.components.forEach(component => component.setDisabled(true));
                        row3.components.forEach(component => component.setDisabled(true));
                        row4.components.forEach(component => component.setDisabled(true));

                        await btnInteraction.editReply({ 
                            content: '**تم حفظ الاحديثات بنجاح. ✅**',
                            components: [],
                            files: []
                        });
                        buttonCollector.stop();
                        return;
                    }

                    // Redraw canvas with updated username position and font size
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    // Draw background image or transparent background
                    if (backgroundImage) {
                        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
                    } else {
                        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }

                    // Draw user's avatar with specified settings
                    try {
                        const avatar = await loadImage(userAvatarURL);
                        const avatarUpdates = Data.get(`editwel_${message.guild.id}`) || { size: 260, x: 233, y: 83.5, isCircular: true };
                        const { size, x: avatarX, y: avatarY, isCircular } = avatarUpdates;
                        ctx.save();
                        if (isCircular) {
                            ctx.beginPath();
                            ctx.arc(avatarX + size / 2, avatarY + size / 2, size / 2, 0, Math.PI * 2);
                            ctx.closePath();
                            ctx.clip();
                        }
                        ctx.drawImage(avatar, avatarX, avatarY, size, size);
                        ctx.restore();
                    } catch (error) {
                        console.error('Error redrawing avatar:', error);
                    }

                    ctx.font = `${fontSize}px Cairo`;
                    ctx.fillStyle = '#FFFFFF';
                    ctx.textAlign = 'center';
                    ctx.fillText(username, x, y);

                    // Update message with new canvas
                    await btnInteraction.editReply({
                        files: [{ attachment: canvas.toBuffer(), name: 'welcome-edit.png' }],
                        components: [row1, row2, row3, row4]
                    });
                });

                buttonCollector.on('end', () => {
                    row1.components.forEach(component => component.setDisabled(true));
                    row2.components.forEach(component => component.setDisabled(true));
                    row3.components.forEach(component => component.setDisabled(true));
                    row4.components.forEach(component => component.setDisabled(true));
                    
                    usernameMessage.edit({ 
                        content: '**أنتهى وقت التعديل** ❌',
                        components: [row1, row2, row3, row4] 
                    }).catch(() => {});
                });
            }

            // معالجة تعديل الصورة الرمزية
            if (selectedOption === 'avatar') {
                await interaction.deferUpdate();
                await sentMessage.delete();
                
                if (message.author.bot) return;

                const canvas = createCanvas(826, 427);
                const ctx = canvas.getContext('2d');

                // Background image URL
                const backgroundImageURL = Data.get(`imgwlc_${message.guild.id}`);

                // Load background image if URL is provided
                let backgroundImage;
                if (backgroundImageURL) {
                    try {
                        backgroundImage = await loadImage(backgroundImageURL);
                        canvas.width = backgroundImage.width;
                        canvas.height = backgroundImage.height;
                    } catch (error) {
                        console.error('Error loading background:', error);
                    }
                }

                // Load and draw user's avatar
                const user = message.author;
                const avatarURL = user.displayAvatarURL({ extension: 'png', size: 1024 });
                let avatar;
                try {
                    avatar = await loadImage(avatarURL);
                } catch (error) {
                    console.error('Error loading avatar:', error);
                    return;
                }
                
                let avatarSize = 200;
                let avatarX = canvas.width / 2 - avatarSize / 2;
                let avatarY = canvas.height / 2 - avatarSize / 2;
                let isCircular = true;

                // Draw background image or transparent background
                if (backgroundImage) {
                    ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
                } else {
                    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }

                // Draw avatar on canvas
                ctx.save();
                if (isCircular) {
                    ctx.beginPath();
                    ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
                    ctx.closePath();
                    ctx.clip();
                }
                ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
                ctx.restore();

                // Create buttons
                const zoomInButton = new ButtonBuilder()
                    .setCustomId('zoomIn')
                    .setEmoji("➕")
                    .setStyle(ButtonStyle.Secondary);

                const moveUpButton = new ButtonBuilder()
                    .setCustomId('up')
                    .setEmoji("⬆️")
                    .setStyle(ButtonStyle.Primary);

                const zoomOutButton = new ButtonBuilder()
                    .setCustomId('zoomOut')
                    .setEmoji("➖")
                    .setStyle(ButtonStyle.Secondary);

                const moveDownButton = new ButtonBuilder()
                    .setCustomId('down')
                    .setEmoji("⬇️")
                    .setStyle(ButtonStyle.Primary);

                const leftButton = new ButtonBuilder()
                    .setCustomId('left')
                    .setEmoji("⬅️")
                    .setStyle(ButtonStyle.Primary);

                const rightButton = new ButtonBuilder()
                    .setCustomId('right')
                    .setEmoji("➡️")
                    .setStyle(ButtonStyle.Primary);

                // Add save button
                const saveButton = new ButtonBuilder()
                    .setCustomId('save')
                    .setEmoji("✅")
                    .setStyle(ButtonStyle.Success);

                // Add button to toggle circular avatar
                const toggleShapeButton = new ButtonBuilder()
                    .setCustomId('toggleShape')
                    .setEmoji("🔄")
                    .setStyle(ButtonStyle.Secondary);

                // Add delete button
                const deleteButton = new ButtonBuilder()
                    .setCustomId('delete')
                    .setEmoji("❌")
                    .setStyle(ButtonStyle.Danger);

                const row1 = new ActionRowBuilder()
                    .addComponents(zoomInButton, moveUpButton, zoomOutButton);

                const row2 = new ActionRowBuilder()
                    .addComponents(leftButton, saveButton, rightButton);

                const row3 = new ActionRowBuilder()
                    .addComponents(toggleShapeButton, moveDownButton, deleteButton);

                // Send canvas image with buttons
                const attachment = {
                    content: '**تعديل إعدادات الترحيب ⚙️**',
                    files: [{ attachment: canvas.toBuffer(), name: 'avatar-edit.png' }],
                    components: [row1, row2, row3]
                };
                const avatarMessage = await message.channel.send(attachment);

                // Listen for button interactions
                const buttonFilter = (btnInteraction) => btnInteraction.message.id === avatarMessage.id && btnInteraction.user.id === message.author.id;
                const buttonCollector = avatarMessage.createMessageComponentCollector({
                    filter: buttonFilter,
                    time: 300000,
                    componentType: ComponentType.Button
                });

                let speed = 20;
                let zoomSpeed = 20;

                buttonCollector.on('collect', async (btnInteraction) => {
                    if (btnInteraction.replied) return;

                    await btnInteraction.deferUpdate();

                    if (btnInteraction.customId === 'up') {
                        avatarY -= speed;
                    } else if (btnInteraction.customId === 'down') {
                        avatarY += speed;
                    } else if (btnInteraction.customId === 'left') {
                        avatarX -= speed;
                    } else if (btnInteraction.customId === 'right') {
                        avatarX += speed;
                    } else if (btnInteraction.customId === 'zoomIn') {
                        avatarSize += zoomSpeed;
                    } else if (btnInteraction.customId === 'zoomOut') {
                        avatarSize -= zoomSpeed;
                    } else if (btnInteraction.customId === 'save') {
                        Data.set(`editwel_${message.guild.id}`, {
                            x: avatarX,
                            y: avatarY,
                            size: avatarSize,
                            isCircular: isCircular
                        });
                        
                        row1.components.forEach(component => component.setDisabled(true));
                        row2.components.forEach(component => component.setDisabled(true));
                        row3.components.forEach(component => component.setDisabled(true));
                        
                        await btnInteraction.editReply({
                            content: '**تم حفظ الاحديثات بنجاح. ✅**',
                            components: [],
                            files: []
                        });
                        buttonCollector.stop();
                        return;
                    } else if (btnInteraction.customId === 'toggleShape') {
                        isCircular = !isCircular;
                    } else if (btnInteraction.customId === 'delete') {
                        if (Data.has(`mesg_message_${message.guild.id}`)) {
                            Data.delete(`mesg_message_${message.guild.id}`);
                        }
                        if (Data.has(`imgwlc_${message.guild.id}`)) {
                            Data.delete(`imgwlc_${message.guild.id}`);
                        }
                        if (Data.has(`chat_wlc_${message.guild.id}`)) {
                            Data.delete(`chat_wlc_${message.guild.id}`);
                        }
                        if (Data.has(`editwel_${message.guild.id}`)) {
                            Data.delete(`editwel_${message.guild.id}`);
                        }
                        
                        row1.components.forEach(component => component.setDisabled(true));
                        row2.components.forEach(component => component.setDisabled(true));
                        row3.components.forEach(component => component.setDisabled(true));
                        
                        await btnInteraction.editReply({
                            content: '**تم حذف جميع بيانات الترحيب ❌**',
                            components: [row1, row2, row3],
                            files: []
                        });
                        buttonCollector.stop();
                        return;
                    }

                    // Redraw canvas with updated avatar position and size
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    // Draw background image or transparent background
                    if (backgroundImage) {
                        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);
                    } else {
                        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                    }

                    // Draw updated avatar on canvas
                    ctx.save();
                    if (isCircular) {
                        ctx.beginPath();
                        ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
                        ctx.closePath();
                        ctx.clip();
                    }
                    ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
                    ctx.restore();

                    // Update message with new canvas
                    await btnInteraction.editReply({
                        files: [{ attachment: canvas.toBuffer(), name: 'avatar-edit.png' }],
                        components: [row1, row2, row3]
                    });
                });

                buttonCollector.on('end', () => {
                    row1.components.forEach(component => component.setDisabled(true));
                    row2.components.forEach(component => component.setDisabled(true));
                    row3.components.forEach(component => component.setDisabled(true));
                    
                    avatarMessage.edit({ 
                        content: '**أنتهى وقت التعديل** ❌',
                        components: [row1, row2, row3] 
                    }).catch(() => {});
                });
            }

            if (selectedOption === 'image') {
                await interaction.deferUpdate();
                await sentMessage.delete();
                
                if (message.author.bot) return;

                let imageURL;

                if (args[0]) {
                    imageURL = args[0];
                } else if (message.attachments.size > 0) {
                    imageURL = message.attachments.first().url;
                } else {
                    const requestMsg = await message.reply("**يرجى أرفاق رابط الصورة او الصورة.** ⚙️");
                    const filter = m => m.author.id === message.author.id;
                    const msgCollector = message.channel.createMessageCollector({ filter, time: 60000 });

                    msgCollector.on('collect', async (msg) => {
                        if (msg.attachments.size > 0) {
                            imageURL = msg.attachments.first().url;
                            await saveImage(message.guild.id, imageURL);
                            await message.react('✅');
                            await requestMsg.edit("**تم حفظ الصورة بنجاح. ✅**");
                            await msg.delete();
                            msgCollector.stop();
                        } else {
                            await msg.reply("**يرجى أرفاق رابط الصورة او الصورة.** ⚙️");
                        }
                    });

                    msgCollector.on('end', () => {
                        if (!imageURL) {
                            requestMsg.edit("**أنتهى وقت التعديل** ❌").catch(() => {});
                        }
                    });
                    return;
                }

                await saveImage(message.guild.id, imageURL);
                await message.reply("**تم حفظ الصورة بنجاح. ✅**");

                async function saveImage(guildId, imageUrl) {
                    const imageName = "welcome.png";
                    const imagePath = path.join(process.cwd(), "Fonts", imageName);
                    try {
                        // استخدام fetch ديناميكي
                        const fetchFunction = typeof globalThis.fetch === 'function' ? globalThis.fetch : (await import('node-fetch')).default;
                        const response = await fetchFunction(imageUrl);
                        const buffer = await response.arrayBuffer();
                        fs.writeFileSync(imagePath, Buffer.from(buffer));
                        Data.set(`imgwlc_${guildId}`, imagePath);
                    } catch (error) {
                        console.error('Error saving image:', error);
                        throw error;
                    }
                }
            }

            if (selectedOption === 'channel') {
                await interaction.deferUpdate();
                await sentMessage.delete();
                
                let selectedChannelID;

                if (args[0]) {
                    const channelID = args[0].replace(/\D/g, '');
                    if (message.guild.channels.cache.has(channelID)) {
                        selectedChannelID = channelID;
                    }
                }

                if (!selectedChannelID) {
                    const channelMention = message.mentions.channels.first();
                    if (channelMention) {
                        selectedChannelID = channelMention.id;
                    } else {
                        const requestMessage = await message.reply("**يرجى ارفاق منشن الشات او الايدي .** ⚙️");
                        const filter = m => m.author.id === message.author.id;
                        const msgCollector = message.channel.createMessageCollector({ filter, time: 30000 });

                        msgCollector.on('collect', async (msg) => {
                            const channel = msg.mentions.channels.first();
                            if (channel) {
                                selectedChannelID = channel.id;
                                msgCollector.stop();
                            } else {
                                const channelID = msg.content.replace(/\D/g, '');
                                if (message.guild.channels.cache.has(channelID)) {
                                    selectedChannelID = channelID;
                                    msgCollector.stop();
                                } else {
                                    await msg.reply("**يرجى ارفاق منشن الشات او الايدي .**⚙️");
                                }
                            }
                        });

                        msgCollector.on('end', () => {
                            if (!selectedChannelID) {
                                requestMessage.edit("**أنتهى وقت التعديل** ❌").catch(() => {});
                            } else {
                                Data.set(`chat_wlc_${message.guild.id}`, selectedChannelID);
                                requestMessage.edit("**تم حفظ القناة بنجاح.** ✅").catch(() => {});
                            }
                        });
                        return;
                    }
                }

                Data.set(`chat_wlc_${message.guild.id}`, selectedChannelID);
                await message.reply("**تم حفظ القناة بنجاح.** ✅");
            }

            if (selectedOption === 'messg') {
                await interaction.deferUpdate();
                await sentMessage.delete();
                
                let selectedContent;

                if (args[0]) {
                    selectedContent = args.join(" ");
                }

                if (!selectedContent) {
                    const requestMessage = await message.reply({
                        content: "**يرجى إرفاق رسالة الترحيب** ⚙️\n```\n[user] : يذكر إسم العضو\n[inviter] : يذكر إسم الداعي\n[servername] : يذكر إسم السيرفر\n[membercount] : يذكر عدد أعضاء السيرفر\n```"
                    });
                    
                    const filter = m => m.author.id === message.author.id;
                    const msgCollector = message.channel.createMessageCollector({ filter, time: 30000 });

                    msgCollector.on('collect', async (msg) => {
                        selectedContent = msg.content;
                        msgCollector.stop();
                    });

                    msgCollector.on('end', () => {
                        if (!selectedContent) {
                            requestMessage.edit("**أنتهى وقت التعديل** ❌").catch(() => {});
                        } else {
                            Data.set(`mesg_message_${message.guild.id}`, selectedContent);
                            requestMessage.edit("**تم حفظ النص بنجاح.** ✅").catch(() => {});
                        }
                    });
                    return;
                }

                Data.set(`mesg_message_${message.guild.id}`, selectedContent);
                await message.reply("**تم حفظ النص بنجاح.** ✅");
            }
        });

        collector.on('end', () => {
            initialMenuRow.components.forEach(component => {
                component.setDisabled(true);
            });
            Cancele.components.forEach(component => {
                component.setDisabled(true);
            });
            
            sentMessage.edit({ 
                components: [initialMenuRow, Cancele] 
            }).catch(() => {});
        });
    }
};