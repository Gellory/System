const Discord = require("discord.js")
const db = require(`pro.db`)
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, ButtonStyle, ComponentType } = require("discord.js");
const { prefix } = require(`${process.cwd()}/config`);

module.exports = {
    name: 'help',
    run: async (client, message, args) => {
        const isEnabled = db.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) {
            return;
        }

        const Color = db.get(`Guild_Color = ${message.guild.id}`) || '#192029';
        if (!Color) return;

        const button = new ButtonBuilder()
            .setLabel('Pal Store')
            .setStyle(ButtonStyle.Link)
            .setURL('https://discord.gg/g4SBNZZkXJ');

        // إضافة دالة لإنشاء الفوتر
        const createEmbed = (title, description) => {
            return new EmbedBuilder()
                .setColor(Color || '#192029')
                .setTitle(title)
                .setDescription(description)
                .setFooter({ 
                    text: 'Pal Store • ',
                    iconURL: 'https://i.ibb.co/DfpnHFFz/logo3d.png'
                })
                .setThumbnail('https://i.ibb.co/DfpnHFFz/logo3d.png');
        };

        const replyembed = new EmbedBuilder()
            .setColor(Color || '#192029')
            .setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
            .setFooter({ 
                text: 'Pal Store • ',
                iconURL: 'https://i.ibb.co/DfpnHFFz/logo3d.png'
            })
            .setDescription(`**اوامر البوت : 
يمكنك الان عرض قائمة الاوامر المناسبه لك 
بادئة البوت : ${prefix}
الاوامر : 160**`);

        const r1ow = new ActionRowBuilder().addComponents(button);
        
        const row = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('help')
                    .setPlaceholder("قائمة الأوامر...")
                    .addOptions([
                        {
                            label: "الأوامر العامة",
                            value: 'help1',
                            emoji: '<:logo:1498436727029628979>',
                        },
                        {
                            label: "الأوامر الإدارية",
                            value: 'help2',
                            emoji: '<:logo:1498436727029628979>',
                        },
                        {
                            label: 'أوامر الرولات',
                            value: 'help3',
                            emoji: '<:logo:1498436727029628979>',
                        },
                        {
                            label: 'أوامر الشاتات',
                            value: 'help4',
                            emoji: '<:logo:1498436727029628979>',
                        },
                        {
                            label: 'أوامر الحماية',
                            value: 'help5',
                            emoji: '<:logo:1498436727029628979>',
                        },
                        {
                            label: 'أوامر الاعدادات',
                            value: 'help6',
                            emoji: '<:logo:1498436727029628979>',
                        },
                        {
                            label: 'أوامر السيرفر',
                            value: 'help9',
                            emoji: '<:logo:1498436727029628979>',
                        }
                    ])
            );

        // إرسال الرسالة
        const msg = await message.reply({
            embeds: [replyembed],
            components: [row, r1ow]
        }).catch(console.error);

        // معالجة التفاعلات
        const filter = (i) => i.customId === 'help' && i.user.id === message.author.id;
        const collector = msg.createMessageComponentCollector({ 
            componentType: ComponentType.StringSelect, 
            time: 200000, 
            filter 
        });

        let isDeleted = false;

        collector.on('collect', async (interaction) => {
            if (isDeleted) return;
            
            await interaction.deferUpdate().catch(() => {});
            let embed;

            switch (interaction.values[0]) {
                case "help1":
                    embed = createEmbed(
                        'ألاوامر ألعامة',
                        `
\`${prefix}help\` : قائمه المساعدة
\`${prefix}avatar\` : عرض صورة شخص
\`${prefix}banner\` : عرض بنر شخص
\`${prefix}user\` : عرض معلومات عضو
\`${prefix}top\` : عرض توب 8 اشخاص 
\`${prefix}server\` : عرض معلومات السيرفر
\`${prefix}myinv\` : عدد دعواتك
\`${prefix}topinv\` : اعلى عدد دعوات
\`${prefix}mcolors\` : اختار لونك من القائمة
\`${prefix}colors\` : علبة الالوان
\`${prefix}color\` : اختيار لون
\`${prefix}change\` : اضافة فلتر لصورة
\`${prefix}circle\` : عرض صورة العضو على شكل دائرة
\`${prefix}aremove\` : يزيل خلفية الصور
\`${prefix}semoji\` : أرسال صورة الايموجي
\`${prefix}edit-image\` : فلاتر وتعديل علي الصور
`
                    );
                    break;

                case "help2":
                    embed = createEmbed(
                        'ألاوامر ألإدارية',
                        `
\`${prefix}stickers\` : اضافة ستيكرز للسيرفر
\`${prefix}aemoji\` : اضافة ايموجي للسيرفر
\`${prefix}mute\` : اسكات كتابي
\`${prefix}mymute\` : معلومات ميوت العضو
\`${prefix}unmute\` : الغاء الاسكات الكتابي
\`${prefix}prison\` : سجن عضو
\`${prefix}myprison\` : معلومات سجن العضو
\`${prefix}unprison\` : فك سجن عضو
\`${prefix}unvmute\` : فك ميوت صوتي عن عضو
\`${prefix}vmute\` : اسكات عضو من الفويس
\`${prefix}ban\` : حظر العضو
\`${prefix}unban\` : الغاء الحظر من شخص
\`${prefix}unbanal\` : الغاء المحظورين من السيرفر
\`${prefix}allbans\` : قائمة المحظورين
\`${prefix}kick\` : طرد عضو من السيرفر
\`${prefix}setnick\` : تغيير اسم عضو داخل السيرفر
\`${prefix}clear\` : مسح رسائل الشات
\`${prefix}move\` : سحب عضو الى روم اخر
\`${prefix}moveme\` : توديك لعضو بروم اخر
\`${prefix}warn\` : اعطاء تحذير لعضو
\`${prefix}warnings\` : الحصول على قائمة التحذيرات لعضو
\`${prefix}remove-warn\` : إزاله تحذير اعضاء
\`${prefix}timeout\` : اعطاء تايم اوت
\`${prefix}reasons\` : إدارة الأسباب الميوت / الاسكات / السجن 
\`${prefix}سجل\` : عرض سجل العقوبات للعضو
\`${prefix}مسح سجل\` : مسح سجل العقوبات للعضو
`
                    );
                    break;

                case "help3":
                    embed = createEmbed(
                        'أوامر ألرولات',
                        `
\`${prefix}role\` : اضافة رتبة لعضو
\`${prefix}myrole\` : تعديل رولك الخاص
\`${prefix}dsrole\` : حذف رول خاص
\`${prefix}srole\` : انشاء رول خاص
\`${prefix}addrole\` : انشاء رول جديد
\`${prefix}autorole\` : اضافة رتبة لكل عضو يدخل
\`${prefix}daorole\` : حذف تحديد الرول التلقائي
\`${prefix}allrole\` : اعطاء رول لجميع الاعضاء
\`${prefix}removrole\` : ازاله رول من جميع الاعضاء
\`${prefix}here\` : اضافة رول الهير للعضو
\`${prefix}pic\` : اضافة رول الصور للعضو
\`${prefix}live\` : اضافة رتبة تسمح بفتح كام وشير
\`${prefix}nick\` : اضافة رتبه تغير الآسم
\`${prefix}check\` : تشييك على الاعضاء في الرول
\`${prefix}checkvc\` : تشييك علي الاعضاء في الرول المتصلين بالرومات الصوتية
`
                    );
                    break;

                case "help4":
                    embed = createEmbed(
                        'أوامر الشاتات',
                        `
\`${prefix}ochat\` : تحديد شات الاوامر
\`${prefix}hide\` : إحفاء الشات عن الكل
\`${prefix}unhide\` : إظهار الشات للكل
\`${prefix}lock\` : قفل الروم
\`${prefix}unlock\` : فتح الروم
\`${prefix}slowmode\` : تفعيل الوضع البطيئ بالروم
\`${prefix}autoreply\` : اضافة كلمة وردها
\`${prefix}dreply\` : حذف كلة وردها
\`${prefix}mhide\` : إخفاء الشات عن عضو
\`${prefix}mshow\` : إظهار الشات لعضو
\`${prefix}setchats\` : للتحكم بالفواصل والريأكشن وشات الصور 
\`${prefix}setreact\` : رياكشن تلقائي بالشات
\`${prefix}unreact\` : تعطيل الرياكشن التلقائي بالشات
\`${prefix}applay\` : تفعيل المنشن والصور بالشات
\`${prefix}disapplay\` : تعطيل المنشن والصور بالشات
\`${prefix}scolors\` : للتحكم بعلبه الالوان بشكل كامل

`
                    );
                    break;

                case "help5":
                    embed = createEmbed(
                        "💡 أوامر الحماية",
                        `
\`${prefix}bots\` : اظهار البوتات الموجودة بالسيرفر
\`${prefix}word\` : اضافة او ازالة كلمات يعاقب كاتبها
\`${prefix}wordlist\` : عرض الكلامات التي يعاقب كاتبها
\`${prefix}pslist\` : عرض قائمة الحماية المفعلة والمعطلة
\`${prefix}restbackup\` : إسترجاع نسخة السيرفر المحفوظة 
\`${prefix}security\` : لتفعيل الحمايه المفعله وتعطيلها
\`${prefix}restemoji\` : إسترجاع الاموجيات الخاصة بسيرفرك
\`${prefix}block\` : منع عضو من دخول السيرفر
\`${prefix}unblock\` : فك منع عضو من دخول السيرفر
\`${prefix}setsecurity\` : إنشاء لوجات الحماية
\`${prefix}wanti\` : إضافة أشخاص لتخطى الحماية
\`${prefix}wantilist\` : عرض قائمة الاشخاص المسوح لهم 
\`${prefix}setrjoin\` : تحديد الاجراء مع الحسابات الجديده

`
                    );
                    break;

                case "help6":
                    embed = createEmbed(
                        'أوامر ألاعدادات',
                        `
\`${prefix}allow\` : السماح لعضو او رول لاستعمال امر
\`${prefix}deny\` : منع لعضو او رول لاستعمال امر
\`${prefix}setlog\` : انشاء شاتات اللوق
\`${prefix}detlog\` : حذف شاتات اللوق
\`${prefix}imagechat\` : تحديد صوره لعلبة الالوان
\`${prefix}ctcolors\` : انشاء رولات الوان 
\`${prefix}setclear\` : إلغاء / تحديد شات المسج التلقائي
\`${prefix}edit-wlc\` : تعديل اعدادات الترحيب
\`${prefix}edit-avt\` : جميع اوامر تعديل سيرفرات الافتارت
\`${prefix}locomnd\` : تفعيل او تعطيل امر
\`${prefix}setvoice\` : تثبيت البوت بفويس 
\`${prefix}progress\` : تفعيل او ايقاف نظام النقاط
\`${prefix}reset-all\` : تصفير جميع النقاط
\`${prefix}reset\` : تصفير نقاط عضو
\`${prefix}rlevel\` : قائمة جميع الفلات
`
                    );
                    break;

                case "help9":
                    embed = createEmbed(
                        '💡 أوامر مالك البوت',
                        `
\`${prefix}guild [Server / id]\` : تغير سيرفر البوت
\`${prefix}vip\` : أوامر ألاونر
\`${prefix}dm\` : أرسال رساله لخاص العضو
\`${prefix}say\` : أرسال رساله عن طريق البوت
\`${prefix}setprefix\` : تغيير بادئه البوت
\`${prefix}cmunprefix\` : أستعامل جميع الاوامر بدون برفيكس
\`${prefix}owners\` : عرض قائمة الاونرات
\`${prefix}setowner\` : إضافة اونر للبوت
\`${prefix}removeowner\` : ازالة اونر من البوت
\`${prefix}acomnd\` : أضافه اختصار للأوامر
\`${prefix}listlcomnd\` : يظهر قائمة الاختصارات
\`${prefix}removeShortcut\` : يحذف اختصار
`
                    );
                    break;
                    return;
            }

            // تعديل الرسالة مع معالجة الأخطاء
            try {
                await msg.edit({ embeds: [embed], components: [row, r1ow] });
            } catch (error) {
                if (error.code === 10008) {
                    console.log('الرسالة تم حذفها، لا يمكن التعديل');
                    // يمكن إضافة رد للتفاعل بأن الرسالة محذوفة
                    await interaction.followUp({ 
                        content: 'تم حذف رسالة المساعدة. أعد استخدام الأمر `' + prefix + 'help` للحصول على قائمة جديدة.', 
                        ephemeral: true 
                    }).catch(() => {});
                }
            }
        });

        collector.on('end', async () => {
            if (isDeleted) return;
            
            try {
                const disabledRow = new ActionRowBuilder()
                    .addComponents(
                        new StringSelectMenuBuilder()
                            .setCustomId('help')
                            .setPlaceholder("انتهت صلاحية القائمة")
                            .setDisabled(true)
                            .addOptions([
                                { label: 'آلاوامر ألعامة', value: 'help1' },
                                { label: 'أوامر ا لادارة', value: 'help2' },
                                { label: 'أوامر الشاتات', value: 'help4' },
                                { label: 'أوامر الرولات', value: 'help3' },
                                { label: 'أوامر الحماية', value: 'help5' },
                                { label: 'أوامر الاعداد', value: 'help6' },
                                { label: 'أوامر ألتذاكر', value: 'help7' },
                                { label: 'أوامر السيرفر', value: 'help9' }
                            ])
                    );
                
                // محاولة تعطيل القائمة مع معالجة الأخطاء
                await msg.edit({ components: [disabledRow, r1ow] }).catch(error => {
                    if (error.code !== 10008) {
                        console.error('خطأ في تعطيل القائمة:', error);
                    }
                });
            } catch (error) {
                // تجاهل خطأ Unknown Message
                if (error.code !== 10008) {
                    console.error('خطأ غير متوقع في نهاية المجمع:', error);
                }
            }
        });
    }
}