const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const Pro = require(`pro.db`);
const { prefix, owners } = require(`${process.cwd()}/config`);

module.exports = {
    name: 'move',
    aliases: ["سحب"],
    run: async (client, message, args) => {

        const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) {
            return; 
        }


        const Color = Pro.get(`Guild_Color = ${message.guild.id}`) || `#192029`;
        if (!Color) return;

        const db = Pro.get(`Allow - Command move = [ ${message.guild.id} ]`);
        const allowedRole = message.guild.roles.cache.get(db);
        const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

        if (!isAuthorAllowed && message.author.id !== db && !message.member.permissions.has(PermissionFlagsBits.MoveMembers)) {
            return message.react('❌');
        }

        const memberArg = args[0];
        const member = message.mentions.members.first() || message.guild.members.cache.find(member => member.id === memberArg || member.user.tag === memberArg || member.user.username === memberArg);
        if (!member) {
            const embed = new EmbedBuilder()
                .setColor(`${Color || message.guild.members.me.displayHexColor || `#192029`}`)
                .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}سحب <@${message.author.id}>**`);
            return message.reply({ embeds: [embed] });
        }

        const authorVoiceChannel = message.member.voice.channel;
        const memberVoiceChannel = member.voice.channel;
        if (!memberVoiceChannel || authorVoiceChannel === memberVoiceChannel) { return message.react('❌'); }
        member.voice.setChannel(authorVoiceChannel);
        message.react('✅');

        let logmove = Pro.get(`logmove_${message.guild.id}`);
        var logChannel = message.guild.channels.cache.find(c => c.id === logmove);
        if (!logChannel) return;

        const executor = message.member;
        const target = member;
        const embed = new EmbedBuilder()
            .setAuthor({ name: executor.displayName, iconURL: executor.user.displayAvatarURL({ extension: 'png' }) })
            .setDescription(`**انتقل إلى قناة**\n\n**العضو : <@${target.id}>**\n**بواسطة : <@${executor.id}>**\n**من : <#${memberVoiceChannel.id}>**\n**إلى : <#${authorVoiceChannel.id}>**`)
            .setColor(`#712519`)
            .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL({ extension: 'png' }) })
            .setThumbnail(`https://cdn.discordapp.com/attachments/1091536665912299530/1208820125478821948/position.png?ex=65e4ac78&is=65d23778&hm=8aa439a09c54106441eae7ca8bd1fe821e61596da8ac429b887cee61fbef0170&`);

        logChannel.send({ embeds: [embed] });
    }
}
