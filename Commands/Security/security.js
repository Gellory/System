const d2b = require('pro.db');
const { owners, prefix } = require(`${process.cwd()}/config`);
const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require('discord.js');

module.exports = {
    name: `security`,
    run: async (Client, message) => {
        if (!owners.includes(message.author.id)) return message.react('❌');

        if (!message.guild) return;

        const Color = d2b.get(`Guild_Color = ${message.guild.id}`) || '#192029';
        if (!Color) return;

        // الحصول على إعدادات الحماية
        const antibotsStatus = d2b.get(`antibots-${message.guild.id}`) === 'on' ? '✅ مُفعل' : '❌ مُغلق';
        const anticreateStatus = d2b.get(`anticreate-${message.guild.id}`) === true ? '✅ مُفعل' : '❌ مُغلق';
        const antideleteStatus = d2b.get(`antiDelete-${message.guild.id}`) === true ? '✅ مُفعل' : '❌ مُغلق';
        const antijoinStatus = d2b.get(`antijoinEnabled_${message.guild.id}`) === true ? '✅ مُفعل' : '❌ مُغلق';
        const antilinksStatus = d2b.get(`antilinks-${message.guild.id}`) === 'on' ? '✅ مُفعل' : '❌ مُغلق';
        const antispamStatus = d2b.get(`spamProtectionEnabled_${message.guild.id}`) === true ? '✅ مُفعل' : '❌ مُغلق';

        // الحصول على قنوات السجلات
        const logAntidelete = d2b.get(`logantidelete_${message.guild.id}`);
        const logProtection = d2b.get(`logprotection_${message.guild.id}`);
        const logAntijoinbots = d2b.get(`logantijoinbots_${message.guild.id}`);
        const logBlocklist = d2b.get(`logblocklist_${message.guild.id}`);

        const getChannelMention = (channelId) => {
            if (!channelId) return '`غير محدد`';
            const channel = message.guild.channels.cache.get(channelId);
            return channel ? `<#${channelId}>` : '`غير موجود`';
        };

        const embed = new EmbedBuilder()
            .setColor(Color || '#192029')
            .setTitle('إعدادات الحماية')
            .addFields(
                {
                    name: '**━━━ إعدادات الحماية ━━━**',
                    value: '\u200B',
                    inline: false
                },
                {
                    name: '**منع البوتات**',
                    value: antibotsStatus,
                    inline: true
                },
                {
                    name: '**منع الإنشاء**',
                    value: anticreateStatus,
                    inline: true
                },
                {
                    name: '**منع الحذف**',
                    value: antideleteStatus,
                    inline: true
                },
                {
                    name: '**منع الانضمام**',
                    value: antijoinStatus,
                    inline: true
                },
                {
                    name: '**منع الروابط**',
                    value: antilinksStatus,
                    inline: true
                },
                {
                    name: '**منع السبام**',
                    value: antispamStatus,
                    inline: true
                },
                {
                    name: '**━━━ قنوات السجلات ━━━**',
                    value: '\u200B',
                    inline: false
                },
                {
                    name: '**سجل الحذف**',
                    value: getChannelMention(logAntidelete),
                    inline: true
                },
                {
                    name: '**سجل الحماية**',
                    value: getChannelMention(logProtection),
                    inline: true
                },
                {
                    name: '**سجل البوتات**',
                    value: getChannelMention(logAntijoinbots),
                    inline: true
                },
                {
                    name: '**سجل الحظر**',
                    value: getChannelMention(logBlocklist),
                    inline: true
                }
            )
            .setFooter({ text: `Pal Store`, iconURL: `https://i.ibb.co/ccPmn8cg/zaraicon.webp` })
            .setTimestamp();

        // إنشاء القائمة المنسدلة
        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('security_settings')
            .setPlaceholder('اختر إعداداً لتعديله...')
            .addOptions(
                {
                    label: 'منع البوتات',
                    description: 'تشغيل/إيقاف منع البوتات',
                    value: 'antibots'
                },
                {
                    label: 'منع الإنشاء',
                    description: 'تشغيل/إيقاف منع إنشاء القنوات',
                    value: 'anticreate'
                },
                {
                    label: 'منع الحذف',
                    description: 'تشغيل/إيقاف منع حذف القنوال',
                    value: 'antidelete'
                },
                {
                    label: 'منع الانضمام',
                    description: 'تشغيل/إيقاف منع انضمام الأعضاء',
                    value: 'antijoin'
                },
                {
                    label: 'منع الروابط',
                    description: 'تشغيل/إيقاف منع الروابط',
                    value: 'antilinks'
                },
                {
                    label: 'منع السبام',
                    description: 'تشغيل/إيقاف منع السبام',
                    value: 'antispam'
                },
                {
                    label: 'سجل الحذف',
                    description: 'تعيين قناة سجل الحذف',
                    value: 'log_antidelete'
                },
                {
                    label: 'سجل الحماية',
                    description: 'تعيين قناة سجل الحماية',
                    value: 'log_protection'
                },
                {
                    label: 'سجل البوتات',
                    description: 'تعيين قناة سجل البوتات',
                    value: 'log_antijoinbots'
                },
                {
                    label: 'سجل الحظر',
                    description: 'تعيين قناة سجل الحظر',
                    value: 'log_blocklist'
                }
            );

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const msg = await message.reply({ embeds: [embed], components: [row] });

        // إنشاء مصفاة التفاعل
        const filter = i => i.user.id === message.author.id && i.message.id === msg.id;
        const collector = msg.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async i => {
            await i.deferUpdate();

            const value = i.values[0];
            
            // قسم إعدادات الحماية (تشغيل/إيقاف)
            if (['antibots', 'anticreate', 'antidelete', 'antijoin', 'antilinks', 'antispam'].includes(value)) {
                // تبديل حالة الإعداد
                let currentValue;
                let newValue;
                let keyName;

                switch(value) {
                    case 'antibots':
                        keyName = `antibots-${message.guild.id}`;
                        currentValue = d2b.get(keyName);
                        newValue = currentValue === 'on' ? 'off' : 'on';
                        break;
                    case 'anticreate':
                        keyName = `anticreate-${message.guild.id}`;
                        currentValue = d2b.get(keyName);
                        newValue = !currentValue;
                        break;
                    case 'antidelete':
                        keyName = `antiDelete-${message.guild.id}`;
                        currentValue = d2b.get(keyName);
                        newValue = !currentValue;
                        break;
                    case 'antijoin':
                        keyName = `antijoinEnabled_${message.guild.id}`;
                        currentValue = d2b.get(keyName);
                        newValue = !currentValue;
                        break;
                    case 'antilinks':
                        keyName = `antilinks-${message.guild.id}`;
                        currentValue = d2b.get(keyName);
                        newValue = currentValue === 'on' ? 'off' : 'on';
                        break;
                    case 'antispam':
                        keyName = `spamProtectionEnabled_${message.guild.id}`;
                        currentValue = d2b.get(keyName);
                        newValue = !currentValue;
                        break;
                }

                d2b.set(keyName, newValue);
                await i.followUp({ content: `✅ تم ${newValue === true || newValue === 'on' ? 'تشغيل' : 'إيقاف'} ${getSettingName(value)}`, ephemeral: true });

                // تحديث الرسالة بعد التعديل
                setTimeout(() => {
                    module.exports.run(Client, message);
                }, 1000);
            }
            // قسم قنوات السجلات (طلب تحديد القناة)
            else if (value.startsWith('log_')) {
                const logTypes = {
                    'log_antidelete': 'سجل الحذف',
                    'log_protection': 'سجل الحماية',
                    'log_antijoinbots': 'سجل البوتات',
                    'log_blocklist': 'سجل الحظر'
                };

                const logName = logTypes[value];
                
                await i.followUp({ 
                    content: `**${logName}**\n\nيرجى إرسال منشن القناة أو الـID الخاص بها:\nمثال: #channel أو \`123456789012345678\`\n\nاكتب \`cancel\` للإلغاء`, 
                    ephemeral: true 
                });

                // تجميع الرسائل للرد على رسالة واحدة
                const messageFilter = m => m.author.id === message.author.id;
                const messageCollector = message.channel.createMessageCollector({ 
                    filter: messageFilter, 
                    time: 30000,
                    max: 1 
                });

                messageCollector.on('collect', async m => {
                    // محاولة حذف رسالة المستخدم فوراً
                    try {
                        await m.delete();
                    } catch (error) {
                        console.error('فشل في حذف رسالة المستخدم:', error);
                    }

                    if (m.content.toLowerCase() === 'cancel') {
                        const cancelMsg = await m.channel.send('تم إلغاء العملية ❌');
                        setTimeout(() => {
                            cancelMsg.delete().catch(() => {});
                        }, 2000);
                        return;
                    }

                    let channelId;
                    
                    // التحقق إذا كان المنشن
                    if (m.content.match(/<#(\d+)>/)) {
                        channelId = m.content.match(/<#(\d+)>/)[1];
                    } 
                    // التحقق إذا كان ID
                    else if (m.content.match(/^\d+$/)) {
                        channelId = m.content;
                    } 
                    else {
                        const errorMsg = await m.channel.send('❌ منشن أو ID القناة غير صالح!');
                        setTimeout(() => {
                            errorMsg.delete().catch(() => {});
                        }, 3000);
                        return;
                    }

                    // التحقق من وجود القناة
                    const channel = message.guild.channels.cache.get(channelId);
                    if (!channel) {
                        const errorMsg = await m.channel.send('❌ القناة غير موجودة في السيرفر!');
                        setTimeout(() => {
                            errorMsg.delete().catch(() => {});
                        }, 3000);
                        return;
                    }

                    // حفظ القناة في قاعدة البيانات
                    let dbKey;
                    switch(value) {
                        case 'log_antidelete':
                            dbKey = `logantidelete_${message.guild.id}`;
                            break;
                        case 'log_protection':
                            dbKey = `logprotection_${message.guild.id}`;
                            break;
                        case 'log_antijoinbots':
                            dbKey = `logantijoinbots_${message.guild.id}`;
                            break;
                        case 'log_blocklist':
                            dbKey = `logblocklist_${message.guild.id}`;
                            break;
                    }

                    d2b.set(dbKey, channelId);
                    
                    // إرسال رسالة تأكيد مؤقتة
                    const confirmMsg = await m.channel.send(`✅ تم تعيين ${logName} إلى ${channel}`);
                    setTimeout(() => {
                        confirmMsg.delete().catch(() => {});
                    }, 3000);
                    
                    // تحديث الرسالة الأصلية فقط
                    updateSecurityMessage(Client, message, msg);
                });

                messageCollector.on('end', collected => {
                    if (collected.size === 0) {
                        const timeoutMsg = message.channel.send('⏰ انتهى الوقت!');
                        setTimeout(() => {
                            timeoutMsg.then(msg => msg.delete().catch(() => {}));
                        }, 3000);
                    }
                });
            }
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                // تعطيل القائمة بعد انتهاء الوقت
                const disabledRow = new ActionRowBuilder()
                    .addComponents(
                        selectMenu.setDisabled(true)
                    );
                msg.edit({ components: [disabledRow] }).catch(console.error);
            }
        });
    }
};

