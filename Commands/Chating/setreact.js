const { EmbedBuilder } = require("discord.js");
const { prefix, owners } = require(`${process.cwd()}/config`);
const dqb = require("pro.db");

module.exports = {
    name: "setreact",
    aliases: ["setreact"],
    description: "A simple react command.",

    run: async (client, message) => {



        if (!owners.includes(message.author.id)) return message.react('❌');
        const isEnabled = dqb.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) {
            return;
        }
        const Color = dqb.get(`Guild_Color = ${message.guild.id}`) || '#192029';
        if (!Color) return;

        try {
            const args = message.content.split(" ");

            const ChannelId = args[1];
            const Emoji1 = args[2];
            const Emoji2 = args[3];
            const Emoji3 = args[3];
            const Emoji4 = args[4];
            const Emoji5 = args[5];
            const Emoji6 = args[6];

            if (!ChannelId) {
                const missingArgsEmbed = new EmbedBuilder()
                    .setColor(`${Color || `#192029`}`)
                    .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}setreact <#${message.channel.id}> 🤍**`);
                return message.reply({ embeds: [missingArgsEmbed] });
            }

            const channel = message.guild.channels.cache.find((c) => c.id === ChannelId.replace(/<#|>/g, "") || c.name === ChannelId);
            if (!channel) {
                const invalidChannelEmbed = new EmbedBuilder()
                    .setColor(`${Color || `#192029`}`)
                    .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}setreact <#${message.channel.id}> 🤍**`);
                return message.reply({ embeds: [invalidChannelEmbed] });
            }

            dqb.set(`RoomInfo_${channel.id}`, {
                Channel_Id: channel.id,
                Emoji1_Id: Emoji1,
                Emoji2_Id: Emoji2,
                Emoji3_Id: Emoji3,
                Emoji4_Id: Emoji4,
                Emoji5_Id: Emoji5,
                Emoji6_Id: Emoji6
            });

            message.react('✅');
        } catch (e) {
            console.log(e);
        }
    }
};
