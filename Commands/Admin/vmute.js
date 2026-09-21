const { Message, Client, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, PermissionFlagsBits, ButtonBuilder, ButtonStyle } = require("discord.js");
const { prefix, owners } = require(`${process.cwd()}/config`);
const Pro = require(`pro.db`);
const ms = require('ms');
const moment = require('moment');
const { logPunishment } = require('../../utils/punishmentLogger');

module.exports = {
    name: "vmute",
    aliases: ["ميوت"],
    description: "mute a member from the voice channel",
    usage: ["!vmute @user"],
    run: async (client, message, args) => {


        const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) {
            return;
        }

        const Color = Pro.get(`Guild_Color = ${message.guild.id}`) || '#192029';
        if (!Color) return;

        const db = Pro.get(`Allow - Command vmute = [ ${message.guild.id} ]`)
        const allowedRole = message.guild.roles.cache.get(db);
        const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

        if (!isAuthorAllowed && message.author.id !== db && !message.member.permissions.has(PermissionFlagsBits.BanMembers)) {
            // إجراءات للتصرف عندما لا يتحقق الشرط
            return message.react(`❌`);
        }

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!args[0]) {
            const embed = new EmbedBuilder()
                .setColor(`${Color || `#192029`}`)
                .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}ميوت <@${message.author.id}>**`);
            return message.reply({ embeds: [embed] });
        }

        if (!member) return message.reply({ content: `**لا يمكنك اعطاء ميوت لهاذا العضو .**` }).catch((err) => {
            console.log(`**لم أتمكن من الرد على الرسالة:**` + err.message)
        })

        if (message.member.roles.highest.position < member.roles.highest.position) return message.reply({ content: `:rolling_eyes: **${member.user.username} have higher role than you**` }).catch((err) => {
            console.log(`**لم أتمكن من الرد على الرسالة:**` + err.message)
        })



        if (!member.voice.channel) return message.reply({ content: `**المستخدم ليس في قناة صوتية .**` })

        const reasonsModule = require('./reasons');
        const reasons = require('./reasons').getReasons(message.guild.id, 'vmute') || {};
        const menuOptions = [];
        const seen = new Set();
        for (const [key, value] of Object.entries(reasons)) {
            if (seen.has(key)) continue;
            seen.add(key);
            menuOptions.push({
                label: `${key}`.slice(0, 100),
                description: `${value.description || ''} - ${value.time || ''}`.slice(0, 100),
                value: key
            });
            if (menuOptions.length >= 25) break;
        }
        // fallback: ensure there is at least some options
        if (menuOptions.length === 0) {
            menuOptions.push({ label: 'لا يوجد أسباب', description: 'لا يوجد', value: 'no_reasons' });
        }
        
        const menu = new StringSelectMenuBuilder()
            .setCustomId('vmute_menu')
            .setPlaceholder('اختر سبب الميوت الصوتي')
            .addOptions(menuOptions);

        const deleteButton = new ButtonBuilder()
            .setCustomId('Cancel3')
            .setLabel('الغاء')
            .setStyle(ButtonStyle.Secondary);

        const menuRow = new ActionRowBuilder().addComponents(menu);
        const buttonRow = new ActionRowBuilder().addComponents(deleteButton);

        message.reply({ content: `**يرجي تحديد سبب الميوت الصوتي.**\n** * <@${member.id}>**`, components: [menuRow, buttonRow] });

        const filter = (interaction) => interaction.isStringSelectMenu() && interaction.user.id === message.author.id;
        const collector = message.channel.createMessageComponentCollector({ filter, time: 150000 });

        collector.on('collect', (interaction) => {
            const selectedOption = interaction.values[0];
            let time;
            let reason = selectedOption;

            // الحصول على الوقت من قاعدة البيانات أو القيمة الافتراضية
            const reasonData = require('./reasons').getReasons(message.guild.id, 'vmute') || {};
            if (reasonData[selectedOption]) {
                time = reasonData[selectedOption].time;
                reason = reasonData[selectedOption].reason || selectedOption;
            } else {
                if (selectedOption === 'مشاكل') {
                    time = '5m';
                } else if (selectedOption === 'إيحاءات جنسيه') {
                    time = '10m';
                } else if (selectedOption === 'قذف') {
                    time = '30m';
                }
            }

            member.voice.setMute(true).then(() => {
                message.react("✅");
                interaction.message.delete();

                const timeoutDuration = ms(time);
                
                // ========== إضافة: بدء مراقبة العضو للكشف عن فك الميوت اليدوي ==========
                startMuteMonitoring(client, member.id, message.guild.id, timeoutDuration, reason);
                
                setTimeout(() => {
                    member.voice.setMute(false).catch(() => { });
                    Pro.delete(`VoiceMuted_Member_${member.id}`);
                    
                    // ========== إضافة: إيقاف المراقبة بعد انتهاء المدة ==========
                    stopMuteMonitoring(client, member.id, message.guild.id);
                }, timeoutDuration);

                // إرسال اللوق
                let logChannel = Pro.get(`logtmuteuntmute_${message.guild.id}`);
                logChannel = message.guild.channels.cache.find(channel => channel.id === logChannel);

                if (logChannel) {
                    const logEmbed = new EmbedBuilder()
                        .setColor('#312e5d')
                        .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL({ extension: 'png' }) })
                        .setDescription(`**ميوت صوتي\n\nالعضو : <@${member.user.id}>\nبواسطة : <@${message.author.id}>\nالرسالة : [here](${message.url})\nالوقت : \`${time}\`**\n\`\`\`Reason : ${reason}\`\`\`\ `)
                        .setThumbnail(`https://cdn.discordapp.com/attachments/1091536665912299530/1153875266066710598/image_1.png`)
                        .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL({ extension: 'png' }) });

                    logChannel.send({ embeds: [logEmbed] });
                }

                // Store voice mute data for issuer checking
                Pro.set(`VoiceMuted_Member_${member.id}`, {
                    by: message.author.id,
                    time: time,
                    reason: reason,
                    guildId: message.guild.id,
                    expiresAt: Date.now() + timeoutDuration,
                    isActive: true
                });

                // Log the punishment
                logPunishment(
                    message.guild.id,
                    member.id,
                    message.author.id,
                    'vmute',
                    reason,
                    time
                );

                message.reply({ content: `**✅ تم إسكات ${member.user.username} من الرومات الصوتية! 🤐\nالسبب: ${reason}\nالمدة: ${time}\n\n⚠️ ملاحظة: إذا تم فك الميوت يدويًا، سيعود البوت تلقائيًا بعد 10 ثواني.**` })
            }).catch((err) => {
                //console.log(`Failed to mute member: ${err.message}`);
            });
        });

        collector.on('end', (collected, reason) => {
            if (!collected.size) {
                message.reply("**يرجى اختيار سبب !**").then(reply => {
                    setTimeout(() => {
                        reply.delete();
                    }, 80000);
                });
            }
        });

        // معالج الزر لإلغاء
        const buttonFilter = (i) => i.isButton() && i.customId === 'Cancel3' && i.user.id === message.author.id;
        const buttonCollector = message.channel.createMessageComponentCollector({ filter: buttonFilter, time: 150000 });

        buttonCollector.on('collect', async (i) => {
            await i.message.delete().catch(() => { });
            buttonCollector.stop();
        });

    },
};

