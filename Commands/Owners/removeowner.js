let config = require("../../config.json");
const { prefix, owners } = require(`${process.cwd()}/config`);
let fs = require("fs");
const db = require("pro.db");
const { EmbedBuilder } = require("discord.js");
const Discord = require("discord.js");
module.exports = {
    name: 'removeowner', 
    run: async (client, message, args) => {

        if (!owners.includes(message.author.id)) return message.react('❌');
        const isEnabled = db.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) {
            return; 
        }

        const Color = db.get(`Guild_Color = ${message.guild.id}`) || '#1e1f22';
        if (!Color) return;
        

        let idToRemove = args[0];

        if (!idToRemove || isNaN(idToRemove)) {
            const mentions = message.mentions.users;

            if (mentions.size > 0) {
                idToRemove = mentions.first().id;
            } else {

                const embed = new EmbedBuilder()
                .setColor(`${Color || `#192029`}`)
                .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}removeowner <@${message.author.id}>**`);
                return message.reply({ embeds: [embed] });
            }
        }

        const index = config.owners.indexOf(idToRemove);
        if (index === -1) {
            return message.react("❌");
        }

    
        config.owners.splice(index, 1);
        fs.writeFile("./config.json", JSON.stringify(config, null, 4), (err) => {
            if (err) console.log(err);
        });

        return message.react("✅");
    }
};