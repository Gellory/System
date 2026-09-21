const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const Pro = require("pro.db");

module.exports = {
  name: "myrole",
  aliases: ["رولي"],
  run: async (client, message) => {
    const userID = message.author.id;
    const userRoles = Pro.get(`userRoles_${userID}`);

    if (!message.guild || !userRoles || userRoles.length === 0) return;

    const rolesMentions = userRoles.map(r => `<@&${r}>`).join(", ");

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("roleOptions")
      .setPlaceholder("يرجى الاختيار ..")
      .addOptions([
        {
          label: "اسم الرول",
          description: "تغيير اسم رولك الخاص",
          value: "roleName",
        },
        {
          label: "لون الرول",
          description: "تغيير لون رولك الخاص",
          value: "roleColor",
        },
        {
          label: "صورة الرول",
          description: "إضافة صورة أو إيموجي للرول",
          value: "roleImage",
        },
        {
          label: "مشاركة الرول",
          description: "إعطاء الرول لشخص آخر",
          value: "giveMyRole",
        },
        {
          label: "إزالة مشاركة",
          description: "إزالة الرول من شخص",
          value: "removeRole",
        },
        {
          label: "حذف الرول",
          description: "حذف الرول نهائيًا",
          value: "deleteRole",
        },
      ]);

    const cancelButton = new ButtonBuilder()
      .setCustomId("Cancel3")
      .setLabel("إلغاء")
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(selectMenu);
    const buttonRow = new ActionRowBuilder().addComponents(cancelButton);

    const replyMessage = await message.reply({
      content: `**الرول الخاص : ${rolesMentions}**`,
      components: [row, buttonRow],
    });

    const collector = replyMessage.createMessageComponentCollector({
      time: 60000,
    });

    collector.on("collect", async (interaction) => {
      if (interaction.user.id !== userID) return;

      /* زر الإلغاء */
      if (interaction.isButton()) {
        if (interaction.customId === "Cancel3") {
          await interaction.message.delete();
        }
        return;
      }

      if (!interaction.isStringSelectMenu()) return;

      const choice = interaction.values[0];
      await interaction.deferUpdate();

      /* تغيير اسم الرول */
      if (choice === "roleName") {
        await interaction.followUp({
          content: "أرسل اسم الرول الجديد",
          ephemeral: true,
        });

        const nameCollector = message.channel.createMessageCollector({
          filter: m => m.author.id === userID,
          time: 60000,
          max: 1,
        });

        nameCollector.on("collect", async (msg) => {
          userRoles.forEach(id => {
            const role = message.guild.roles.cache.get(id);
            if (role) role.setName(msg.content).catch(() => {});
          });
          await message.react("✅");
          replyMessage.delete();
        });
      }

      /* تغيير لون الرول */
      if (choice === "roleColor") {
        await interaction.followUp({
          content: "أرسل كود اللون (مثال: #ffffff)",
          ephemeral: true,
        });

        const colorCollector = message.channel.createMessageCollector({
          filter: m => m.author.id === userID,
          time: 60000,
          max: 1,
        });

        colorCollector.on("collect", async (msg) => {
          userRoles.forEach(id => {
            const role = message.guild.roles.cache.get(id);
            if (role) role.setColor(msg.content).catch(() => {});
          });
          await message.react("✅");
          replyMessage.delete();
        });
      }

      /* حذف الرول */
      if (choice === "deleteRole") {
        userRoles.forEach(id => {
          const role = message.guild.roles.cache.get(id);
          if (role) role.delete().catch(() => {});
        });
        Pro.delete(`userRoles_${userID}`);
        await message.react("✅");
        replyMessage.delete();
      }

      /* إعطاء الرول */
      if (choice === "giveMyRole" || choice === "removeRole") {
        await interaction.followUp({
          content: "أرسل منشن الشخص",
          ephemeral: true,
        });

        const mentionCollector = message.channel.createMessageCollector({
          filter: m => m.author.id === userID && m.mentions.users.size > 0,
          time: 60000,
          max: 1,
        });

        mentionCollector.on("collect", async (msg) => {
          const member = message.guild.members.cache.get(
            msg.mentions.users.first().id
          );
          if (!member) return;

          userRoles.forEach(id => {
            const role = message.guild.roles.cache.get(id);
            if (!role) return;
            choice === "giveMyRole"
              ? member.roles.add(role).catch(() => {})
              : member.roles.remove(role).catch(() => {});
          });

          await message.react("✅");
          replyMessage.delete();
        });
      }
    });
  },
};
