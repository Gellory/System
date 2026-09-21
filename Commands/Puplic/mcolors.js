const { AttachmentBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require("discord.js");
const db = require("pro.db");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  name: "mcolors",
  description: "Shows server colors",
  run: async (client, message) => {

    const isEnabled = db.get(`command_enabled_${module.exports.name}`);
    if (isEnabled === false) {
        return; 
    }

    let setChannel = db.get(`setChannel_${message.guild.id}`);
    if (setChannel && message.channel.id !== setChannel) return;

    const colorRoles = message.guild.roles.cache.filter(
      (role) => !isNaN(role.name) && !role.name.includes(".")
    );
    
    if (colorRoles.size === 0) {
      return message.reply("**لا يوجد الوان في السيرفر .**");
    }

    // تحويل إلى مصفوفة للفرز الصحيح
    const sortedRoles = Array.from(colorRoles.values())
      .sort((roleA, roleB) => parseInt(roleB.name) - parseInt(roleA.name));

    // تحديد أبعاد الكانفاس
    const canvasWidth = 1200;
    let canvasHeight = 400;
    const rolesCount = Math.min(sortedRoles.length, 25); // أقصى 25 دور
    
    // زيادة الارتفاع إذا كان هناك أكثر من 12 دور
    if (rolesCount > 12) {
      canvasHeight = 500;
    }
    if (rolesCount > 18) {
      canvasHeight = 600;
    }

    const colorsList = createCanvas(canvasWidth, canvasHeight); 
    const ctx = colorsList.getContext("2d");

    // تعبئة الخلفية
    ctx.fillStyle = '#36393f';
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // تحميل صورة الخلفية إذا وجدت
    const Url = db.get("Url = [ Colors ]");
    if (Url) {
      try {
        const backgroundImage = await loadImage(Url);
        // تغطية الكامل بالصورة
        ctx.drawImage(backgroundImage, 0, 0, canvasWidth, canvasHeight);
      } catch (error) {
        console.error("Error loading background image:", error);
      }
    }

    // إعداد الشبكة
    const cellSize = 80;
    const padding = 20;
    const columns = 5; // عدد الأعمدة
    const rows = Math.ceil(rolesCount / columns);
    
    // حساب نقطة البداية لتوسيط الشبكة
    const gridWidth = columns * cellSize + (columns - 1) * padding;
    const gridHeight = rows * cellSize + (rows - 1) * padding;
    const startX = (canvasWidth - gridWidth) / 2;
    const startY = (canvasHeight - gridHeight) / 2;

    // رسم الأدوار
    for (let i = 0; i < rolesCount; i++) {
      const colorRole = sortedRoles[i];
      const row = Math.floor(i / columns);
      const col = i % columns;
      
      const x = startX + col * (cellSize + padding);
      const y = startY + row * (cellSize + padding);
      
      // رسم خلفية مربعة
      ctx.fillStyle = '#2f3136';
      ctx.fillRect(x - 5, y - 5, cellSize + 10, cellSize + 10);
      
      // رسم مربع اللون
      ctx.fillStyle = colorRole.hexColor;
      ctx.fillRect(x, y, cellSize, cellSize);
      
      // إضافة حدود
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(x, y, cellSize, cellSize);
      
      // إضافة رقم اللون
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // تأثير ظل للنص
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      ctx.fillText(colorRole.name, x + cellSize/2, y + cellSize/2);
      
      // إعادة تعيين الظل
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }

    // إضافة عنوان
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('🎨 ألوان السيرفر 🎨', canvasWidth/2, 50);

    // استخدام AttachmentBuilder بدلاً من AttachmentBuilder
   const attachment = new AttachmentBuilder(colorsList.toBuffer(), { name: "colors.png" });

    // إنشاء القائمة المنسدلة
    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId(`Colors_${message.id}`) // إضافة معرف فريد
      .setPlaceholder("قم باختيار اللون المناسب")
      .setMaxValues(1)
      .setMinValues(1);

    // إضافة خيارات القائمة (حد أقصى 25)
    sortedRoles.slice(0, 25).forEach((colorRole) => {
      selectMenu.addOptions({
        label: `اللون ${colorRole.name}`,
        value: colorRole.id,
        emoji: '🎨',
      });
    });

    const actionRow = new ActionRowBuilder().addComponents(selectMenu);
    
    // إرسال الرسالة
    const sentMessage = await message.channel.send({ 
      content: `**🎨 | تم عرض ${rolesCount} لون**`,
      files: [attachment], 
      components: [actionRow] 
    });

    // إنشاء كولكتور للتفاعل
    const collector = sentMessage.createMessageComponentCollector({ 
      componentType: "SELECT_MENU",
      time: 60000 // 60 ثانية
    });

    collector.on("collect", async (interaction) => {
      if (interaction.customId === `Colors_${message.id}`) {
        const role = interaction.guild.roles.cache.get(interaction.values[0]);
        
        if (!role) {
          return interaction.reply({ 
            content: '❌ هذا اللون لم يعد موجوداً', 
            ephemeral: true 
          });
        }

        const member = interaction.member;
        
        try {
          // إزالة جميع أدوار الألوان القديمة
          const oldColorRoles = member.roles.cache.filter(
            (r) => !isNaN(r.name) && !r.name.includes(".")
          );
          
          if (oldColorRoles.size > 0) {
            await member.roles.remove(oldColorRoles);
          }
          
          // إضافة الدور الجديد
          await member.roles.add(role);
          
          await interaction.reply({ 
            content: `✅ **تم تغيير اللون بنجاح إلى: ${role.name}**`, 
            ephemeral: true 
          });
          
        } catch (error) {
          console.error("Error changing role:", error);
          await interaction.reply({ 
            content: '❌ حدث خطأ أثناء تغيير اللون', 
            ephemeral: true 
          });
        }
      }
    });

    collector.on("end", () => {
      // يمكنك إزالة المكونات بعد انتهاء الوقت إذا أردت
      // sentMessage.edit({ components: [] }).catch(() => {});
    });
  },
};