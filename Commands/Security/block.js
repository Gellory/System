const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require("discord.js");
const Pro = require("pro.db");
const { prefix, owners } = require(`${process.cwd()}/config`);

module.exports = {
  name: "block",
  run: async (client, message) => {
    const Color = Pro.get(`Guild_Color = ${message.guild.id}`) || "#1e1f22";
    if (!Color) return;

    const allowDb = Pro.get(`Allow - Command block = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(allowDb);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

    if (!isAuthorAllowed && message.author.id !== allowDb && !message.member.permissions.has(PermissionFlagsBits.KickMembers) && !owners.includes(message.author.id)) {
      return;
    }

    let targetId;

    // إذا تم ذكر عضو في الرسالة
    const mentionedUser = message.mentions.users.first();
    if (mentionedUser) {
      targetId = mentionedUser.id;
    } else {
      // إذا تم إرفاق الأمر مع الأيدي مباشرة
      targetId = message.content.split(/\s+/)[1];
    }

    if (!targetId) {
      const embed = new EmbedBuilder()
        .setColor(`${Color || "#1e1f22"}`)
        .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة.\n${prefix}block <@${message.author.id}>**`);

      return message.reply({ embeds: [embed] });
    }

    const reasons = [
      { label: 'الحسابات الثانية والوهمية.', description: `مؤبد.`, value: 'الحسابات الثانية والوهمية.' },
      { label: 'السجن المتكرر.', description: `مؤبد.`, value: 'السجن المتكرر.' },
      { label: 'بلاك لست متكرر.', description: `مؤبد.`, value: 'بلاك لست متكرر.' },
      { label: 'قاصر بسبب والأسباب كالأتي :', description: `خنيث , قذف , مشاكل متكررة : مؤبد`, value: 'خنيث , قذف , مشاكل متكررة : مؤبد' },
      { label: 'فري مايك.', description: `مؤبد.`, value: 'فري مايك.' },
    ];

    const reasonMenu = new StringSelectMenuBuilder()
      .setCustomId('block_reason')
      .setPlaceholder('اختر سبب الحظر')
      .addOptions(reasons);

    const deleteButton = new ButtonBuilder()
      .setCustomId('Cancel4')
      .setLabel('الغاء')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(reasonMenu);
    const block = new ActionRowBuilder().addComponents(deleteButton);

    const replyMessage = await message.reply({ content: `**يرجي تحديد سبب البلاك لست.**\n** * <@${targetId}>**`, components: [row, block] });

    const filter = (interaction) => interaction.isStringSelectMenu() && interaction.user.id === message.author.id;

    const collector = message.channel.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async (interaction) => {
      const selectedReason = interaction.values[0];

      try {
        // قم بطرد العضو باستخدام الأيدي المحدد
        await message.guild.members.kick(targetId, `${selectedReason}`);
        
        // حفظ إيدي الشخص في قاعدة البيانات
        Pro.push(`blockedUsers_${targetId}`, true);


        const selectedUser = await client.users.fetch(targetId); // جلب معلومات المستخدم المحظور

        const logblocklist = Pro.get(`logblocklist_${message.guild.id}`);
        const logChannel = message.guild.channels.cache.find((c) => c.id === logblocklist);

        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setTitle('Blacklist')
            .setAuthor({ name: message.author.username, iconURL: message.author.avatarURL({ extension: 'png' }) })
            .addFields(
              { name: 'User', value: `<@${targetId}>`, inline: true },
              { name: 'By', value: `<@${message.author.id}>`, inline: true },
              { name: 'Time', value: '\`( مؤبد )\`', inline: true },
              { name: 'Reason', value: selectedReason, inline: true }
            )
            .setColor("#525C74")
            .setFooter({ text: selectedUser.username, iconURL: selectedUser.displayAvatarURL({ extension: 'png', size: 128 }) })
            .setThumbnail("https://cdn.discordapp.com/attachments/1091536665912299530/1223516030593274046/businessman.png?ex=661a2319&is=6607ae19&hm=ee6f09d5234ef05be8c162b92075a55b04fd503ef44140524ad0d0aca0de6370&");
            logChannel.send({ embeds: [logEmbed] });
        }




        const logkick = Pro.get(`logkick_${message.guild.id}`); // Fetching log kick channel ID from the database
        const loogChannel = message.guild.channels.cache.get(logkick);
        if (loogChannel) {
            const executor = message.author;
            const logEmbed = new EmbedBuilder()
                .setAuthor({ name: message.author.username, iconURL: message.author.avatarURL({ extension: 'png' }) })
                .setDescription(`**طرد عضو**\n\n**العضو : <@${targetId}>**\n**بواسطة : <@${message.author.id}>**\n\`\`\`Reason : ${selectedReason}\`\`\`\ `)
                .setColor(`#493042`)
                .setFooter({ text: selectedUser.username, iconURL: selectedUser.displayAvatarURL({ extension: 'png', size: 128 }) })
                .setThumbnail(`https://cdn.discordapp.com/attachments/1091536665912299530/1209563150119211138/F4570260-9C71-432E-87CC-59C7B4B13FD4.png?ex=65e76077&is=65d4eb77&hm=5d7ef4be2c19a4f52c29255991dc129b53cf33d11c8d962ea0573cd72feaf3ac&`);
            loogChannel.send({ embeds: [logEmbed] });
        }

        message.react("✅");
      } catch (error) {
        console.error(error);
        message.react("❌");
      }

      interaction.message.delete();
    });


    client.on('interactionCreate', async (interaction) => {
      if (!interaction.isButton()) return;

      if (interaction.customId === 'Cancel4') {
        interaction.message.delete();
      }
    });
  },
};
