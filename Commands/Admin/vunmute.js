const { Message, Client, ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { prefix, owners } = require(`${process.cwd()}/config`);
const Pro = require(`pro.db`);
const { logPunishment } = require('../../utils/punishmentLogger');

module.exports = {
    name: "vunmute",
    aliases: ["فك", "unvmute"],
    description: "unmute a member from the voice channel",
    usage: ["!vunmute @user"],
    run: async (client, message, args, config) => {

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
            return message.react(`❌`);
        }

        const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
        if (!args[0]) {
            const embed = new EmbedBuilder()
                .setColor(`${Color || `#192029`}`)
                .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}فك <@${message.author.id}>**`);
            return message.reply({ embeds: [embed] });
        }

        if (!member) return message.reply({ content: `**لا يمكنك فك الميوت لهاذا العضو .**` }).catch((err) => {
            console.log(`**لم أتمكن من الرد على الرسالة:**` + err.message)
        })

        if (message.member.roles.highest.position < member.roles.highest.position) return message.reply({ content: `:rolling_eyes: **${member.user.username} have higher role than you**` }).catch((err) => {
            console.log(`**لم أتمكن من الرد على الرسالة:**` + err.message)
        })

        // ========== تحديث: إزالة الشرط الذي يمنع فك الميوت إذا لم يكن في روم صوتي ==========
        // if (!member.voice.channel) return message.reply({ content: `**المستخدم ليس في قناة صوتية .**` })

        // ========== تحديث: استخدام المفتاح الجديد الذي يتضمن guildId ==========
        const vmuteData = Pro.get(`VoiceMuted_Member_${member.id}_${message.guild.id}`);

        // التحقق من وجود بيانات الميوت
        if (!vmuteData || !vmuteData.isActive) {
            return message.reply({ 
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription('❌ **هذا العضو ليس لديه ميوت صوتي نشط!**')
                ]
            });
        }

        // التحقق من أن الشخص الذي يفك الميوت هو نفسه الذي أعطاه أو أن يكون من المالكين
        if (vmuteData.by && vmuteData.by !== message.author.id && !owners.includes(message.author.id)) {
            return message.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#FF0000')
                        .setDescription('❌ **لا يستطيع ازالة العقوبة الا الشخص الذي قام باعطائها!**')
                ]
            });
        }

        const reason = args.slice(1).join(' ') || 'تم فك الميوت الصوتي يدويًا';
        
        // ========== تحديث: إزالة الفاصل الزمني للمراقبة ==========
        if (client.voiceMuteIntervals) {
            const intervalKey = `${member.id}_${message.guild.id}`;
            if (client.voiceMuteIntervals.has(intervalKey)) {
                clearInterval(client.voiceMuteIntervals.get(intervalKey));
                client.voiceMuteIntervals.delete(intervalKey);
                console.log(`تم إيقاف مراقبة الميوت الصوتي لـ ${member.user.tag}`);
            }
        }

        // ========== تحديث: حذف بيانات الميوت ==========
        Pro.delete(`VoiceMuted_Member_${member.id}_${message.guild.id}`);

        // ========== تحديث: فك الميوت إذا كان في روم صوتي ==========
        if (member.voice.channel) {
            member.voice.setMute(false, reason).then(() => {
                console.log(`تم فك الميوت الصوتي عن ${member.user.tag}`);
            }).catch(err => {
                console.log(`فشل في فك الميوت: ${err.message}`);
            });
        }

        // Log the unmute action
        logPunishment(
            message.guild.id,
            member.id,
            message.author.id,
            'vunmute',
            reason,
            null
        );

        // ========== تحديث: إضافة رد تأكيدي أفضل ==========
        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setDescription(`✅ **تم فك الميوت الصوتي عن ${member.user.username} بنجاح!**`)
            .addFields(
                { name: 'السبب', value: reason, inline: true },
                { name: 'بواسطة', value: `<@${message.author.id}>`, inline: true }
            )
            .setTimestamp();

        // ========== تحديث: إرسال اللوق ==========
        let logChannel = Pro.get(`logtmuteuntmute_${message.guild.id}`);
        logChannel = message.guild.channels.cache.find(channel => channel.id === logChannel);

        if (logChannel) {
            const logEmbed = new EmbedBuilder()
                .setColor('#312e5d')
                .setAuthor({ 
                    name: `${member.user.tag} | فك ميوت صوتي`, 
                    iconURL: member.user.displayAvatarURL({ extension: 'png' }) 
                })
                .setDescription(`**\n\nالعضو : <@${member.user.id}>\nبواسطة : <@${message.author.id}>\nالرسالة : [here](${message.url})**\n\`\`\`Reason : ${reason}\`\`\``)
                .setThumbnail(`https://cdn.discordapp.com/attachments/1091536665912299530/1153875266066710598/image_1.png`)
                .setFooter({ 
                    text: `${message.author.tag}`, 
                    iconURL: message.author.displayAvatarURL({ extension: 'png' }) 
                })
                .setTimestamp();

            logChannel.send({ embeds: [logEmbed] }).catch(() => {});
        }

        message.reply({ embeds: [embed] }).then(msg => {
            setTimeout(() => msg.delete().catch(() => {}), 10000);
        });

        // ========== تحديث: إضافة رد تفاعلي ==========
        message.react("✅");

    },
};