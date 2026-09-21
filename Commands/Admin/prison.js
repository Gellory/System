const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, PermissionFlagsBits, ButtonStyle, PermissionsBitField } = require('discord.js');
const { prefix, owners } = require(`${process.cwd()}/config`);
const ms = require('ms');
const moment = require('moment');
const db = require('pro.db');
const { logPunishment } = require('../../utils/punishmentLogger');

module.exports = {
  name: 'prison',
  aliases: ['سجن'],
  run: async (client, message) => {
    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
      return;
    }

    const Color = db.get(`Guild_Color = ${message.guild.id}`) || '#192029';
    if (!Color) return;
    
    // ⭐⭐⭐ هذا هو التعديل المهم ⭐⭐⭐
    // 1. فقط المالكين والأدمنز الستريتور (Administrator)
    const isOwner = owners.includes(message.author.id);
    
    // 2. التحقق من صلاحية Administrator فقط
    const hasAdministrator = message.member.permissions.has(PermissionFlagsBits.Administrator);
    
    // 3. إذا ليس مالك وليس عنده صلاحية Administrator، ارفض
    if (!isOwner && !hasAdministrator) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription('🚫 **هذا الأمر فقط للمالكين والأدمنز الستريتور!**\n\n**الصلاحية المطلوبة:** `ADMINISTRATOR`')
        ]
      });
    }

    // 4. تجاهل التحقق من الرتبة المسموحة (لأننا نريد فقط الستريتور)
    // لا تضع أي كود للتحقق من allowDb هنا

    let args = message.content.split(' ').slice(1);
    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

    if (!member) {
      const embed = new EmbedBuilder()
        .setColor(`${Color || `#192029`}`)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}سجن <@عضو>**`);
      return message.reply({ embeds: [embed] });
    }

    if (member.id === message.member.id) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription('❌ **لا يمكنك سجن نفسك!**')
        ]
      });
    }
    
    if (message.member.roles.highest.position < member.roles.highest.position) {
      return message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF0000')
            .setDescription('❌ **لا يمكنك سجن عضو رتبته أعلى من رتبتك!**')
        ]
      });
    }

    // الحصول على الأسباب من قاعدة البيانات أو استخدام القيم الافتراضية
    const reasonData = db.get(`prison_reasons_${message.guild.id}`) || {};
    
    // إضافة ايموجي للأسباب
    const menuOptions = [
      { 
        label: 'مشاكل متكرره | 1', 
        description: reasonData['مشاكل متكرره']?.time || `6h`, 
        value: 'مشاكل متكرره',
        emoji: '<:logo:1498436727029628979>'
      },
      { 
        label: 'قذف متكرر | 2', 
        description: reasonData['قذف متكرر']?.time || `2d`, 
        value: 'قذف متكرر',
        emoji: '<:logo:1498436727029628979>'
      },
      { 
        label: 'نشر | 3', 
        description: reasonData['نشر']?.time || `no limit`, 
        value: 'نشر',
        emoji: '<:logo:1498436727029628979>'
      },
      { 
        label: 'بلاك | 4', 
        description: reasonData['بلاك']?.time || `no limit`, 
        value: 'بلاك',
        emoji: '<:logo:1498436727029628979>'
      },
    ];

    const menu = new StringSelectMenuBuilder()
      .setCustomId('prison_menu')
      .setPlaceholder('اختر عقوبة العضو ووقت السجن')
      .addOptions(menuOptions);

    const deleteButton = new ButtonBuilder()
      .setCustomId('Cancel')
      .setLabel('الغاء')
      .setStyle(ButtonStyle.Secondary);

    const menuRow = new ActionRowBuilder().addComponents(menu);
    const buttonRow = new ActionRowBuilder().addComponents(deleteButton);

    message.reply({ 
      content: `**يرجي تحديد سبب العقوبه.**\n**العضو:** <@${member.id}>`, 
      components: [menuRow, buttonRow] 
    });

    const filter = (interaction) => interaction.isStringSelectMenu() && interaction.user.id === message.author.id;

    const collector = message.channel.createMessageComponentCollector({ filter, time: 150000 });

    collector.on('collect', async (interaction) => {
      const selectedOption = interaction.values[0];
      let time;
      let reason = selectedOption;
      
      // الحصول على الوقت والسبب من قاعدة البيانات أو القيم الافتراضية
      const reasonData = db.get(`prison_reasons_${message.guild.id}`) || {};
      if (reasonData[selectedOption]) {
        time = reasonData[selectedOption].time === 'no limit' ? Infinity : reasonData[selectedOption].time;
        reason = reasonData[selectedOption].reason || selectedOption;
      } else {
        if (selectedOption === 'مشاكل متكرره') {
          time = '6h';
        } else if (selectedOption === 'قذف متكرر') {
          time = '2d';
        } else if (selectedOption === 'نشر') {
          time = Infinity; // no limit
        } else if (selectedOption === 'بلاك') {
          time = Infinity; // no limit
        }
      }

      const endDate = time === Infinity ? null : moment().add(ms(time));

      let prisonRole = message.guild.roles.cache.find(role => role.name === 'prison');
      if (!prisonRole) {
        prisonRole = await message.guild.roles.create({
          name: 'prison',
          permissions: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.ReadMessageHistory
          ],
          reason: 'تم إنشاؤها بواسطة أمر السجن'
        });

        // تطبيق الصلاحيات على القنوات النصية
        message.guild.channels.cache.filter(channel => channel.type === 0).forEach(channel => {
          channel.permissionOverwrites.edit(prisonRole, {
            SendMessages: false,
            ViewChannel: false
          }).catch(() => {});
        });

        // تطبيق الصلاحيات على القنوات الصوتية
        message.guild.channels.cache.filter(channel => channel.type === 2).forEach(channel => {
          channel.permissionOverwrites.edit(prisonRole, {
            ViewChannel: true
          }).catch(() => {});
        });
      }

      await member.roles.add(prisonRole).catch(() => {
        return interaction.reply({
          content: '❌ **لا يمكنني إضافة رتبة السجن لهذا العضو!**',
          ephemeral: true
        });
      });

      // Log the prison punishment
      try {
        await logPunishment(
          message.guild.id,
          member.id,
          message.author.id,
          'prison',
          reason,
          time === Infinity ? null : time
        );
      } catch (logError) {
        console.error('خطأ في تسجيل العقوبة:', logError);
      }

      const logData = {
        time: time === Infinity ? 'no limit' : time,
        times: endDate ? endDate.format('LLLL') : 'no limit',
        reason: reason,
        channel: message.channel.id,
        by: message.author.id,
        to: member.id
      };

      db.set(`MutedMember_${member.id}`, logData);

      message.react("✅");
      interaction.message.delete();

      let logChannel = db.get(`logprisonunprison_${message.guild.id}`);
      logChannel = message.guild.channels.cache.find(channel => channel.id === logChannel);

      if (logChannel) {
        const timeLeft = time === Infinity ? 'no limit' : (typeof time === 'string' ? time : ms(time));
        const endDateText = time === Infinity ? 'no limit' : (endDate ? endDate.format('LLLL') : 'no limit');
        
        const logEmbed = new EmbedBuilder()
          .setAuthor({ 
            name: `${member.user.tag} | تم السجن`, 
            iconURL: member.user.displayAvatarURL({ extension: 'png', size: 1024 }) 
          })
          .setColor('#FF0000')
          .setDescription(`
            **تم سجن عضو**
            
            **👤 العضو:** <@${member.id}> \`(${member.user.tag})\`
            **🔨 بواسطة:** <@${message.author.id}> \`(${message.author.tag})\`
            **⏰ الوقت:** \`${timeLeft}\`
            **📅 ينفك في:** \`${endDateText}\`
            **📝 الرسالة:** [اضغط هنا](${message.url})
            
            \`\`\`
            السبب: ${reason}
            \`\`\`
          `)
          .setThumbnail(member.user.displayAvatarURL({ extension: 'png', size: 1024 }))
          .setFooter({ 
            text: `طلب من قبل: ${message.author.tag} | ${new Date().toLocaleDateString('ar-SA')}`, 
            iconURL: message.author.displayAvatarURL({ extension: 'png' }) 
          })
          .setTimestamp();

        logChannel.send({ embeds: [logEmbed] });
      }

      // إرسال رسالة تأكيد
      interaction.channel.send({
        embeds: [
          new EmbedBuilder()
            .setColor('#00FF00')
            .setDescription(`✅ **تم سجن <@${member.id}> بنجاح!**\n**السبب:** ${reason}\n**المدة:** ${time === Infinity ? 'لا نهائي' : time}`)
            .setFooter({ text: 'نظام السجن | للأدمنز الستريتور فقط' })
        ]
      }).then(msg => setTimeout(() => msg.delete(), 10000));

      if (time !== Infinity && typeof time === 'string') {
        setTimeout(async () => {
          db.delete(`MutedMember_${member.id}`);
          const prisonRole = message.guild.roles.cache.find(role => role.name === 'prison');
          if (prisonRole) {
            await member.roles.remove(prisonRole).catch(() => {});
            
            // إرسال إشعار بإزالة السجن
            message.channel.send({
              embeds: [
                new EmbedBuilder()
                  .setColor('#00FF00')
                  .setDescription(`🔓 **تم إزالة السجن عن <@${member.id}> تلقائياً بعد انتهاء المدة**`)
              ]
            }).then(msg => setTimeout(() => msg.delete(), 10000));
            
            // Log the unprison action
            try {
              await logPunishment(
                message.guild.id,
                member.id,
                message.client.user.id,
                'unprison',
                'تم إزالة السجن تلقائياً بعد انتهاء المدة',
                null
              );
            } catch (logError) {}
          }
        }, ms(time));
      }
    });

    collector.on('end', (collected, reason) => {
      if (!collected.size && reason === 'time') {
        message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor('#FF9900')
              .setDescription('⏰ **انتهى الوقت! لم يتم اختيار سبب.**')
          ]
        }).then(reply => {
          setTimeout(() => {
            reply.delete();
          }, 8000);
        });
      }
    });
    
    // معالج الزر لإلغاء
    const buttonFilter = (i) => i.isButton() && i.customId === 'Cancel' && i.user.id === message.author.id;
    const buttonCollector = message.channel.createMessageComponentCollector({ filter: buttonFilter, time: 150000 });
    
    buttonCollector.on('collect', async (i) => {
      await i.message.delete().catch(() => {});
      buttonCollector.stop();
      
      message.reply({
        embeds: [
          new EmbedBuilder()
            .setColor('#FF9900')
            .setDescription('❌ **تم إلغاء عملية السجن.**')
        ]
      }).then(reply => setTimeout(() => reply.delete(), 5000));
    });
  }
};