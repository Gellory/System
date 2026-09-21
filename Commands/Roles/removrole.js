module.exports = {
  name: 'removerole',
  run: async (client, message) => {
      const Pro = require(`pro.db`);
      const db = Pro.get(`Allow - Command allrole = [ ${message.guild.id} ]`);
      const allowedRole = message.guild.roles.cache.get(db);
      const isAuthorAllowed = message.member.roles.cache.has(allowedRole?.id);

      if (!isAuthorAllowed && message.author.id !== db && !message.member.permissions.has('ADMINISTRATOR')) {
          return;
      }

      let Removed;

      // Check if a role mention is provided in the message
      if (message.mentions.roles.size > 0) {
          Removed = message.mentions.roles.first();
      } else {
          // If not, try to find the role by ID
          Removed = message.guild.roles.cache.get(message.content.split(" ")[1]);
      }

      // If no role is found, notify the user
      if (!Removed) {
          return message.reply({ content: "**يرجى ارفاق ايدي الرول أو منشنه.**" });
      }

      let Members = 0;
      for (const member of message.guild.members.cache) {
          if (member[1].roles.cache.has(Removed.id)) {
              try {
                  await member[1].roles.remove(Removed);
                  Members++;
              } catch (error) {
                  console.error(error);
              }
          }
      }
      message.reply({ content: `تمت إزالة رول **${Removed.name}** من **${Members}** عضو (s).` });
  }
}
