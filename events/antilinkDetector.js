const d99b = require(`pro.db`);
const { PermissionFlagsBits } = require('discord.js');

module.exports = async (client, message) => {
    // 1. تجاهل البوتات والرسائل الخاصة
    if (!message.guild || message.author.bot) return;
    
    // 2. تحقق إذا النظام مفعل
    const antilinkStatus = d99b.get(`antilinks-${message.guild.id}`);
    if (antilinkStatus !== 'on') return;
    
    // 3. تجاهل الأدمنز
    if (message.member.permissions.has(PermissionFlagsBits.Administrator)) return;
    
    // 4. قائمة الروابط المحظورة
    const blockedLinks = [
        'http://',
        'https://',
        'www.',
        'discord.gg/',
        'discord.com/invite/',
        '.com',
        '.net',
        '.org',
        '.gg',
        '.xyz',
        '.me',
        '.io'
    ];
    
    // 5. تحقق من وجود روابط
    let foundLink = false;
    const messageLower = message.content.toLowerCase();
    
    for (const link of blockedLinks) {
        if (messageLower.includes(link)) {
            foundLink = true;
            break;
        }
    }
    
    if (!foundLink) return;
    
    try {
        console.log(`[ANTILINK] ${message.author.tag} نشر رابط في ${message.guild.name}`);
        
        // 6. حذف الرسالة
        await message.delete().catch(err => {
            console.log('[ANTILINK] خطأ في حذف الرسالة:', err.message);
        });
        
        // 7. البحث عن رتبة الميوت
        let muteRole = message.guild.roles.cache.find(role => 
            role.name.toLowerCase() === 'muted' || 
            role.name === 'Muted' || 
            role.name === 'مكتوم'
        );
        
        // 8. إذا الرتبة غير موجودة، أنشئها
        if (!muteRole) {
            try {
                console.log('[ANTILINK] جاري إنشاء رتبة Muted...');
                muteRole = await message.guild.roles.create({
                    name: 'Muted',
                    color: '#000000',
                    permissions: [],
                    reason: 'لنظام منع الروابط التلقائي'
                });
                console.log('[ANTILINK] تم إنشاء رتبة Muted');
                
                // 9. تطبيق الصلاحيات على القنوات
                for (const channel of message.guild.channels.cache.values()) {
                    try {
                        await channel.permissionOverwrites.create(muteRole, {
                            SendMessages: false,
                            AddReactions: false,
                            Speak: false,
                            SendMessagesInThreads: false
                        });
                    } catch (err) {
                        // تجاهل الأخطاء
                    }
                }
            } catch (error) {
                console.log('[ANTILINK] خطأ في إنشاء رتبة الميوت:', error.message);
                return;
            }
        }
        
        // 10. إضافة الميوت للعضو
        try {
            await message.member.roles.add(muteRole);
            console.log(`[ANTILINK] تم ميوت ${message.author.tag} لمدة 20 دقيقة`);
        } catch (error) {
            console.log('[ANTILINK] خطأ في إضافة الميوت:', error.message);
        }
        
        // 11. إرسال تحذير للعضو
        try {
            await message.author.send({
                content: `⚠️ **تحذير من ${message.guild.name}**\n\nتم معاقبتك بـ **ميوت 20 دقيقة** لنشر رابط محظور.\n\n📝 **سبب العقوبة:** نشر رابط\n⏰ **المدة:** 20 دقيقة\n📌 **الرسالة:** ${message.content.substring(0, 50)}...`
            });
        } catch (dmError) {
            // إذا العضو مقفل الخاص
        }
        
        // 12. إرسال رسالة في القناة
        const warningMsg = await message.channel.send({
            content: `🚫 ${message.author} تم ميوتك 20 دقيقة لنشر رابط محظور!`
        }).catch(() => {});
        
        // 13. حذف رسالة التحذير بعد 5 ثواني
        if (warningMsg) {
            setTimeout(() => {
                warningMsg.delete().catch(() => {});
            }, 5000);
        }
        
        // 14. إزالة الميوت بعد 20 دقيقة
        setTimeout(async () => {
            try {
                if (message.member && message.member.roles.cache.has(muteRole.id)) {
                    await message.member.roles.remove(muteRole);
                    console.log(`[ANTILINK] تم إزالة الميوت عن ${message.author.tag}`);
                    
                    // إرسال رسالة للعضو
                    try {
                        await message.author.send({
                            content: `✅ **تم إزالة الميوت عنك في ${message.guild.name}**\n\nيمكنك الآن التحدث في السيرفر مرة أخرى.`
                        });
                    } catch (err) {}
                }
            } catch (error) {
                console.log('[ANTILINK] خطأ في إزالة الميوت:', error.message);
            }
        }, 20 * 60 * 1000); // 20 دقيقة
        
    } catch (error) {
        console.log('[ANTILINK] خطأ عام:', error.message);
    }
};