// ========== إضافة: دالة لبدء مراقبة العضو ==========
function startMuteMonitoring(client, userId, guildId, durationMs, reason) {
    // التأكد من وجود مكان لتخزين الفواصل الزمنية
    if (!client.vmuteMonitors) {
        client.vmuteMonitors = new Map();
    }
    
    // إلغاء أي مراقبة سابقة لنفس المستخدم
    const monitorKey = `${userId}_${guildId}`;
    if (client.vmuteMonitors.has(monitorKey)) {
        clearInterval(client.vmuteMonitors.get(monitorKey));
        console.log(`إيقاف مراقبة سابقة لـ ${userId}`);
    }
    
    // بدء مراقبة جديدة
    const interval = setInterval(async () => {
        try {
            const guild = client.guilds.cache.get(guildId);
            if (!guild) return;
            
            const member = await guild.members.fetch(userId).catch(() => null);
            if (!member) return;
            
            // التحقق من أن الميوت لا يزال فعالاً في قاعدة البيانات
            const muteData = Pro.get(`VoiceMuted_Member_${userId}`);
            if (!muteData || !muteData.isActive) {
                stopMuteMonitoring(client, userId, guildId);
                return;
            }
            
            // التحقق من انتهاء المدة
            if (Date.now() > muteData.expiresAt) {
                stopMuteMonitoring(client, userId, guildId);
                return;
            }
            
            // التحقق إذا كان العضو في روم صوتي
            if (member.voice.channel) {
                // التحقق إذا كان الميوت مفعلًا عليه
                const isMuted = member.voice.serverMute;
                
                // إذا لم يكن الميوت مفعلًا (تم فكه يدويًا)
                if (!isMuted) {
                    console.log(`⚠️ تم اكتشاف فك ميوت يدوي لـ ${member.user.tag} - إعادة التطبيق...`);
                    
                    // إعادة تطبيق الميوت
                    member.voice.setMute(true).catch(err => {
                        console.log(`❌ فشل في إعادة تطبيق الميوت: ${err.message}`);
                    });
                }
            }
        } catch (error) {
            console.error(`خطأ في مراقبة الميوت: ${error.message}`);
        }
    }, 10000); // التحقق كل 10 ثواني
    
    // حفظ الفاصل الزمني
    client.vmuteMonitors.set(monitorKey, interval);
    
    console.log(`بدء مراقبة الميوت لـ ${userId} لمدة ${durationMs}ms`);
    
    // إيقاف المراقبة بعد انتهاء المدة
    setTimeout(() => {
        stopMuteMonitoring(client, userId, guildId);
    }, durationMs);
}

