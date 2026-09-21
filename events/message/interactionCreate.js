const {
    ModalBuilder,
    TextInputBuilder,
    ActionRowBuilder,
    TextInputStyle
} = require("discord.js");
const db = require("pro.db");

module.exports = async (_, interaction) => {
    if (interaction.isButton() && interaction.customId === "Auto_Reply") {
        const modal = new ModalBuilder()
            .setCustomId("Reply-Bot")
            .setTitle("Reply");

        const triggerInput = new TextInputBuilder()
            .setCustomId("Auto-Reply")
            .setLabel("اضف الرسالة التي سوف يرد عليها البوت")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        const replyInput = new TextInputBuilder()
            .setCustomId("-Reply")
            .setLabel("اضف الرد هنا")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(triggerInput),
            new ActionRowBuilder().addComponents(replyInput)
        );

        return interaction.showModal(modal);
    }

    if (!interaction.isModalSubmit() || interaction.customId !== "Reply-Bot") {
        return;
    }

    const trigger = interaction.fields.getTextInputValue("Auto-Reply").trim();
    const reply = interaction.fields.getTextInputValue("-Reply").trim();

    if (!trigger || !reply) {
        return interaction.reply({ content: "المدخلات غير صالحة.", ephemeral: true });
    }

    if (db.get(`Replys_${trigger}`)) {
        return interaction.reply({ content: "موجود بالفعل", ephemeral: true });
    }

    db.push(`Replys_${trigger}`, { Word: trigger, Reply: reply });
    return interaction.reply({ content: `${trigger} | ${reply}`, ephemeral: true });
};
