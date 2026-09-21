const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const Pro = require('pro.db');
const { owners, prefix } = require(`${process.cwd()}/config`);
let grantedPermissions = {}; // تعريف المتغير كمتغير عالمي

module.exports = {
    name: 'سماح',
    aliases: ['allow'],
    description: 'يمكن هذا الأمر للمالكين فقط، ويسمح بإضافة صلاحيات لدور أو عضو محدد.',
    run: async function(client, message) {

        if (!owners.includes(message.author.id)) return message.react('❌');
        const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) {
            return; 
        }


        const Color = Pro.get(`Guild_Color = ${message.guild.id}`) || '#192029';
        if (!Color) return;


        const Args = message.content.split(' ');

        if (!Args[1]) {
            const Embed = new EmbedBuilder()
                .setColor(Color)
                .setDescription(`**يرجى استخدام الأمر بالطريقة الصحيحة .**\n${prefix}allow <@${message.author.id}>`);

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

        const permissions = [
            { name: 'حظر وفك', value: 'ban', emoji: '<:logo:1498436727029628979>' },
            { name: 'الطرد', value: 'kick', emoji: '<:logo:1498436727029628979>' },
            { name: 'السجن', value: 'prison', emoji: '<:logo:1498436727029628979>' },
            { name: 'الأسكاتي الكتابي', value: 'mute', emoji: '<:logo:1498436727029628979>' },
            { name: 'الميوت الصوتي', value: 'vmute', emoji: '<:logo:1498436727029628979>' },
            { name: 'اعطاء إزالة رول', value: 'role', emoji: '<:logo:1498436727029628979>' },
            { name: 'اعطاء إزالة إنشاء, رول للجميع', value: 'allrole', emoji: '<:logo:1498436727029628979>' },
            { name: 'الرولات الخاصة', value: 'srole', emoji: '<:logo:1498436727029628979>' },
            { name: 'المسح', value: 'clear', emoji: '<:logo:1498436727029628979>' },
            { name: 'الصور ،الهير ،الكام', value: 'pic', emoji: '<:logo:1498436727029628979>' },
            { name: 'سحب ،ودني', value: 'move', emoji: '<:logo:1498436727029628979>' },
            { name: 'قفل فتح', value: 'lock', emoji: '<:logo:1498436727029628979>' },
            { name: 'اخفاء اظهار', value: 'hide', emoji: '<:logo:1498436727029628979>' },
            { name: 'معلومات الرول', value: 'check', emoji: '<:logo:1498436727029628979>' },
            { name: 'اوامر الانذارات', value: 'warn', emoji: '<:logo:1498436727029628979>' },
            { name: 'إزالة إضافة الكنية', value: 'setnick', emoji: '<:logo:1498436727029628979>' },



        ];

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('permissionSelect')
            .setPlaceholder('يرجى أختيار الصلاحيات المُراد إضافتها')
            .setMinValues(1) 
            .setMaxValues(permissions.length) 
            .addOptions(
                permissions.map(permission => ({
                    label: permission.name,
                    value: permission.value,
                    emoji: permission.emoji
                }))
            );

        const row = new ActionRowBuilder().addComponents(selectMenu);

        const ddeleteButton = new ButtonBuilder()
            .setCustomId('ItsCancel')
            .setLabel('إلغاء')
            .setStyle(ButtonStyle.Danger);

        const ItsCancel = new ActionRowBuilder()
            .addComponents(ddeleteButton);

        const embed = new EmbedBuilder()
            .setColor(Color)
            .setTitle("يرجى تحديد الامر .")
            .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL({ extension: 'png' }) });
            
        const menuMessage = await message.reply({
            embeds: [embed],
            components: [row, ItsCancel]
        });

        const filter = interaction => interaction.user.id === message.author.id && interaction.customId === 'permissionSelect';
        const collector = menuMessage.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async interaction => {
            const chosenPermissions = interaction.values;
            const roleId = Roles ? Roles.id : Member.id; 
            
            if (!grantedPermissions[roleId]) {
                grantedPermissions[roleId] = [];
            }
        
            for (const permission of chosenPermissions) {
                if (!grantedPermissions[roleId].includes(permission)) {
                    const permissionKey = `Allow - Command ${permission} = [ ${message.guild.id} ]`;
                    const existingPermission = Pro.get(permissionKey); 
            
                    if (!existingPermission || existingPermission === message.guild.id) {
                        Pro.set(permissionKey, roleId);
            
                        const permissionName = permissions.find(p => p.value === permission).name;
                        grantedPermissions[roleId].push(permission);
                    }
                }
            }
            
            let mention = Roles ? `<@&${Roles.id}>` : `<@${Member.id}>`;

            const permissionsEmbed = new EmbedBuilder()
                .setColor(Color)
                .setFooter({ text: client.user.username, iconURL: client.user.displayAvatarURL({ extension: 'png' }) })
                .setTitle("إستخدام ناجح ✅")
                .setDescription(`\`صلاحيات\` **${mention}** \`الآن\` :\n\n${grantedPermissions[roleId].map(p => `**✅ | ${permissions.find(permission => permission.value === p).name}**`).join('\n')}`);
        
            await menuMessage.edit({ embeds: [permissionsEmbed], components: [] });
        });

        collector.on('end', collected => {
            if (collected.size === 0) {
                menuMessage.edit('لم يتم اختيار الصلاحيات، حاول مرة أخرى.', { components: [] });
            }
        });
        
        client.on('interactionCreate', async (interaction) => {
            if (!interaction.isButton()) return;
        
            if (interaction.customId === 'ItsCancel') {
                const message = interaction.message;
                if (message && !message.deleted) {
                    collector.stop();
                    message.delete();
                }
            }
        });        
    }
};
