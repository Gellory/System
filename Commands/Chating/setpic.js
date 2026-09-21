const { AttachmentBuilder, EmbedBuilder } = require('discord.js');
const { prefix, owners } = require(`${process.cwd()}/config`);

const Data = require('pro.db');

module.exports = {
    name: 'setpic',
    run: async (client, message, args) => {
        if (!owners.includes(message.author.id)) return message.react('❌');
        const isEnabled = Data.get(`command_enabled_${module.exports.name}`);
        if (isEnabled === false) {
            return;
        }

        const Color = Data.get(`Guild_Color = ${message.guild.id}`) || '#192029';
        if (!Color) return;


        // Mentioned channel or use the provided channel ID in the command
        const mentionedChannel = message.mentions.channels.first() || client.channels.cache.get(args[0]);

        if (!mentionedChannel) {
            const embed = new EmbedBuilder()
                .setColor(`${Color || `#192029`}`)
                .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}setpic <#${message.channel.id}>**`);
            return message.reply({ embeds: [embed] });

        }

        let channels = Data.get(`setChannels_${message.guild.id}`) || [];

        if (!channels.includes(mentionedChannel.id)) {
            channels.push(mentionedChannel.id);
        }

        Data.set(`setChannels_${message.guild.id}`, channels);
        message.react("✅");
    }
}