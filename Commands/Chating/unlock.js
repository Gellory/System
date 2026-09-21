const { PermissionFlagsBits } = require('discord.js');
module.exports = {
  name: 'unlock', // هنا اسم الامر
  aliases: ["فتح"],
  run: (client, message, args) => {

    const Pro = require(`pro.db`)
    const db = Pro.get(`Allow - Command lock = [ ${message.guild.id} ]`)
    const allowedRole = message.guild.roles.cache.get(db);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

    if (!isAuthorAllowed && message.author.id !== db && !message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
      // إجراءات للتصرف عندما لا يتحقق الشرط
      return;
    }


    const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
      return;
    }

    // const permission = message.member.permissions.has(PermissionFlagsBits.ManageChannels);
    const guilds = message.guild.members.me.permissions.has(PermissionFlagsBits.ManageChannels);
    const a7rgs = message.content.split(' ')
    const channel = message.mentions.channels.first() || client.channels.cache.get(a7rgs[1]) || message.channel;
    if (!guilds) return message.reply({ content: `:rolling_eyes: **I couldn't change the channel permissions. Please check my permissions.**` }).catch((err) => {
      console.log(`i couldn't reply to the message: ` + err.message)
    })
    let everyone = message.guild.roles.cache.find(hyper => hyper.name === '@everyone');
    channel.permissionOverwrites.edit(everyone, {
      SendMessages: null,
      SendMessagesInThreads: null,
      CreatePublicThreads: null,
      CreatePrivateThreads: null
    }).then(() => {
      message.react("✅").catch((err) => {
        console.log(`i couldn't reply to the message: ` + err.message)
      })
    })



  }
}
