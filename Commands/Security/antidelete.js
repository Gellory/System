const db = require("pro.db");
const { owners, prefix } = require(`${process.cwd()}/config`);

module.exports = {
  name: 'antidelete',
  run: async (client, message) => {
    if (!owners.includes(message.author.id)) return message.react('❌');

    const args = message.content.split(' ');
    const command = args[1];

    if (command === 'on') {
      db.set(`antiDelete-${message.guild.id}`, true);
      message.channel.send('Antidelete has been successfully turned of ✅');
    } else if (command === 'off') {
      db.set(`antiDelete-${message.guild.id}`, false);
      message.channel.send('Antidelete has been successfully turned off ✅');
    } else {
      message.reply('Example: Antidelete on/off');
    }
  }
}
