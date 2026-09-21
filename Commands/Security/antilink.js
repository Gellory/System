const d99b = require(`pro.db`)
const { owners, prefix } = require(`${process.cwd()}/config`);
const { PermissionFlagsBits } = require('discord.js'); // هذا مهم!

module.exports = {
    name: `antilink`,
    run: async (client, message) => {
        // 1. تحقق من المالكين
        if (!owners.includes(message.author.id)) {
            return message.react('❌');
        }
      
        // 2. تحقق من الصلاحيات بطريقة صحيحة
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply('❌ تحتاج صلاحية ADMINISTRATOR');
        }

        // 3. قسم الرسالة
        const args = message.content.split(' ');
        let onoroff = args[1];
        
        if (!onoroff) {
            return message.reply(`📝 مثال: ${prefix}antilink on`);
        }
        
        if (onoroff.toLowerCase() === 'on') {
            // تشغيل النظام
            d99b.set(`antilinks-${message.guild.id}`, 'on');
            return message.reply('✅ تم تفعيل منع الروابط');
            
        } else if (onoroff.toLowerCase() === 'off') {
            // إيقاف النظام
            d99b.set(`antilinks-${message.guild.id}`, 'off');
            return message.reply('❌ تم إيقاف منع الروابط');
            
        } else {
            return message.reply(`❌ استخدم: ${prefix}antilink on/off`);
        }
    }
}