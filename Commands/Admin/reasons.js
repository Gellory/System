const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, PermissionFlagsBits, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { prefix, owners } = require(`${process.cwd()}/config`);
const db = require('pro.db');

// Function to get reasons for a specific type
function getReasons(guildId, type) {
    const db = require('pro.db');
    const reasons = db.get(`${type}_reasons_${guildId}`);
    
    // Return default reasons if none exist
    if (!reasons || Object.keys(reasons).length === 0) {
        if (type === 'vmute') {
            return {
                'مشاكل': { reason: 'مشاكل', description: 'سلوك مخالف للقوانين', time: '5m' },
                'إيحاءات جنسيه': { reason: 'إيحاءات جنسيه', description: 'إيحاءات غير لائقة', time: '10m' },
                'قذف': { reason: 'قذف', description: 'سب أو اتهام جارح', time: '30m' }
            };
        } else if (type === 'mute') {
            return {
                'مشاكل': { reason: 'مشاكل', description: 'سلوك مخالف للقوانين', time: '5m' },
                'إيحاءات': { reason: 'إيحاءات', description: 'إيحاءات أو مضايقات', time: '15m' },
                'قذف': { reason: 'قذف', description: 'سب أو اتهام جارح', time: '30m' }
            };
        } else if (type === 'prison') {
            return {
                'مشاكل متكرره': { reason: 'مشاكل متكرره', description: 'تكرار المخالفات', time: '6h' },
                'قذف متكرر': { reason: 'قذف متكرر', description: 'تكرار السب او الاتهام', time: '2d' },
                'نشر': { reason: 'نشر', description: 'نشر محتوى محظور', time: 'no limit' },
                'بلاك': { reason: 'بلاك', description: 'حظر دائم', time: 'no limit' }
            };
        }
    }
    
    return reasons;
}

