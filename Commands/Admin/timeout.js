const Discord = require("discord.js");
const { ActionRowBuilder, StringSelectMenuBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { prefix, owners } = require(`${process.cwd()}/config`);
const Pro = require(`pro.db`);
const ms = require('ms');
const moment = require('moment');
const { logPunishment } = require('../../utils/punishmentLogger');

module.exports = {
  name: "timeout",
  aliases: ["تايم"],
  description: "timeout a member",
  usage: ["!timeout @user"],
  run: async (client, message, args, config) => {

    const Color = Pro.get(`Guild_Color = ${message.guild.id}`) || '#192029';
    if (!Color) return;

    const db = Pro.get(`Allow - Command timeout = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(db);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

    if (!isAuthorAllowed && message.author.id !== db && !message.member.permissions.has(PermissionFlagsBits.MuteMembers)) {
      return;
    }

    let member = message.mentions.members.first() || message.guild.members.cache.get(args[0]);
    if (!args[0]) {
      const embed = new EmbedBuilder()
      .setColor(`${Color || `#192029`}`)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}تايم <@${message.author.id}> 1h [reason]**`);
      return message.reply({ embeds: [embed] });
    }

    if (!member) {
      return message.reply({ content: `**لا يمكنني اعطاء ميوت لهاذا العضو .**` }).catch((err) => {
     //   console.log(`**لم أتمكن من الرد على الرسالة:**` + err.message);
      });
    }

    if (member.id === message.author.id) {
      return message.reply({ content: `**لا يمكنك اعطاء ميوت لنفسك .**` }).catch((err) => {
     //   console.log(`**لم أتمكن من الرد على الرسالة:**` + err.message);
      });
    }

    if (message.member.roles.highest.position < member.roles.highest.position) {
      return message.reply({ content: `:rolling_eyes: **You can't timeout ${member.user.username} have higher role than you**` }).catch((err) => {
      //  console.log(`**لم أتمكن من الرد على الرسالة:**` + err.message);
      });
    }

    if (!args[1]) {
      return message.reply({ content: `**يرجي تحديد وقت الميوت .**` });
    }

    if (!args[1].endsWith('s') && !args[1].endsWith('m') && !args[1].endsWith('h') && !args[1].endsWith('d') && !args[1].endsWith('w')) {
      return message.reply({ content: `** يجب أن ينتهي الوقت بـ .** \`s / m / h / d / w\` ` });
    }
    message.react("✅")

    const reason = args.slice(2).join(' ') || 'No reason';
    const timeoutDuration = ms(args[1]);
    const timeoutMessage = `**${message.member.nickname}** has timed you out for ${args[1]}.`;
    
    let chatName = Pro.get(`logtmuteuntmute_${message.guild.id}`);

    member.timeout(timeoutDuration, timeoutMessage)
      .then(async () => {
        // Log the timeout punishment
        await logPunishment(
          message.guild.id,
          member.id,
          message.author.id,
          'timeout',
          reason,
          args[1] // duration in human-readable format (e.g., '1h')
        );

        const embed = new EmbedBuilder()
          .setAuthor({ name: member.user.tag, iconURL: member.user.displayAvatarURL({ extension: 'png' }) })
          .setDescription(`**تايم اوت\n\nالعضو : <@${member.user.id}>\nبواسطة : <@${message.member.id}>\nفيـ : [Message](${message.url})\nالوقت : ${args[1]}\nاعطى فيـ : ${moment().format('HH:mm')}**\n\`\`\`Reason : ${reason}\`\`\`\ `)   
          .setColor(`#312e5d`)
          .setFooter({ text: `${message.author.tag}`, iconURL: message.author.displayAvatarURL({ extension: 'png' }) })
          .setThumbnail(`https://cdn.discordapp.com/attachments/1091536665912299530/1153875266066710598/image_1.png`);
          
        // Schedule timeout end notification
        setTimeout(async () => {
          const timeoutEndMessage = `**${member.user.username}**'s timeout has ended.`;
          const chat = client.channels.cache.find(channel => channel.id === chatName);
          if (chat) {
            chat.send(timeoutEndMessage);
            
            // Log the timeout removal (automatic un-timeout)
            await logPunishment(
              message.guild.id,
              member.id,
              client.user.id, // Bot as the executor for automatic un-timeout
              'untimeout',
              'Automatic timeout removal after time served',
              null
            );
          }
        }, timeoutDuration);
        
        // Send the timeout notification to the log channel
        const chat = client.channels.cache.find(channel => channel.id === chatName);
        if (chat) {
          chat.send({ embeds: [embed] });
        }
      })



      .catch((err) => {
       // console.log(`Failed to timeout member: ${err.message}`);
      });
      
  },
};
