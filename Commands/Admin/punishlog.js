const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const Data = require('pro.db');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('punishlog')
        .setDescription('عرض سجل العقوبات لعضو معين')
        .addUserOption(option => 
            option.setName('user')
                .setDescription('العضو المراد عرض سجله')
                .setRequired(true)),

    async execute(interaction) {
        const user = interaction.options.getUser('user');
        const guildId = interaction.guild.id;
        const userId = user.id;

        // Get all punishments for the user
        const punishments = Data.get(`punish_${guildId}_${userId}`) || [];
        
        if (punishments.length === 0) {
            return interaction.reply({ 
                content: `**❌ لا توجد عقوبات مسجلة للعضو ${user.tag}**`,
                ephemeral: true 
            });
        }

        // Create embed
        const embed = new EmbedBuilder()
            .setColor('#ff9900')
            .setTitle(`📜 سجل العقوبات - ${user.tag}`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .setTimestamp();

        // Group punishments by type
        const byType = {};
        punishments.forEach(punish => {
            if (!byType[punish.type]) byType[punish.type] = [];
            byType[punish.type].push(punish);
        });

        // Add fields for each punishment type
        for (const [type, punishes] of Object.entries(byType)) {
            const typeName = {
                'mute': 'ميوت نصي',
                'vmute': 'ميوت صوتي',
                'ban': 'حظر',
                'kick': 'طرد',
                'warn': 'تحذير',
                'prison': 'سجن',
                'timeout': 'تايم اوت'
            }[type] || type;

            const value = punishes
                .map((p, i) => {
                    const date = new Date(p.timestamp).toLocaleString('ar-EG');
                    const mod = interaction.guild.members.cache.get(p.moderator)?.user.tag || p.moderator;
                    const reason = p.reason || 'لا يوجد سبب';
                    return `${i + 1}. **${reason}** - ${date} (بواسطة: ${mod})`;
                })
                .join('\n');

            embed.addFields({
                name: `**${typeName} (${punishes.length})**`,
                value: value,
                inline: false
            });
        }

        // Add total count
        embed.setFooter({ 
            text: `إجمالي العقوبات: ${punishments.length} | تم الطلب بواسطة: ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL()
        });

        return interaction.reply({ embeds: [embed] });
    }
};
