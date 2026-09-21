const { prefix, owners } = require(`${process.cwd()}/config`);
const { EmbedBuilder } = require('discord.js');
const Data = require("pro.db");
const Pro = require(`pro.db`);

module.exports = {
    name: "addalias",
    aliases: ["addaliase", "acomnd"],
    run: async function (client, message) {

        if (!owners.includes(message.author.id)) return message.react('❌');
        const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) {
            return; 
        }


        const Color = Data.get(`Guild_Color = ${message.guild.id}`) || '#192029';
        if (!Color) return;

        const commandName = message.content.split(" ")[1];
        const aliasName = message.content.split(" ")[2];
        const command = client.commands.get(commandName);

        if (!command) {
            const embed = new EmbedBuilder()
                .setColor(`${Color || `#192029`}`)
                .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}acomnd ban حظر**`);
            return message.reply({ embeds: [embed] });
        }

        if (!aliasName) return message.reply("**يرجى ادخال اسم الاختصار.**");
        if (command.aliases.includes(aliasName)) return message.reply("**الإختصار موجود بالفعل.**");

        command.aliases.push(aliasName);
        client.commands.set(command.name, command);
        message.react("✅");

        Data.set(`aliases_${command.name}`, command.aliases);
    },
};
