const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, PermissionFlagsBits, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { prefix, owners } = require(`${process.cwd()}/config`);
const db = require('pro.db');

module.exports = {
  name: 'editreasons',
  aliases: ['تعديل-اسباب', 'editreasons'],
  description: 'تعديل الأسباب والمدة',
  run: async (client, message, args) => {
    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
      return; 
    }
    
    const Color = db.get(`Guild_Color = ${message.guild.id}`) || '#192029';
    if (!Color) return;
    
    const allowDb = db.get(`Allow - Command editreasons = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(allowDb);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

    if (!isAuthorAllowed && message.author.id !== allowDb && !owners.includes(message.author.id) && !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.react('❌');
    }

    const menuOptions = [
      { label: 'ميوت صوتي | 1', description: 'تعديل أسباب الميوت الصوتي', value: 'vmute' },
      { label: 'أسكات كتابي | 2', description: 'تعديل أسباب الأسكات الكتابي', value: 'mute' },
      { label: 'سجن | 3', description: 'تعديل أسباب السجن', value: 'prison' },
    ];

    const menu = new StringSelectMenuBuilder()
      .setCustomId('edit_reasons_menu')
      .setPlaceholder('اختر نوع العقوبة')
      .addOptions(menuOptions);

    const cancelButton = new ButtonBuilder()
      .setCustomId('cancel_edit')
      .setLabel('الغاء')
      .setStyle(ButtonStyle.Secondary);

    const menuRow = new ActionRowBuilder().addComponents(menu);
    const buttonRow = new ActionRowBuilder().addComponents(cancelButton);

    const msg = await message.reply({ 
      content: `**اختر نوع العقوبة لتعديل أسبابها:**`, 
      components: [menuRow, buttonRow] 
    });

    const filter = (interaction) => 
      (interaction.isStringSelectMenu() || interaction.isButton()) && 
      interaction.user.id === message.author.id;
    
    const collector = msg.createMessageComponentCollector({ filter, time: 120000 });

    collector.on('collect', async (interaction) => {
      if (interaction.isButton() && interaction.customId === 'cancel_edit') {
        await interaction.deferUpdate().catch(() => {});
        await interaction.message.delete().catch(() => {});
        collector.stop();
        return;
      }

      if (interaction.isStringSelectMenu()) {
        const type = interaction.values[0];
        let reasons;
        let typeName;

        if (type === 'vmute') {
          typeName = 'الميوت الصوتي';
          reasons = db.get(`vmute_reasons_${message.guild.id}`) || {};
          if (Object.keys(reasons).length === 0) {
            reasons = {
              'مشاكل': { reason: 'مشاكل', description: 'سلوك مخالف للقوانين', time: '5m' },
              'إيحاءات جنسيه': { reason: 'إيحاءات جنسيه', description: 'إيحاءات غير لائقة', time: '10m' },
              'قذف': { reason: 'قذف', description: 'سب أو اتهام جارح', time: '30m' }
            };
          }
        } else if (type === 'mute') {
          typeName = 'الأسكات الكتابي';
          reasons = db.get(`mute_reasons_${message.guild.id}`) || {};
          if (Object.keys(reasons).length === 0) {
            reasons = {
              'مشاكل': { reason: 'مشاكل', description: 'سلوك مخالف للقوانين', time: '5m' },
              'إيحاءات': { reason: 'إيحاءات', description: 'إيحاءات أو مضايقات', time: '15m' },
              'قذف': { reason: 'قذف', description: 'سب أو اتهام جارح', time: '30m' }
            };
          }
        } else if (type === 'prison') {
          typeName = 'السجن';
          reasons = db.get(`prison_reasons_${message.guild.id}`) || {};
          if (Object.keys(reasons).length === 0) {
            reasons = {
              'مشاكل متكرره': { reason: 'مشاكل متكرره', description: 'تكرار المخالفات', time: '6h' },
              'قذف متكرر': { reason: 'قذف متكرر', description: 'تكرار السب او الاتهام', time: '2d' },
              'نشر': { reason: 'نشر', description: 'نشر محتوى محظور', time: 'no limit' },
              'بلاك': { reason: 'بلاك', description: 'حظر دائم', time: 'no limit' }
            };
          }
        }

        const reasonOptions = Object.keys(reasons).map((reason, index) => ({
          label: `${reason} | ${index + 1}`,
          description: `${reasons[reason].description ? reasons[reason].description : 'بدون وصف'} - الوقت: ${reasons[reason].time}`,
          value: reason
        }));

        const reasonMenu = new StringSelectMenuBuilder()
          .setCustomId(`reason_select_${type}`)
          .setPlaceholder('اختر السبب لتعديله')
          .addOptions(reasonOptions);

        const reasonMenuRow = new ActionRowBuilder().addComponents(reasonMenu);
        const backButton = new ButtonBuilder()
          .setCustomId('back_menu')
          .setLabel('رجوع')
          .setStyle(ButtonStyle.Secondary);

        const backRow = new ActionRowBuilder().addComponents(backButton, cancelButton);

        await interaction.update({ 
          content: `**اختر السبب من ${typeName} لتعديله:**`, 
          components: [reasonMenuRow, backRow] 
        });

        const reasonFilter = (i) => 
          (i.isStringSelectMenu() || i.isButton()) && 
          i.user.id === message.author.id;

        const reasonCollector = interaction.message.createMessageComponentCollector({ 
          filter: reasonFilter, 
          time: 120000 
        });

        reasonCollector.on('collect', async (reasonInteraction) => {
          if (reasonInteraction.isButton() && reasonInteraction.customId === 'back_menu') {
            await reasonInteraction.deferUpdate().catch(() => {});
            await msg.edit({ 
              content: `**اختر نوع العقوبة لتعديل أسبابها:**`, 
              components: [menuRow, buttonRow] 
            }).catch(() => {});
            reasonCollector.stop();
            return;
          }

          if (reasonInteraction.isButton() && reasonInteraction.customId === 'cancel_edit') {
            await reasonInteraction.deferUpdate().catch(() => {});
            await reasonInteraction.message.delete().catch(() => {});
            reasonCollector.stop();
            return;
          }

          if (reasonInteraction.isStringSelectMenu()) {
            const selectedReason = reasonInteraction.values[0];
            const currentData = reasons[selectedReason];

            // إنشاء Modal لتعديل السبب والوصف والوقت
            const modal = new ModalBuilder()
              .setCustomId(`modal_${type}_${selectedReason}`)
              .setTitle(`تعديل ${selectedReason}`);

            const reasonInput = new TextInputBuilder()
              .setCustomId('reason_text')
              .setLabel('السبب (الاسم)')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('اكتب السبب')
              .setValue(currentData.reason)
              .setRequired(true);

            const descInput = new TextInputBuilder()
              .setCustomId('desc_text')
              .setLabel('وصف السبب')
              .setStyle(TextInputStyle.Paragraph)
              .setPlaceholder('اكتب وصف للسبب')
              .setValue(currentData.description || '')
              .setRequired(false);

            const timeInput = new TextInputBuilder()
              .setCustomId('time_text')
              .setLabel('المدة (مثال: 5m, 10m, 1h, 2d أو no limit)')
              .setStyle(TextInputStyle.Short)
              .setPlaceholder('اكتب المدة')
              .setValue(currentData.time)
              .setRequired(true);

            const reasonRow = new ActionRowBuilder().addComponents(reasonInput);
            const descRow = new ActionRowBuilder().addComponents(descInput);
            const timeRow = new ActionRowBuilder().addComponents(timeInput);

            modal.addComponents(reasonRow, descRow, timeRow);

            await reasonInteraction.showModal(modal);

            reasonInteraction.awaitModalSubmit({ 
              filter: (i) => i.user.id === message.author.id, 
              time: 300000 
            }).then(async (modalInteraction) => {
              const newReason = modalInteraction.fields.getTextInputValue('reason_text');
              const newDesc = modalInteraction.fields.getTextInputValue('desc_text');
              const newTime = modalInteraction.fields.getTextInputValue('time_text');

              // حفظ نسخة من البيانات القديمة للوغ
              const oldData = { reason: currentData.reason, description: currentData.description, time: currentData.time, key: selectedReason };

              // update key if the name changed
              if (newReason !== selectedReason) {
                delete reasons[selectedReason];
              }

              reasons[newReason] = {
                reason: newReason,
                description: newDesc,
                time: newTime
              };

              if (type === 'vmute') {
                db.set(`vmute_reasons_${message.guild.id}`, reasons);
              } else if (type === 'mute') {
                db.set(`mute_reasons_${message.guild.id}`, reasons);
              } else if (type === 'prison') {
                db.set(`prison_reasons_${message.guild.id}`, reasons);
              }

              // تحقق من وجود قناة لوق مخصصة للأسباب أو القنوات العامة ثم أرسل Embed تفصيلي
              const logChannelId = db.get(`logreasons_${message.guild.id}`) || db.get(`channelmessage_${message.guild.id}`) || db.get(`logwarns_${message.guild.id}`) || db.get(`logtmuteuntmute_${message.guild.id}`) || db.get(`logprisonunprison_${message.guild.id}`);
              const logChannel = message.guild.channels.cache.get(logChannelId);

              if (logChannel && logChannel.isTextBased && logChannel.isTextBased()) {
                const logEmbed = new EmbedBuilder()
                  .setColor(Color || '#192029')
                  .setTitle('📝 تم تعديل سبب')
                  .setDescription(`**تم تعديل سبب في ${typeName}**`)
                  .addFields(
                    { name: 'المسؤول', value: `${message.author.tag} (${message.author.id})`, inline: true },
                    { name: 'النوع', value: `${typeName}`, inline: true },
                    { name: 'السبب السابق', value: `${oldData.reason || 'لا يوجد'}`, inline: false },
                    { name: 'السبب الجديد', value: `${newReason || 'لا يوجد'}`, inline: false },
                    { name: 'الوصف السابق', value: `${oldData.description || 'لا يوجد'}`, inline: true },
                    { name: 'الوصف الجديد', value: `${newDesc || 'لا يوجد'}`, inline: true },
                    { name: 'المدة السابقة', value: `${oldData.time || 'لا يوجد'}`, inline: true },
                    { name: 'المدة الجديدة', value: `${newTime || 'لا يوجد'}`, inline: true }
                  )
                  .setTimestamp();

                logChannel.send({ embeds: [logEmbed] }).catch(() => {});
              }

              await modalInteraction.reply({ 
                content: `**✅ تم تعديل السبب بنجاح!\nالسبب: ${newReason}\nالوصف: ${newDesc || 'لا يوجد'}\nالمدة: ${newTime}**`, 
                ephemeral: true 
              });

              reasonCollector.stop();
            }).catch(() => {
              reasonCollector.stop();
            });
          }
        });
      }
    });

    collector.on('end', () => {
      if (!msg.deleted) {
        msg.edit({ content: '**⏰ انتهى الوقت!**', components: [] }).catch(() => {});
      }
    });
  }
};

