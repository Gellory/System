const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const db = require(`pro.db`);

module.exports = {
    name: 'bots',
    run: async (client, message, args) => {
        const Data = db.get(`Allow - Command bots = [ ${message.guild.id} ]`);
        const allowedRole = message.guild.roles.cache.get(Data);
        const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

        if (!isAuthorAllowed && message.author.id !== Data && !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌');
        }

        const Color = db.get(`Guild_Color = ${message.guild.id}`) || "#1e1f22";

        function formatDate(timestamp) {
            return `<t:${Math.floor(timestamp / 1000)}:R>`;
        }
        
        const bots = message.guild.members.cache.filter(member => member.user.bot)
                          .sort((a, b) => a.joinedTimestamp - b.joinedTimestamp); 
                          
        const embed = new EmbedBuilder()
            .setColor(Color);

        let description = "";

        bots.forEach((bot) => {
            const joinedAtFormatted = formatDate(bot.joinedTimestamp);
            description += `**\`#\` <@${bot.user.id}> | ${joinedAtFormatted}**\n`;
        });

        embed.setDescription(description);

        message.reply({ embeds: [embed] });
    }
};
