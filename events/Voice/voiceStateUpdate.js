const db = require("pro.db");
const humanizeDuration = require('humanize-duration');
const Discord = require('discord.js');

module.exports = async (client, oldState, newState) => {
    let logvjoinvexit = db.get(`logvjoinvexit_${oldState.guild.id}`);
    let logmove = db.get(`logmove_${oldState.guild.id}`);
    
    let logChannelJoinExit = oldState.member.guild.channels.cache.find(c => c.id === logvjoinvexit);
    let logChannelMove = oldState.member.guild.channels.cache.find(c => c.id === logmove);
    
    if (!logChannelJoinExit || !logChannelMove) return;
    
    if (oldState.member.bot || newState.member.bot) return;
    
    if (oldState.guild.id !== logChannelJoinExit.guild.id || newState.guild.id !== logChannelJoinExit.guild.id) return;
    
    if (!oldState.channelId && newState.channelId) {
        let members = newState.channel && newState.channel.members.size > 0 ? newState.channel.members.map(member => `${member.displayName}`).join('\n ') : 'لا يوجد ❌';
        let currentTime = humanizeDuration(Date.now(), { language: 'ar', units: ['d', 'h', 'm'], round: true });
        let embed = new Discord.EmbedBuilder()
            .setAuthor({ name: newState.member.displayName, iconURL: newState.member.user.displayAvatarURL() })
            .setDescription(`**انضم إلى القناة**\n\n**مستخدم : <@${oldState.member.user.id}>**\n**فيـ : <#${newState.channel.id}>**\n\`\`\`الاعضاء 🙆‍♀️ :\n ${members}\`\`\``)
            .setColor(`#91beb4`)
            .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() })
            .setThumbnail(`https://cdn.discordapp.com/attachments/1091536665912299530/1224546888003616799/8B73770E-31D7-489A-8BF6-152D91D6D76A.png?ex=661de329&is=660b6e29&hm=72e8ce9bb70e2b8ee23c5115f0fdff4a9ca64f3a24db471d471b3e6c09f6faf0&`);
        logChannelJoinExit.send({ embeds: [embed] });
    } else if (oldState.channelId && !newState.channelId && oldState.member.user.bot === false) {
        let members = oldState.channel && oldState.channel.members.size > 0 ? oldState.channel.members.map(member => `${member.displayName}`).join('\n ') : 'لا يوجد ❌';
        let currentTime = humanizeDuration(Date.now(), { language: 'ar', units: ['d', 'h', 'm'], round: true });
        let embed = new Discord.EmbedBuilder()
            .setAuthor({ name: oldState.member.displayName, iconURL: oldState.member.user.displayAvatarURL() })
            .setDescription(`**الخروج من القناة**\n\n**مستخدم : <@${oldState.member.user.id}>**\n**من : <#${oldState.channel.id}>**\n\`\`\`الاعضاء 🙆‍♀️ :\n ${members}\`\`\``)
            .setColor(`#91beb4`)
            .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() })
            .setThumbnail(`https://cdn.discordapp.com/attachments/1091536665912299530/1224546888280309931/IMG_2593.png?ex=661de329&is=660b6e29&hm=f3b9b801958f5302e01d599e3821133a4b8e42c1a4da57ded4b82b563c547887&`);
        logChannelJoinExit.send({ embeds: [embed] });
    } else if (oldState.channelId && newState.channelId && oldState.channelId !== newState.channelId && !oldState.member.user.bot) {

        let oldChannel = oldState.guild.channels.cache.get(oldState.channelId);
        let newChannel = newState.guild.channels.cache.get(newState.channelId);
        let embed = new Discord.EmbedBuilder()
            .setAuthor({ name: oldState.member.displayName, iconURL: oldState.member.user.displayAvatarURL() })
            .setDescription(`**نقل بين القنوات الصوتية**\n\n**مستخدم : <@${oldState.member.user.id}>**\n**من : <#${oldChannel.id}>**\n**إلى : <#${newChannel.id}>**`)
            .setColor(`#712519`)
            .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() })
            .setThumbnail(`https://cdn.discordapp.com/attachments/1091536665912299530/1208820125478821948/position.png?ex=65e4ac78&is=65d23778&hm=8aa439a09c54106441eae7ca8bd1fe821e61596da8ac429b887cee61fbef0170&`);
        
        logChannelMove.send({ embeds: [embed] });
    }
    
    // لوق الديسكونكت (Disconnect)
    if (oldState.channelId && !newState.channelId && oldState.member.user.bot === false) {
        try {
            // الحصول على معلومات من Audit Logs
            const fetchedLogs = await oldState.guild.fetchAuditLogs({
                limit: 1,
                type: 27 // MEMBER_DISCONNECT
            }).catch(() => null);
            
            let disconnecter = null;
            if (fetchedLogs) {
                const disconnectLog = fetchedLogs.entries.first();
                if (disconnectLog && disconnectLog.executor && disconnectLog.target?.id === oldState.member.id) {
                    disconnecter = disconnectLog.executor;
                }
            }
            
            // إرسال اللوق
            const logDisconnect = db.get(`logdisconnect_${oldState.guild.id}`);
            const logChannelDisconnect = oldState.guild.channels.cache.find(c => c.id === logDisconnect);
            
            if (logChannelDisconnect) {
                const members = oldState.channel?.members?.filter(m => m.id !== oldState.member.id)?.map(m => m.displayName).join('\n ') || 'لا يوجد ❌';
                
                const embed = new Discord.EmbedBuilder()
                    .setAuthor({ name: 'ZaraStore', iconURL: client.user.displayAvatarURL({ extension: 'png' }) })
                    .setTitle('**تم فصل العضو من الروم الصوتي**')
                    .setDescription(`**العضو المُفصول : <@${oldState.member.id}>\n${disconnecter ? `من قبل : <@${disconnecter.id}>` : 'تم الفصل تلقائياً'}\nمن القناة : <#${oldState.channelId}>**`)
                    .addFields({ 
                        name: '**الاعضاء المتبقين في الروم:**', 
                        value: `\`\`\`${members}\`\`\``, 
                        inline: false 
                    })
                    .setColor('#FF0000')
                    .setThumbnail(oldState.member.user.displayAvatarURL({ extension: 'png' }))
                    .setTimestamp()
                    .setFooter({ text: `ZaraStore`, iconURL: client.user.displayAvatarURL({ extension: 'png' }) });
                
                logChannelDisconnect.send({ embeds: [embed] }).catch(() => {});
            }
        } catch (error) {
            console.error('Error in disconnect log:', error);
        }
    }
};