module.exports = {
    getReasons,
  name: 'reasons',
  aliases: ["reason", 'reasoncontrol'],
  description: "للتحكم في الاسباب بالكامل",
  run: async (client, message, args) => {

    if (!owners.includes(message.author.id)) {
      return message.reply({ content: `**:x: | You don't have permission to use this command.**` });
    }

    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    const Color = db.get(`Guild_Color = ${message.guild.id}`) || '#192029';

    const allowDb = db.get(`Allow - Command ${module.exports.name} = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(allowDb);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

    if (!isAuthorAllowed && message.author.id !== allowDb && !owners.includes(message.author.id) && !message.member.permissions.has(PermissionFlagsBits.Administrator)) {
      return message.react('❌');
    }

    const menuOptions = [
      { label: 'الميوت الصوتي', description: 'إدارة أسباب الميوت الصوتي', value: 'vmute' },
      { label: 'الاسكات الكتابي', description: 'إدارة أسباب الاسكات الكتابي', value: 'mute' },
      { label: 'السجن', description: 'إدارة أسباب السجن', value: 'prison' },
    ];

    const menu = new StringSelectMenuBuilder()
      .setCustomId('reasons_main_menu')
      .setPlaceholder('اختر الكاتيجوري')
      .addOptions(menuOptions);

    const cancelButton = new ButtonBuilder()
      .setCustomId('cancel_reasons')
      .setLabel('الغاء')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(menu);
    const buttonRow = new ActionRowBuilder().addComponents(cancelButton);

    const msg = await message.reply({ content: '**اختر الكاتيجوري الذي تريد إدارة أسبابه:**', components: [row, buttonRow] });

    const filter = (i) => (i.isStringSelectMenu() || i.isButton()) && i.user.id === message.author.id;
    const collector = msg.createMessageComponentCollector({ filter, time: 180000 });

    collector.on('collect', async (interaction) => {
      if (interaction.isButton() && interaction.customId === 'cancel_reasons') {
        await interaction.deferUpdate().catch(() => {});
        await interaction.message.delete().catch(() => {});
        collector.stop();
        return;
      }

      if (!interaction.isStringSelectMenu()) return;

      const type = interaction.values[0];
      let typeName = type === 'vmute' ? 'الميوت الصوتي' : type === 'mute' ? 'الاسكات الكتابي' : 'السجن';

      // load reasons or defaults
      let reasons = db.get(`${type}_reasons_${message.guild.id}`) || {};
      if (Object.keys(reasons).length === 0) {
        if (type === 'vmute') {
          reasons = {
            'مشاكل': { reason: 'مشاكل', description: 'سلوك مخالف للقوانين', time: '5m' },
            'إيحاءات جنسيه': { reason: 'إيحاءات جنسيه', description: 'إيحاءات غير لائقة', time: '10m' },
            'قذف': { reason: 'قذف', description: 'سب أو اتهام جارح', time: '30m' }
          };
        } else if (type === 'mute') {
          reasons = {
            'مشاكل': { reason: 'مشاكل', description: 'سلوك مخالف للقوانين', time: '5m' },
            'إيحاءات': { reason: 'إيحاءات', description: 'إيحاءات أو مضايقات', time: '15m' },
            'قذف': { reason: 'قذف', description: 'سب أو اتهام جارح', time: '30m' }
          };
        } else if (type === 'prison') {
          reasons = {
            'مشاكل متكرره': { reason: 'مشاكل متكرره', description: 'تكرار المخالفات', time: '6h' },
            'قذف متكرر': { reason: 'قذف متكرر', description: 'تكرار السب او الاتهام', time: '2d' },
            'نشر': { reason: 'نشر', description: 'نشر محتوى محظور', time: 'no limit' },
            'بلاك': { reason: 'بلاك', description: 'حظر دائم', time: 'no limit' }
          };
        }
      }

      const reasonOptions = Object.keys(reasons).map((r, idx) => ({
        label: `${r}`.slice(0, 100),
        description: `${reasons[r].description ? reasons[r].description : 'بدون وصف'} - ${reasons[r].time || 'no time'}`.slice(0, 100),
        value: r
      }));

      // components: select menu of reasons and action buttons
      const reasonMenu = new StringSelectMenuBuilder()
        .setCustomId(`reason_select_${type}`)
        .setPlaceholder(`اختر السبب من ${typeName}`)
        .addOptions(reasonOptions.length ? reasonOptions : [{ label: 'لا يوجد أسباب, أضف سبب', description: 'اضغط إضافة', value: 'no_reasons' }]);

      const addBtn = new ButtonBuilder().setCustomId(`add_${type}`).setLabel('اضافة سبب').setStyle(ButtonStyle.Success);
      const editBtn = new ButtonBuilder().setCustomId(`edit_${type}`).setLabel('تعديل السبب').setStyle(ButtonStyle.Primary);
      const delBtn = new ButtonBuilder().setCustomId(`delete_${type}`).setLabel('حذف السبب').setStyle(ButtonStyle.Danger);
      const viewBtn = new ButtonBuilder().setCustomId(`view_${type}`).setLabel('عرض الاسباب').setStyle(ButtonStyle.Secondary);
      const resetBtn = new ButtonBuilder().setCustomId(`reset_${type}`).setLabel('اعادة تعيين').setStyle(ButtonStyle.Secondary);
      const backBtn = new ButtonBuilder().setCustomId('back_menu').setLabel('رجوع').setStyle(ButtonStyle.Secondary);
      const cancelBtn = cancelButton;

      const reasonRow = new ActionRowBuilder().addComponents(reasonMenu);
      const actionsRow = new ActionRowBuilder().addComponents(addBtn, editBtn, delBtn);
      const miscRow = new ActionRowBuilder().addComponents(viewBtn, resetBtn, backBtn, cancelBtn);

      await interaction.update({ content: `**إدارة أسباب ${typeName}**`, components: [reasonRow, actionsRow, miscRow] }).catch(() => {});

      const state = { selected: null };

      const compFilter = (i) => (i.isStringSelectMenu() || i.isButton()) && i.user.id === message.author.id;
      const compCollector = interaction.message.createMessageComponentCollector({ filter: compFilter, time: 180000 });

      compCollector.on('collect', async (i) => {
        // handle back
        if (i.isButton() && i.customId === 'back_menu') {
          await i.deferUpdate().catch(() => {});
          await msg.edit({ content: '**اختر الكاتيجوري الذي تريد إدارة أسبابه:**', components: [row, buttonRow] }).catch(() => {});
          compCollector.stop();
          return;
        }

        if (i.isButton() && i.customId === `add_${type}`) {
          // Add modal
          const modal = new ModalBuilder().setCustomId(`add_modal_${type}`).setTitle(`اضافة سبب - ${typeName}`);
          const nameInput = new TextInputBuilder().setCustomId('name').setLabel('اسم السبب').setStyle(TextInputStyle.Short).setPlaceholder('اكتب اسم السبب').setRequired(true);
          const descInput = new TextInputBuilder().setCustomId('desc').setLabel('وصف السبب').setStyle(TextInputStyle.Paragraph).setPlaceholder('وصف اختياري').setRequired(false);
          const timeInput = new TextInputBuilder().setCustomId('time').setLabel('المدة (مثال: 5m, 1h, 2d أو no limit)').setStyle(TextInputStyle.Short).setPlaceholder('مثال: 5m').setRequired(true);
          modal.addComponents(new ActionRowBuilder().addComponents(nameInput), new ActionRowBuilder().addComponents(descInput), new ActionRowBuilder().addComponents(timeInput));
          await i.showModal(modal).catch(() => {});

          i.awaitModalSubmit({ filter: (m) => m.user.id === message.author.id, time: 300000 }).then(async (modalI) => {
            const name = modalI.fields.getTextInputValue('name').trim();
            const desc = modalI.fields.getTextInputValue('desc').trim();
            const time = modalI.fields.getTextInputValue('time').trim();

            reasons[name] = { reason: name, description: desc, time };
            db.set(`${type}_reasons_${message.guild.id}`, reasons);

            await modalI.reply({ content: `✅ تم اضافة السبب: **${name}**`, ephemeral: true }).catch(() => {});
            compCollector.stop();
          }).catch(() => {
            // modal timeout
          });
          return;
        }

        if (i.isStringSelectMenu() && i.customId === `reason_select_${type}`) {
          state.selected = i.values[0];
          await i.deferUpdate().catch(() => {});
          return;
        }

        if (i.isButton() && i.customId === `edit_${type}`) {
          if (!state.selected || state.selected === 'no_reasons') {
            await i.reply({ content: 'يرجى اختيار سبب أولاً من القائمة.', ephemeral: true }).catch(() => {});
            return;
          }

          const current = reasons[state.selected];
          const modal = new ModalBuilder().setCustomId(`edit_modal_${type}_${state.selected}`).setTitle(`تعديل سبب - ${state.selected}`);
          const nameInput = new TextInputBuilder().setCustomId('name').setLabel('اسم السبب').setStyle(TextInputStyle.Short).setValue(current.reason).setRequired(true);
          const descInput = new TextInputBuilder().setCustomId('desc').setLabel('وصف السبب').setStyle(TextInputStyle.Paragraph).setValue(current.description || '').setRequired(false);
          const timeInput = new TextInputBuilder().setCustomId('time').setLabel('المدة').setStyle(TextInputStyle.Short).setValue(current.time || '').setRequired(true);
          modal.addComponents(new ActionRowBuilder().addComponents(nameInput), new ActionRowBuilder().addComponents(descInput), new ActionRowBuilder().addComponents(timeInput));
          await i.showModal(modal).catch(() => {});

          i.awaitModalSubmit({ filter: (m) => m.user.id === message.author.id, time: 300000 }).then(async (modalI) => {
            const newName = modalI.fields.getTextInputValue('name').trim();
            const newDesc = modalI.fields.getTextInputValue('desc').trim();
            const newTime = modalI.fields.getTextInputValue('time').trim();

            // handle rename
            if (newName !== state.selected) {
              delete reasons[state.selected];
            }
            reasons[newName] = { reason: newName, description: newDesc, time: newTime };
            db.set(`${type}_reasons_${message.guild.id}`, reasons);

            await modalI.reply({ content: `✅ تم تعديل السبب: **${newName}**`, ephemeral: true }).catch(() => {});
            compCollector.stop();
          }).catch(() => {});
          return;
        }

        if (i.isButton() && i.customId === `delete_${type}`) {
          if (!state.selected || state.selected === 'no_reasons') {
            await i.reply({ content: 'يرجى اختيار سبب أولاً من القائمة.', ephemeral: true }).catch(() => {});
            return;
          }

          delete reasons[state.selected];
          db.set(`${type}_reasons_${message.guild.id}`, reasons);
          await i.reply({ content: `✅ تم حذف السبب: **${state.selected}**`, ephemeral: true }).catch(() => {});
          compCollector.stop();
          return;
        }

        if (i.isButton() && i.customId === `view_${type}`) {
          const embed = new EmbedBuilder().setTitle(`أسباب ${typeName}`).setColor(Color || '#192029');
          if (Object.keys(reasons).length === 0) {
            embed.setDescription('لا يوجد أسباب.');
          } else {
            const fields = Object.keys(reasons).map((k) => ({ name: k, value: `الوصف: ${reasons[k].description || 'بدون وصف'}\\nالمدة: ${reasons[k].time || 'no time'}`, inline: false }));
            embed.addFields(fields);
          }
          await i.reply({ embeds: [embed], ephemeral: true }).catch(() => {});
          return;
        }

        if (i.isButton() && i.customId === `reset_${type}`) {
          // reset to defaults used above
          let defaults = {};
          if (type === 'vmute') defaults = {
            'مشاكل': { reason: 'مشاكل', description: 'سلوك مخالف للقوانين', time: '5m' },
            'إيحاءات جنسيه': { reason: 'إيحاءات جنسيه', description: 'إيحاءات غير لائقة', time: '10m' },
            'قذف': { reason: 'قذف', description: 'سب أو اتهام جارح', time: '30m' }
          };
          if (type === 'mute') defaults = {
            'مشاكل': { reason: 'مشاكل', description: 'سلوك مخالف للقوانين', time: '5m' },
            'إيحاءات': { reason: 'إيحاءات', description: 'إيحاءات أو مضايقات', time: '15m' },
            'قذف': { reason: 'قذف', description: 'سب أو اتهام جارح', time: '30m' }
          };
          if (type === 'prison') defaults = {
            'مشاكل متكرره': { reason: 'مشاكل متكرره', description: 'تكرار المخالفات', time: '6h' },
            'قذف متكرر': { reason: 'قذف متكرر', description: 'تكرار السب او الاتهام', time: '2d' },
            'نشر': { reason: 'نشر', description: 'نشر محتوى محظور', time: 'no limit' },
            'بلاك': { reason: 'بلاك', description: 'حظر دائم', time: 'no limit' }
          };
          db.set(`${type}_reasons_${message.guild.id}`, defaults);
          await i.reply({ content: `✅ تم اعادة تعيين أسباب ${typeName} إلى الافتراضي.`, ephemeral: true }).catch(() => {});
          compCollector.stop();
          return;
        }

        if (i.isButton() && i.customId === 'cancel_reasons') {
          await i.deferUpdate().catch(() => {});
          await i.message.delete().catch(() => {});
          compCollector.stop();
          collector.stop();
          return;
        }
      });

      compCollector.on('end', () => {
        // try to clear components
        try { interaction.message.edit({ components: [] }).catch(() => {}); } catch (e) {}
      });
    });

    collector.on('end', () => {
      if (!msg.deleted) msg.edit({ content: '**⏰ انتهى الوقت!**', components: [] }).catch(() => {});
    });
  }
};