// دالة لتحديث رسالة الأمان فقط (بدون إعادة تشغيل الأمر)
async function updateSecurityMessage(Client, originalMessage, targetMessage) {
    if (!originalMessage.guild) return;

    const Color = d2b.get(`Guild_Color = ${originalMessage.guild.id}`) || '#192029';
    if (!Color) return;

    // الحصول على إعدادات الحماية
    const antibotsStatus = d2b.get(`antibots-${originalMessage.guild.id}`) === 'on' ? '✅ مُفعل' : '❌ مُغلق';
    const anticreateStatus = d2b.get(`anticreate-${originalMessage.guild.id}`) === true ? '✅ مُفعل' : '❌ مُغلق';
    const antideleteStatus = d2b.get(`antiDelete-${originalMessage.guild.id}`) === true ? '✅ مُفعل' : '❌ مُغلق';
    const antijoinStatus = d2b.get(`antijoinEnabled_${originalMessage.guild.id}`) === true ? '✅ مُفعل' : '❌ مُغلق';
    const antilinksStatus = d2b.get(`antilinks-${originalMessage.guild.id}`) === 'on' ? '✅ مُفعل' : '❌ مُغلق';
    const antispamStatus = d2b.get(`spamProtectionEnabled_${originalMessage.guild.id}`) === true ? '✅ مُفعل' : '❌ مُغلق';

    // الحصول على قنوات السجلات
    const logAntidelete = d2b.get(`logantidelete_${originalMessage.guild.id}`);
    const logProtection = d2b.get(`logprotection_${originalMessage.guild.id}`);
    const logAntijoinbots = d2b.get(`logantijoinbots_${originalMessage.guild.id}`);
    const logBlocklist = d2b.get(`logblocklist_${originalMessage.guild.id}`);

    const getChannelMention = (channelId) => {
        if (!channelId) return '`غير محدد`';
        const channel = originalMessage.guild.channels.cache.get(channelId);
        return channel ? `<#${channelId}>` : '`غير موجود`';
    };

    const embed = new EmbedBuilder()
        .setColor(Color || '#192029')
        .setTitle('إعدادات الحماية')
        .addFields(
            {
                name: '**━━━ إعدادات الحماية ━━━**',
                value: '\u200B',
                inline: false
            },
            {
                name: '**منع البوتات**',
                value: antibotsStatus,
                inline: true
            },
            {
                name: '**منع الإنشاء**',
                value: anticreateStatus,
                inline: true
            },
            {
                name: '**منع الحذف**',
                value: antideleteStatus,
                inline: true
            },
            {
                name: '**منع الانضمام**',
                value: antijoinStatus,
                inline: true
            },
            {
                name: '**منع الروابط**',
                value: antilinksStatus,
                inline: true
            },
            {
                name: '**منع السبام**',
                value: antispamStatus,
                inline: true
            },
            {
                name: '**━━━ قنوات السجلات ━━━**',
                value: '\u200B',
                inline: false
            },
            {
                name: '**سجل الحذف**',
                value: getChannelMention(logAntidelete),
                inline: true
            },
            {
                name: '**سجل الحماية**',
                value: getChannelMention(logProtection),
                inline: true
            },
            {
                name: '**سجل البوتات**',
                value: getChannelMention(logAntijoinbots),
                inline: true
            },
            {
                name: '**سجل الحظر**',
                value: getChannelMention(logBlocklist),
                inline: true
            }
        )
        .setFooter({ text: `Pal Store`, iconURL: `https://i.ibb.co/ccPmn8cg/zaraicon.webp` })
        .setTimestamp();

    // إعادة إنشاء القائمة المنسدلة
    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('security_settings')
        .setPlaceholder('اختر إعداداً لتعديله...')
        .addOptions(
            {
                label: 'منع البوتات',
                description: 'تشغيل/إيقاف منع البوتات',
                value: 'antibots'
            },
            {
                label: 'منع الإنشاء',
                description: 'تشغيل/إيقاف منع إنشاء القنوات',
                value: 'anticreate'
            },
            {
                label: 'منع الحذف',
                description: 'تشغيل/إيقاف منع حذف القنوال',
                value: 'antidelete'
            },
            {
                label: 'منع الانضمام',
                description: 'تشغيل/إيقاف منع انضمام الأعضاء',
                value: 'antijoin'
            },
            {
                label: 'منع الروابط',
                description: 'تشغيل/إيقاف منع الروابط',
                value: 'antilinks'
            },
            {
                label: 'منع السبام',
                description: 'تشغيل/إيقاف منع السبام',
                value: 'antispam'
            },
            {
                label: 'سجل الحذف',
                description: 'تعيين قناة سجل الحذف',
                value: 'log_antidelete'
            },
            {
                label: 'سجل الحماية',
                description: 'تعيين قناة سجل الحماية',
                value: 'log_protection'
            },
            {
                label: 'سجل البوتات',
                description: 'تعيين قناة سجل البوتات',
                value: 'log_antijoinbots'
            },
            {
                label: 'سجل الحظر',
                description: 'تعيين قناة سجل الحظر',
                value: 'log_blocklist'
            }
        );

    const row = new ActionRowBuilder().addComponents(selectMenu);

    // تحديث الرسالة الأصلية فقط
    await targetMessage.edit({ embeds: [embed], components: [row] });
}

// دالة مساعدة للحصول على اسم الإعداد
function getSettingName(value) {
    const names = {
        'antibots': 'منع البوتات',
        'anticreate': 'منع الإنشاء',
        'antidelete': 'منع الحذف',
        'antijoin': 'منع الانضمام',
        'antilinks': 'منع الروابط',
        'antispam': 'منع السبام'
    };
    return names[value] || value;
}