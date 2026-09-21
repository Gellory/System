const db = require("pro.db");
const { prefix, owners } = require(`${process.cwd()}/config`);
const { EmbedBuilder, ChannelType } = require("discord.js");
const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

module.exports = {
  name: "autoline",
  description: "To set image URL and channel(s)",
  usage: `${prefix}autoline <image || image link> <channel1> <channel2> ...`,
  run: async (client, message, args) => {
    // التحقق من صلاحيات المالك
    if (!owners.includes(message.author.id)) return message.react('❌');
    
    // التحقق من تفعيل الأمر
    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) return;

    const Color = db.get(`Guild_Color_${message.guild.id}`) || '#192029';

    // التحقق من وجود صورة مرفقة أو رابط صورة
    let imageURL = null;
    let channelArgs = [];
    let isAttachment = false;

    // حالة 1: صورة مرفقة + قنوات
    if (message.attachments.size > 0) {
      const attachment = message.attachments.first();
      // التحقق من أن المرفق هو صورة
      if (attachment.contentType && attachment.contentType.startsWith('image/')) {
        imageURL = attachment.url;
        channelArgs = args; // كل الآرقز هي قنوات
        isAttachment = true;
      }
    }
    // حالة 2: رابط صورة + قنوات
    else if (args.length >= 2) {
      // التحقق إذا كان الآرق الأول يبدو كرابط
      if (args[0].startsWith('http://') || args[0].startsWith('https://')) {
        imageURL = args[0];
        channelArgs = args.slice(1); // باقي الآرقز هي قنوات
        isAttachment = false;
      } else {
        const embed = new EmbedBuilder()
          .setColor(Color)
          .setDescription(
            `**يرجى استعمال الأمر بالطريقة الصحيحة:**\n` +
            `\`${prefix}autoline <image link> <#channel1> <#channel2> ...\`\n` +
            `أو قم برفع صورة مع الأمر:\n` +
            `\`${prefix}autoline <#channel1> <#channel2> ...\` + صورة مرفقة`
          );
        return message.reply({ embeds: [embed] });
      }
    }

    // إذا لم يتم العثور على صورة أو قنوات
    if (!imageURL || channelArgs.length === 0) {
      const embed = new EmbedBuilder()
        .setColor(Color)
        .setDescription(
          `**يرجى استعمال الأمر بالطريقة الصحيحة:**\n` +
          `\`${prefix}autoline <image link> <#channel1> <#channel2> ...\`\n` +
          `أو قم برفع صورة مع الأمر:\n` +
          `\`${prefix}autoline <#channel1> <#channel2> ...\` + صورة مرفقة`
        );
      return message.reply({ embeds: [embed] });
    }

    // التحقق من صحة رابط الصورة (فقط للروابط الخارجية، ليس للمرفقات)
    if (!isAttachment) {
      try {
        const response = await fetch(imageURL, { method: 'HEAD', timeout: 5000 });
        if (!response.ok) {
          const embed = new EmbedBuilder()
            .setColor(Color)
            .setDescription('**❌ الرابط المدخل غير صالح أو لا يمكن الوصول إليه!**');
          return message.reply({ embeds: [embed] });
        }
        
        const contentType = response.headers.get('content-type');
        if (contentType && !contentType.startsWith('image/')) {
          const embed = new EmbedBuilder()
            .setColor(Color)
            .setDescription('**❌ الرابط المدخل ليس رابط صورة صالح!**');
          return message.reply({ embeds: [embed] });
        }
      } catch (error) {
        console.error('Error validating image URL:', error);
        const embed = new EmbedBuilder()
          .setColor(Color)
          .setDescription('**❌ فشل التحقق من رابط الصورة! تأكد من أن الرابط صحيح ويمكن الوصول إليه.**');
        return message.reply({ embeds: [embed] });
      }
    }

    // التحقق من القنوات
    const validChannels = [];
    const invalidChannels = [];

    for (const channelArg of channelArgs) {
      const channelID = channelArg.replace(/[^0-9]/g, '');
      const channel = message.guild.channels.cache.get(channelID);
      
      if (!channel || channel.type !== ChannelType.GuildText) {
        invalidChannels.push(channelArg);
      } else {
        validChannels.push({ id: channelID, channel: channel });
      }
    }

    // إذا كانت كل القنوات غير صالحة
    if (validChannels.length === 0) {
      const embed = new EmbedBuilder()
        .setColor(Color)
        .setDescription('**❌ لم يتم العثور على أي قناة نصية صالحة!**');
      return message.reply({ embeds: [embed] });
    }

    // تحميل القنوات المخزنة
    const storedChannels = await db.get("Channels") || [];

    // التأكد من وجود مجلد Fonts
    const fontsDir = path.join(process.cwd(), "Fonts");
    if (!fs.existsSync(fontsDir)) {
      fs.mkdirSync(fontsDir, { recursive: true });
    }

    // معالجة كل قناة صالحة
    const processedChannels = [];
    const failedChannels = [];

    for (const { id: channelID, channel } of validChannels) {
      try {
        // تحميل الصورة وحفظها
        const imageFileName = `Line_${channelID}.png`;
        const imagePath = path.join(fontsDir, imageFileName);

        // تحميل الصورة من الرابط (سواء كان مرفق أو رابط خارجي)
        const res = await fetch(imageURL);
        
        if (!res.ok) {
          throw new Error(`Failed to fetch image: ${res.status} ${res.statusText}`);
        }
        
        const buffer = await res.buffer();
        fs.writeFileSync(imagePath, buffer);

        // تحديث أو إضافة القناة
        const existingChannelIndex = storedChannels.findIndex(
          ch => ch.channelID === channelID
        );

        if (existingChannelIndex !== -1) {
          storedChannels[existingChannelIndex].fontURL = imagePath;
        } else {
          storedChannels.push({
            channelID: channelID,
            fontURL: imagePath
          });
        }

        processedChannels.push(channel);
      } catch (error) {
        console.error(`Error processing channel ${channelID}:`, error);
        failedChannels.push(channel);
      }
    }

    // حفظ في قاعدة البيانات
    if (processedChannels.length > 0) {
      db.set("Channels", storedChannels);
    }

    // إنشاء رسالة النتيجة
    let description = '';

    if (processedChannels.length > 0) {
      description += `**✅ تم تعيين الصورة بنجاح للقنوات التالية:**\n`;
      description += processedChannels.map(ch => `${ch}`).join('\n');
      description += `\n\n`;
    }

    if (invalidChannels.length > 0) {
      description += `**⚠️ القنوات التالية غير صالحة:**\n`;
      description += invalidChannels.map(ch => `\`${ch}\``).join(', ');
      description += `\n\n`;
    }

    if (failedChannels.length > 0) {
      description += `**❌ فشل تعيين الصورة للقنوات التالية:**\n`;
      description += failedChannels.map(ch => `${ch}`).join('\n');
    }

    const resultEmbed = new EmbedBuilder()
      .setColor(Color)
      .setDescription(description)
      .setThumbnail(imageURL)
      .setFooter({ text: `تم تعيين ${processedChannels.length} من ${channelArgs.length} قناة` });

    if (processedChannels.length > 0) {
      message.react('✅');
    } else {
      message.react('❌');
    }

    message.reply({ embeds: [resultEmbed] });
  },
};