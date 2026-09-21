const { EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { owners, prefix } = require(`${process.cwd()}/config`);

module.exports = {
        name: "hide",
        aliases: ["اخفاء"],
        description: "hide chat",
        usage: ["hide chat"],
        run: async (client, message, args, config) => {

                const Pro = require(`pro.db`)
                const db = Pro.get(`Allow - Command hide = [ ${message.guild.id} ]`)
                const allowedRole = message.guild.roles.cache.get(db);
                const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

                if (!isAuthorAllowed && message.author.id !== db && !message.member.permissions.has(PermissionFlagsBits.ManageChannels) && !owners.includes(message.author.id)) {
                        // إجراءات للتصرف عندما لا يتحقق الشرط
                        return;
                }

                const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
                if (isEnabled === false) {
                        return;
                }



                let everyone = message.guild.roles.cache.find(hyper => hyper.name === '@everyone');
                message.channel.permissionOverwrites.edit(everyone, {
                        ViewChannel: false
                }).then(() => {
                        message.react("✅").catch((err) => {
                                console.log(`**لم أتمكن من الرد على الرسالة:**` + err.message)
                        })
                })

        },
};
