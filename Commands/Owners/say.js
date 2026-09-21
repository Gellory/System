const { AttachmentBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { prefix, owners } = require(`${process.cwd()}/config`);
const Data = require(`pro.db`);

module.exports = {
    name: 'say',
    run: async (client, message, args) => {


        if (!owners.includes(message.author.id)) return message.react('❌');
        const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) {
            return; 
        }
        
        const Color = Data.get(`Guild_Color = ${message.guild.id}`) || '#192029';
        if (!Color) return;


     
        if (message.author.bot) return;
        if (!message.channel.guild) return;
        
        if (!message.guild.members.me.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('**لا استطيع إرسال الرسالة.**');
        }

        let channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
        let content = args.slice(1).join(' ');
        let attach = message.attachments.first();

        const embed = new EmbedBuilder()
        .setColor(`${Color || `#192029`}`)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}say <#${message.channel.id}> رسالة أو صورة**`);
        if (!channel)  return message.reply({ embeds: [embed] });



        if (!content && !attach) return message.reply('**يرجى إرسال الرسالة أو رفع صورة.**');

        message.delete();

        try {
            if (attach) {
                const attachment = new AttachmentBuilder(attach.url);
                await channel.send({ content: content || ' ', files: [attachment] });
            } else {
                await channel.send({ content: content || ' ' });
            }
        } catch (error) {
            console.error(error);
            return message.reply('**حدث خطأ أثناء إرسال الرسالة.**');
        }
    }
}
