const { AttachmentBuilder } = require('discord.js');
const { Canvas, loadFont, resolveImage } = require('canvas-constructor/cairo');
const humanizeDuration = require('humanize-duration');
const { inviteTracker } = require("discord-inviter");
const Data = require("pro.db");

module.exports = {
  name: 'user',
  aliases: ["يوزر"],
  run: async (client, message, args) => {
    
    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
        return; 
    }

    let setChannel = Data.get(`setChannel_${message.guild.id}`);
    if (setChannel && message.channel.id !== setChannel) return;

    let targetMember;
    if (message.mentions.members.size > 0) {
      targetMember = message.mentions.members.first();
    } else if (args[0]) {
      const userID = args[0].replace(/[<@!>]/g, '');
      targetMember = message.guild.members.cache.get(userID);
    } else {
      targetMember = message.member;
    }

    if (!targetMember) {
      return message.react('❌');
    }

    try {
      loadFont('./Fonts/Cairo-Regular.ttf', { family: 'Cairo' });

      const user = targetMember.user;
      const avatarURL = user.displayAvatarURL({ extension: 'png', size: 512 });

      const backgroundImage = await resolveImage(`${process.cwd()}/Fonts/user.png`);

      const canvas = new Canvas(1000, 380)
        .printImage(backgroundImage, 0, 0, 1000, 380)
        .setColor('#ffffff')
        .printCircularImage(await resolveImage(avatarURL), 180, 170, 140)
        .setTextAlign('center')
        .setTextFont('25px Cairo')
        .setColor('#ffffff')
        .printText(user.displayName, 180, 345);

      const joinedAt = targetMember.joinedAt;
      const createdAt = user.createdAt;
      const userId = targetMember.id; // تغيير هنا لاستخدام معلومات الشخص المذكور

      const now = new Date();
      const joinedDuration = humanizeDuration(now - joinedAt, { round: true, largest: 2 });
      const createdDuration = humanizeDuration(now - createdAt, { round: true, largest: 2 });

      var invite = await inviteTracker.getMemberInvites(targetMember);
      const userMessageCount = (await Data.fetch(`${userId}_points`)) || 0;
      const userVoicePoints = (await Data.fetch(`${userId}_voice`)) || 0;

      
      canvas.setColor('#ffffff')
      .setTextFont('bold 20px Cairo')
      .printText(`${joinedDuration}`, 640, 160)
      .printText(`${createdDuration}`, 640, 230)
      .printText(`${invite.count}`, 640, 300)
      .printText(`${userMessageCount}`, 640, 96) // عرض عدد الرسائل
      .printText(`${userVoicePoints}`, 485, 180); // عرض عدد نقاط الفويس
    

      const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'user.png' });
      message.reply({ files: [attachment] });
    } catch (error) {
      console.error(error);
    }
  }
};
