const {
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ButtonBuilder,
    EmbedBuilder,
    ButtonStyle
} = require('discord.js');
const Pro = require('pro.db');
const { owners, prefix } = require(`${process.cwd()}/config`);

module.exports = {
    name: 'deny',
    aliases: ['حذف'],
    run: async function (client, message) {
        if (!owners.includes(message.author.id)) return message.react('❌');
        const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) return;

        const Color = Pro.get(`Guild_Color = ${message.guild.id}`) || '#4e464f';
        if (!Color) return;

        const Args = message.content.split(' ');
        if (!Args[1]) {
            const Embed = new EmbedBuilder()
                .setColor(Color)
                .setDescription(`**يرجى استخدام الأمر بالطريقة الصحيحة .**\n${prefix}deny <permission> <@role|@member>`);
            return message.reply({ embeds: [Embed] });
        }

        const Roles = message.guild.roles.cache.get(Args[2]) || message.mentions.roles.first();
        const Member = message.guild.members.cache.get(Args[2]) || message.mentions.members.first();

        if (!Roles && !Member) {
            const embed = new EmbedBuilder()
                .setColor(Color)
                .setDescription('**يرجى ارفاق منشن صحيح للرول أو العضو.**');
            return message.reply({ embeds: [embed] });
        }

        // build permissions list same as allow.js
        const permissions = [
            { name: 'حظر وفك', value: 'ban' },
            { name: 'الطرد', value: 'kick' },
            { name: 'السجن', value: 'prison' },
            { name: 'الأسكاتي الكتابي', value: 'mute' },
            { name: 'الميوت الصوتي', value: 'vmute' },
            { name: 'اعطاء إزالة رول', value: 'role' },
            { name: 'اعطاء إزالة إنشاء, رول للجميع', value: 'allrole' },
            { name: 'الرولات الخاصة', value: 'srole' },
            { name: 'المسح', value: 'clear' },
            { name: 'الصور ،الهير ،الكام', value: 'pic' },
            { name: 'سحب ،ودني', value: 'move' },
            { name: 'قفل فتح', value: 'lock' },
            { name: 'اخفاء اظهار', value: 'hide' },
            { name: 'معلومات الرول', value: 'check' },
            { name: 'اوامر الانذارات', value: 'warn' },
            { name: 'إزالة إضافة الكنية', value: 'setnick' }
        ];

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('denySelect')
            .setPlaceholder('يرجى أختيار الصلاحيات المراد إزالتها')
            .setMinValues(1)
            .setMaxValues(permissions.length)
            .addOptions(
                permissions.map(p => ({ label: p.name, value: p.value }))
            );

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const cancelButton = new ButtonBuilder()
            .setCustomId('ItsCancel')
            .setLabel('إلغاء')
            .setStyle(ButtonStyle.Danger);
        const cancelRow = new ActionRowBuilder().addComponents(cancelButton);

        const embed = new EmbedBuilder()
            .setColor(Color)
            .setTitle('اختر الصلاحيات للإزالة')
            .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });

        const menuMessage = await message.reply({ embeds: [embed], components: [row, cancelRow] });

        const filter = i => i.user.id === message.author.id && i.customId === 'denySelect';
        const collector = menuMessage.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async interaction => {
            const chosen = interaction.values; // array of permission values
            const roleId = Roles ? Roles.id : Member.id;

            for (const permission of chosen) {
                const permissionKey = `Allow - Command ${permission} = [ ${message.guild.id} ]`;
                const existing = Pro.get(permissionKey);
                if (existing && existing === roleId) {
                    Pro.delete(permissionKey);
                } else if (existing && existing !== roleId) {
                    // if stored id is different, only delete if matches target; otherwise ignore
                }
            }

            const resultEmbed = new EmbedBuilder()
                .setColor(Color)
                .setTitle('تمت إزالة الصلاحيات')
                .setDescription(`\t${Roles ? `<@&${Roles.id}>` : `<@${Member.id}>`} تم إزالة: \n\n${chosen.map(v => `**- ${permissions.find(p=>p.value===v).name}**`).join('\n')}`)
                .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });

            await menuMessage.edit({ embeds: [resultEmbed], components: [] });
            collector.stop();
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                menuMessage.edit({ content: 'لم يتم اختيار الصلاحيات، حاول مرة أخرى.', components: [] });
            }
        });

        client.on('interactionCreate', async interaction => {
            if (!interaction.isButton()) return;
            if (interaction.customId === 'ItsCancel') {
                const msg = interaction.message;
                if (msg && !msg.deleted) {
                    collector.stop();
                    msg.delete().catch(() => {});
                }
            }
        });
    }
};
