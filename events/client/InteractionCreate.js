module.exports = async (client, interaction) => {
    if (interaction.isChatInputCommand()) {
        const cmd = client.slashCommands.get(interaction.commandName);
        if (!cmd || typeof cmd.run !== "function") {
            return interaction.reply({
                content: "> **An Error Occured**",
                ephemeral: true
            }).catch(() => {});
        }

        const args = [];
        for (const option of interaction.options.data) {
            if (option.type === 1) {
                if (option.name) args.push(option.name);
                for (const nested of option.options || []) {
                    if (nested.value !== undefined) args.push(nested.value);
                }
                continue;
            }
            if (option.value !== undefined) args.push(option.value);
        }

        interaction.member = interaction.guild.members.cache.get(interaction.user.id);

        try {
            await cmd.run(client, interaction, args);
        } catch (error) {
            console.error(`Slash command "${interaction.commandName}" failed:`, error.message);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: "An internal error occurred while executing this command.",
                    ephemeral: true
                }).catch(() => {});
            }
        }

        return;
    }

    if (interaction.isContextMenuCommand()) {
        const command = client.slashCommands.get(interaction.commandName);
        if (!command || typeof command.run !== "function") return;
        try {
            await command.run(client, interaction);
        } catch (error) {
            console.error(`Context command "${interaction.commandName}" failed:`, error.message);
        }
    }
};
