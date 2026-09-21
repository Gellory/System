const Pro = require('pro.db');
const { EmbedBuilder } = require('discord.js');
const { owners } = require(`${process.cwd()}/config`);

module.exports = {
    name: 'list',
    aliases: ['قائمة-الصلاحيات', 'permissionslist'],
    run: async function (client, message) {
        if (!owners.includes(message.author.id)) return message.react('❌');
        const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) return;

        const Color = Pro.get(`Guild_Color = ${message.guild.id}`) || message.guild.members?.me?.displayHexColor || '#4e464f';
        if (!Color) return;

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

        const lines = [];
        for (const p of permissions) {
            const permissionKey = `Allow - Command ${p.value} = [ ${message.guild.id} ]`;
            const id = Pro.get(permissionKey);
            let mention = 'لا أحد';
            if (id) {
                const role = message.guild.roles.cache.get(id);
                const member = message.guild.members.cache.get(id);
                if (role) mention = `<@&${role.id}>`;
                else if (member) mention = `<@${member.id}>`;
                else mention = id;
            }
            lines.push(`**${p.name}** : ${mention}`);
        }

        const embed = new EmbedBuilder()
            .setColor(Color)
            .setTitle('قائمة الصلاحيات')
            .setDescription(lines.join('\n'))
            .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL() });

        return message.reply({ embeds: [embed] });
    }
};
