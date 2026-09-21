const { EmbedBuilder } = require(`discord.js`);
const { prefix, owners } = require(`${process.cwd()}/config`);
const Discord = require("discord.js");
const Pro = require("pro.db");

module.exports = {
  name: 'wanti',
  aliases: ["تحديد-شخص"],
  run: async (client, message, args) => {

    if (!owners.includes(message.author.id)) return message.react('❌');
    const isEnabled = Pro.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
        return; 
    }



    const Color = Pro.get(`Guild_Color = ${message.guild.id}`) || '#192029';
    if (!Color) return;

    let userID;
    const mentionedUser = message.mentions.users.first();
    if (mentionedUser) {
      userID = mentionedUser.id;
    } else {
      userID = args[0];
    }

    if (!userID || isNaN(userID)) {
      const embed = new EmbedBuilder()
          .setColor(`${Color || `#192029`}`)
          .setDescription(`**يرجى استعمال الأمر بالطريقة الصحيحة .\n${prefix}wanti <@${message.author.id}>**`);
      return message.reply({ embeds: [embed] });
    }

    // تأكد من أن المستخدم موجود في السيرفر
    const user = await client.users.fetch(userID).catch(() => null);
    if (!user) {
      return message.react("❌");
    }

    // تحقق مما إذا كان الشخص قد تمت إضافته بالفعل أو لا
    const guildWantiList = Pro.get(`wanti_${message.guild.id}`) || [];
    const index = guildWantiList.indexOf(userID);
    if (index !== -1) {
      // إذا وُجِدَ الشخص، قم بإزالته
      guildWantiList.splice(index, 1);
      Pro.set(`wanti_${message.guild.id}`, guildWantiList);
      return message.react("☑️");
    } else {
      // إذا لم يُوجَدَ الشخص، قم بإضافته
      Pro.push(`wanti_${message.guild.id}`, userID);
      return message.react(`✅`);
    }
  }
};
