const Pro = require('pro.db');
module.exports = {
  name: 'clear',
  aliases: ['مسح'],
  run: async (client, message, args) => {

    const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
        return; 
    }
    const db = Pro.get(`Allow - Command clear = [ ${message.guild.id} ]`);
    const allowedRole = message.guild.roles.cache.get(db);
    const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

    const { PermissionFlagsBits } = require('discord.js');
    if (!isAuthorAllowed && message.author.id !== db && !message.member.permissions.has(PermissionFlagsBits.ManageMessages)) {
      return;
    }

    message.delete().catch(() => {});

    if (!message.guild.members.me.permissions.has(PermissionFlagsBits.ManageMessages)) return message.react('❌');

    let a12rgs = message.content.split(' ').slice(1);
    let messagecount = parseInt(a12rgs);
    if (messagecount > 100) {
      return message.channel.send({
        content: '```javascript\nI can\'t delete more than 100 messages\n```'
      }).then(messages => setTimeout(() => messages.delete().catch(() => {}), 1000));
    }
    if (!messagecount) messagecount = 100;

    try {
      let fetchedMessages;
      if (message.mentions.users.size > 0) {
        const mentionedUser = message.mentions.users.first();
        fetchedMessages = await message.channel.messages.fetch({ limit: messagecount });
        fetchedMessages = fetchedMessages.filter(msg => msg && msg.author && msg.author.id && msg.author.id === mentionedUser?.id);
      } else {
        fetchedMessages = await message.channel.messages.fetch({ limit: messagecount });
      }
    
      if (fetchedMessages.size === 0) {
        return message.channel.send('There are no messages to delete.').then(msg => setTimeout(() => msg.delete().catch(() => {}), 3000));
      }

      const deletedMessages = await message.channel.bulkDelete(fetchedMessages, true);
      const msgsize = deletedMessages.size;
      const channelmessage = Pro.get(`channelmessage_${message.guild.id}`);
      const logChannel = message.guild.channels.cache.find((c) => c.id === channelmessage);

      if (logChannel) {
        let logContent = deletedMessages
          .filter(msg => msg && msg.author)
          .map(msg => `${msg.author.username || 'Unknown'}: ${msg.content || '[No content]'}`)
          .join('\n');
        if (logContent.length > 2000) {
          logContent = logContent.slice(0, 1997) + '...';
        }
        logChannel.send({
          files: [{
            attachment: Buffer.from(logContent),
            name: 'deleted.txt'
          }]
        });
      }
    } catch (err) {
      console.error(err);
    }
  }
};
