const { AttachmentBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { Canvas, resolveImage } = require('canvas-constructor/cairo');
//const fetch = require('node-fetch');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const Data = require("pro.db");

module.exports = {
  name: 'avatar',
  aliases: ["avt"],
  run: async (client, message, args) => {
    const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
        return; 
    }

    let setChannel = Data.get(`setChannel_${message.guild.id}`);
    if (setChannel && message.channel.id !== setChannel) return;

    let user;
    let userId;

    if (message.mentions.users.size > 0) {
      user = message.mentions.users.first();
      userId = user.id;
    } else if (args[0]) {
      userId = args[0].replace(/[<@!>]/g, '');
    } else {
      user = message.author;
      userId = user.id;
    }

    try {
      const response = await fetch(`https://discord.com/api/v9/users/${userId}`, {
        headers: {
          Authorization: `Bot ${client.token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch user data');
      }
      
      const userData = await response.json();
      const avatarURL = userData.avatar ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png` : `https://cdn.discordapp.com/embed/avatars/${userData.discriminator % 5}.png`;

      const fetchedUserData = await client.users.fetch(userId);
      const avatarbotn = fetchedUserData.displayAvatarURL({ extension: 'png', size: 512 });

      let bannerAvailable = false;
      let bannerURL = null;

      if (userData.banner) {
        bannerURL = `https://cdn.discordapp.com/banners/${userData.id}/${userData.banner}.png?size=1024`;
        bannerAvailable = true;
      }

      const canvas = new Canvas(350, 220);
      canvas.setColor('#18191c').printRectangle(0, 0, 350, 220);

      // Add background image
      const backgroundImage = await resolveImage(`${process.cwd()}/Fonts/Badges.png`);
      canvas.printImage(backgroundImage, 0, 0, 350, 220);

      if (bannerAvailable && bannerURL) {
          try {
              const bannerImage = await resolveImage(bannerURL);
              canvas.printImage(bannerImage, 0, 0, 350, 110);
          } catch (bannerError) {
              console.error('Failed to fetch user banner:', bannerError);
          }
      } else {
          canvas.setColor('#2e3035').printRectangle(0, 0, 350, 115);
      }

      const avatarImage = await resolveImage(avatarURL);
      canvas.setColor('#18191c').printCircle(70, 110, 53);
      canvas.printCircularImage(avatarImage, 70, 110, 45);
      canvas.setColor('#18191c').printCircle(100, 142, 14); // دائرة بيضاء بحجم أكبر
      canvas.setColor('#43b581').printCircle(100, 142, 10); // دائرة خضراء بحجم أصغر

      canvas.setColor('#ffffff').setTextSize(19).setTextAlign('left').printText(`@${userData.username}`, 15, 178);

      const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: 'avatar.png' });

      const bannerButton = new ButtonBuilder()
        .setLabel('Banner')
        .setStyle(ButtonStyle.Primary)
        .setCustomId('show_banner');

      const avatarButton = new ButtonBuilder()
        .setLabel('Avatar')
        .setStyle(ButtonStyle.Primary)
        .setCustomId('show_avatar');

      // تعيين حالة الزر الذي يظهر الافتار بناءً على متغير avatarbotn
      if (!avatarbotn) {
        avatarButton.setDisabled(true);
      }

      const actionRow = new ActionRowBuilder()
        .addComponents(bannerButton, avatarButton);

      const replyMessage = await message.reply({ files: [attachment], components: [actionRow] });

      const filter = (interaction) => interaction.user.id === message.author.id;
      const collector = replyMessage.createMessageComponentCollector({ filter, time: 15000 });

      let collectedInteraction;

      collector.on('collect', async (interaction) => {
        if (interaction.isButton()) {
          const buttonId = interaction.customId;
          if (buttonId === 'show_banner') {
            if (bannerURL) {
              await interaction.reply({ files: [bannerURL], ephemeral: true });
            } else {
              await interaction.reply({ content: '**لا يمُلك بنر.** ❌', ephemeral: true });
            }
          } else if (buttonId === 'show_avatar') {
            if (avatarbotn) {
              await interaction.reply({ files: [avatarbotn], ephemeral: true });
            } else {
              await interaction.reply({ content: '**لا يمُلك افتار.** ❌', ephemeral: true });
            }
          }
        }
        
      
        collectedInteraction = interaction;
      });


      collector.on('end', () => {
        if (collectedInteraction) {
          collectedInteraction.message.edit({ components: [] });
        } else {
          console.log('No interaction object captured during collection.');
        }
      });

    } catch (error) {
      console.error(error);
      message.react("❌");
    }
  }
};
