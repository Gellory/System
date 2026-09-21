const Pro = require(`pro.db`);
const { EmbedBuilder, PermissionFlagsBits } = require(`discord.js`);
const { prefix, owners } = require(`${process.cwd()}/config`);
const { logPunishment } = require("../../utils/punishmentLogger");

module.exports = {
    name: `kick`,
    aliases: ["طرد"],
    run: async function (client, message) {

        const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) {
            return; 
        }

        const Color = Pro.get(`Guild_Color = ${message.guild.id}`) || '#192029';
        if (!Color) return;

        const args = message.content.split(' ');
        const db = Pro.get(`Allow - Command kick = [ ${message.guild.id} ]`);
        const allowedRole = message.guild.roles.cache.get(db);
        const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

        if (!isAuthorAllowed && message.author.id !== db && !message.member.permissions.has(PermissionFlagsBits.KickMembers)) {
            // إجراءات للتصرف عندما لا يتحقق الشرط
            return;
        }

        const memberArg = args[1];
        const member = message.mentions.members.first() || message.guild.members.cache.find(member => member.id === memberArg || member.user.tag === memberArg || member.user.username === memberArg);
        
        if (!member) {
            const embed = new EmbedBuilder()
                .setColor(`${Color || `#192029`}`)
                .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}طرد <@${message.author.id}>**`);
            return message.reply({ embeds: [embed] });
        }

        if (member.roles.highest.position >= message.member.roles.highest.position && !owners.includes(message.author.id)) { 
            return message.reply('**لا يمكنك طرد شخصٍ أعلى منك بالأدوار.**'); 
        }
        

        // Check if a reason is provided
        let kickReason = args.slice(2).join(" ");
        if (!kickReason) {
            kickReason = "No reason";
        }

        // Kick the member
        await member.kick();

        // Log the punishment
        await logPunishment(
            message.guild.id,
            member.id,
            message.author.id,
            'kick',
            kickReason || 'No reason provided',
            null
        );

        // Send log to the log channel
        const logkick = Pro.get(`logkick_${message.guild.id}`); // Fetching log kick channel ID from the database
        const logChannel = message.guild.channels.cache.get(logkick);
        if (logChannel) {
            const executor = message.author;
            const logEmbed = new EmbedBuilder()
                .setAuthor({ name: executor.tag, iconURL: executor.displayAvatarURL({ extension: 'png' }) })
                .setDescription(`**طرد عضو**\n\n**العضو : <@${member.user.id}>**\n**بواسطة : ${executor}**\n\`\`\`Reason : ${kickReason}\`\`\`\ `)
                .setColor(`#493042`)
                .setFooter({ text: member.user.tag, iconURL: member.displayAvatarURL({ extension: 'png' }) })
                .setThumbnail(`https://cdn.discordapp.com/attachments/1091536665912299530/1209563150119211138/F4570260-9C71-432E-87CC-59C7B4B13FD4.png?ex=65e76077&is=65d4eb77&hm=5d7ef4be2c19a4f52c29255991dc129b53cf33d11c8d962ea0573cd72feaf3ac&`);
            logChannel.send({ embeds: [logEmbed] });
        }

        return message.react('✅');
    }
};