// ========== إضافة: دالة لإيقاف مراقبة العضو ==========
function stopMuteMonitoring(client, userId, guildId) {
    if (!client.vmuteMonitors) return;
    
    const monitorKey = `${userId}_${guildId}`;
    if (client.vmuteMonitors.has(monitorKey)) {
        clearInterval(client.vmuteMonitors.get(monitorKey));
        client.vmuteMonitors.delete(monitorKey);
        console.log(`إيقاف مراقبة الميوت لـ ${userId}`);
    }
}

// ========== إضافة: مستمع للأحداث الصوتية (للتحقق عند تغيير الحالة) ==========
module.exports.voiceStateUpdate = async (client, oldState, newState) => {
    try {
        // التحقق إذا كان العضو قد غير رومه الصوتي
        if (oldState.channel && newState.channel && oldState.channel.id !== newState.channel.id) {
            const userId = newState.member.id;
            const guildId = newState.guild.id;
            
            // التحقق إذا كان العضو لديه ميوت فعال
            const muteData = Pro.get(`VoiceMuted_Member_${userId}`);
            
            if (muteData && muteData.isActive && Date.now() < muteData.expiresAt) {
                // تطبيق الميوت بعد تأخير قصير
                setTimeout(() => {
                    newState.member.voice.setMute(true).catch(() => {});
                }, 1000);
            }
        }
    } catch (error) {
        console.error(`خطأ في مستمع voiceStateUpdate: ${error.message}`);
    }
};

// ========== إضافة: دالة لتحميل المراقبات النشطة عند بدء التشغيل ==========
module.exports.loadActiveMonitors = async (client) => {
    try {
        console.log('جاري تحميل مراقبات الميوت النشطة...');
        
        // البحث عن جميع الميوتات النشطة
        for (const key in Pro.data) {
            if (key.startsWith('VoiceMuted_Member_')) {
                const muteData = Pro.data[key];
                
                if (muteData && muteData.isActive && muteData.guildId && muteData.expiresAt) {
                    // استخراج userId من المفتاح
                    const userId = key.replace('VoiceMuted_Member_', '');
                    
                    // التحقق إذا كانت المدة لم تنته بعد
                    if (Date.now() < muteData.expiresAt) {
                        const remainingTime = muteData.expiresAt - Date.now();
                        
                        // بدء مراقبة العضو
                        startMuteMonitoring(client, userId, muteData.guildId, remainingTime, muteData.reason);
                        console.log(`تم تحميل مراقبة ميوت لـ ${userId}`);
                    }
                }
            }
        }
    } catch (error) {
        console.error(`خطأ في تحميل المراقبات النشطة: ${error.message}`);
    }
};