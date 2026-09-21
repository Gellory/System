const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder, ButtonBuilder, PermissionFlagsBits, ButtonStyle } = require('discord.js');
const { prefix, owners } = require(`${process.cwd()}/config`);
const ms = require('ms');
const moment = require('moment');
const Data = require('pro.db');
const db = require('pro.db');
const { logPunishment } = require('../../utils/punishmentLogger');

module.exports = {
  name: 'mute',
  aliases: ["اسكت","اسكات"],
  run: async (client, message) => {
    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
      return; 
    }
    
    const Color = db.get(`Guild_Color = ${message.guild.id}`) || '#192029';
    if (!Color) return;

    const Pro = require(`pro.db`);
    const allowDb = Pro.get(`Allow - Command mute = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(allowDb);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

    if (!isAuthorAllowed && message.author.id !== allowDb && !message.member.permissions.has(PermissionFlagsBits.MuteMembers)) {
      return;
    }

    let args = message.content.split(' ').slice(1);
    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);

    if (!member) {
      const embed = new EmbedBuilder()
      .setColor(`${Color || `#192029`}`)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}اسكت <@${message.author.id}>**`);
      return message.reply({ embeds: [embed] });
    }

    if (member.id === message.member.id) return message.react('❌');
    if (message.member.roles.highest.position < member.roles.highest.position) return message.react('❌');

    // الحصول على الأسباب من وحدة الأسباب
    const reasonsModule = require('./reasons');
    const reasons = require('./reasons').getReasons(message.guild.id, 'mute') || {};
    const menuOptions = [];
    const seen = new Set();
    for (const [key, value] of Object.entries(reasons)) {
      if (seen.has(key)) continue;
      seen.add(key);
      menuOptions.push({
        label: `${key}`.slice(0, 100),
        description: `${value.description || ''} - ${value.time || ''}`.slice(0, 100),
        value: key
      });
      if (menuOptions.length >= 25) break;
    }
    if (menuOptions.length === 0) {
      menuOptions.push({ label: 'لا يوجد أسباب', description: 'لا يوجد', value: 'no_reasons' });
    }

    const menu = new StringSelectMenuBuilder()
      .setCustomId('mute_menu')
      .setPlaceholder('اختر عقوبة العضو ووقت الإسكات')
      .addOptions(menuOptions);

    const deleteButton = new ButtonBuilder()
      .setCustomId('Cancel2')
      .setLabel('الغاء')
      .setStyle(ButtonStyle.Secondary);

    const menuRow = new ActionRowBuilder().addComponents(menu);
    const buttonRow = new ActionRowBuilder().addComponents(deleteButton);

    message.reply({ content: `**يرجي تحديد سبب العقوبه.**\n** * <@${member.id}>**`, components: [menuRow, buttonRow] });

    const filter = (interaction) => interaction.isStringSelectMenu() && interaction.user.id === message.author.id;
    const collector = message.channel.createMessageComponentCollector({ filter, time: 150000 }); 

    let interactionDetected = false; 

    collector.on('collect', (interaction) => {
      interactionDetected = true; 
    
      const selectedOption = interaction.values[0];
      let time; 
      let reason = selectedOption;
      
      // الحصول على الوقت والسبب من وحدة الأسباب أو القيم الافتراضية
      const reasonData = getReasons(message.guild.id, 'mute') || {};
      if (reasonData[selectedOption]) {
        time = reasonData[selectedOption].time;
        reason = reasonData[selectedOption].reason || selectedOption;
      } else {
        if (selectedOption === 'مشاكل') {
          time = '5m';
        } else if (selectedOption === 'إيحاءات') {
          time = '15m';
        } else if (selectedOption === 'قذف') {
          time = '30m';
        } else {
          time = '5m'; // قيمة افتراضية إذا لم يتم العثور على الخيار
        }
      }
      
      if (time) {
        applyMute(member, time, reason).catch(err => console.error(err));
      }
    
      message.react("✅");
      interaction.message.delete();
    });
    
    collector.on('end', (collected, reason) => {
      if (!interactionDetected) {
        message.reply("**يرجى اختيار سبب !**").then(reply => {
          setTimeout(() => {
            reply.delete();
          }, 80000); // 10 ثواني :)
        });
      }
    });
    
    // معالج الزر لإلغاء
    const buttonFilter = (i) => i.isButton() && i.customId === 'Cancel2' && i.user.id === message.author.id;
    const buttonCollector = message.channel.createMessageComponentCollector({ filter: buttonFilter, time: 150000 });
    
    buttonCollector.on('collect', async (i) => {
      await i.message.delete().catch(() => {});
      buttonCollector.stop();
    });

    async function applyMute(member, time, selectedOption) {
      let muteRole = message.guild.roles.cache.find((role) => role.name == 'Muted');
      if (!muteRole) {
        muteRole = await message.guild.roles.create({
          name: 'Muted',
        });
        message.guild.channels.cache.filter((c) => c.type === 0).forEach(c => {
          c.permissionOverwrites.edit(muteRole, { SendMessages: false, AddReactions: false });
        });
        message.guild.channels.cache.filter((c) => c.type === 2).forEach(c => {
          c.permissionOverwrites.edit(muteRole, { AddReactions: false });
        });
      }
      
      await message.guild.members.cache.get(member.id)?.roles.add(muteRole);
      
      if (!time) {
        time = '5m'; // قيمة افتراضية
      }
      
      const endDate = moment().add(ms(time));
      const logData = {
        time: time,
        times: endDate.format('LLLL'),
        reason: selectedOption,
        channel: message.channel.id,
        by: message.author.id,
        to: member.id
      };
      db.set(`Muted_Member_${member.id}`, logData);
      
      // Log the punishment immediately after applying mute
      logPunishment(
        message.guild.id,
        member.id,
        message.author.id,
        'mute',
        selectedOption,
        time
      );
      
      // Send log embed
      const logEmbed = new EmbedBuilder()
        .setColor('#312e5d')
        .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL({ extension: 'png' }) })
        .setDescription(`**إسكات كتابي\n\nالعضو : <@${member.id}>\nبواسطة : <@${message.author.id}>\nالرسالة : [here](${message.url})\nالوقت : \`${time}\`**\n\`\`\`Reason : ${selectedOption}\`\`\`\ `)
        .setThumbnail(`https://cdn.discordapp.com/attachments/1091536665912299530/1153875266066710598/image_1.png`)
        .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL({ extension: 'png' }) });
    
      let logChannel = db.get(`logtmuteuntmute_${message.guild.id}`);
      logChannel = message.guild.channels.cache.find(channel => channel.id === logChannel);
    
      if (logChannel) {
        logChannel.send({ embeds: [logEmbed] });
      }
      
      // Auto unmute after time
      const timeoutDuration = ms(time);
      if (timeoutDuration && timeoutDuration > 0) {
        setTimeout(() => {
          message.guild.members.cache.get(member.id)?.roles.remove(muteRole);
          db.delete(`Muted_Member_${member.id}`);
        }, timeoutDuration);
      }
    }
  }
};
