const { Telegraf, Markup, session } = require('telegraf');
const mongoose = require('mongoose');
require('dotenv').config();

// Modellar
const User = require('./models/User');
const Movie = require('./models/Movie');
const Config = require('./models/Config');

// Emoji constants
const { EMOJIS, REGULAR_EMOJIS, getEmoji } = require('./constants/emojis');

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.use(session());

console.log('🔄 Bot boshlanyapti...');
console.log('BOT_TOKEN:', process.env.BOT_TOKEN ? '✅ Mavjud' : '❌ YO\'Q!');

// MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB ulandi'))
  .catch(err => {
    console.error('❌ MongoDB xatosi:', err.message);
    process.exit(1);
  });

// ========================
// HELPER FUNCTIONS
// ========================

/**
 * VIP Tekshir
 */
async function isVIPUser(userId) {
  const user = await User.findOne({ userId });
  if (!user) return false;
  
  if (user.vip.active && user.vip.endDate > new Date()) {
    return true;
  }
  
  // VIP tugaganmi?
  if (user.vip.endDate < new Date()) {
    user.vip.active = false;
    await user.save();
  }
  
  return false;
}

/**
 * Kanal obunasini tekshir
 */
async function checkChannelSubscription(userId) {
  const config = await Config.findOne();
  if (!config || !config.requiredChannels.length) return true;
  
  for (let channel of config.requiredChannels) {
    if (!channel.active) continue;
    
    try {
      const member = await bot.telegram.getChatMember(channel.channelId, userId);
      if (member.status === 'left' || member.status === 'kicked') {
        return false;
      }
    } catch (err) {
      console.log('Kanal tekshirish xatosi:', err.message);
      return false;
    }
  }
  
  return true;
}

/**
 * VIP Status Mesaj
 */
function getVIPStatusMessage(user) {
  if (!user.vip.active) {
    return `<b>${getEmoji('premium')} PREMIUM obunasi yo'q</b>`;
  }
  
  const endDate = new Date(user.vip.endDate);
  const daysLeft = Math.floor((endDate - new Date()) / (1000 * 60 * 60 * 24));
  
  return `<b>${getEmoji('premium')} PREMIUM faol!</b> (${daysLeft} kun qoldi)`;
}

// ========================
// START COMMAND
// ========================

bot.start(async (ctx) => {
  try {
    const userId = ctx.from.id;
    const username = ctx.from.username || 'Foydalanuvchi';
    
    let user = await User.findOne({ userId });
    if (!user) {
      user = new User({
        userId,
        username,
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name
      });
      await user.save();
      console.log('✅ Yangi user:', userId);
    }
    
    user.lastActive = new Date();
    await user.save();
    
    // VIP status tekshir
    const isVIP = await isVIPUser(userId);
    const channelOK = await checkChannelSubscription(userId);
    
    let startMessage = `${getEmoji('hand')} <b>Salom ♪</b>\n\n`;
    startMessage += `Kino botga xush kelibsiz!\n\n`;
    startMessage += `<b>📚 Buyruqlar:</b>\n`;
    startMessage += `/rand - ${getEmoji('film')} Random kino\n`;
    startMessage += `/vip - ${getEmoji('premium')} Premium\n`;
    startMessage += `/help - ${getEmoji('support')} Qo'llab-quvvatlash\n`;
    startMessage += `/dev - 🧑‍💻 Dasturchi\n\n`;
    startMessage += `🍿 <b>Kino kodi yuboring:</b>\n\n`;
    
    if (isVIP) {
      startMessage += `${getEmoji('diamond')} <b>Premium Obuna Faol!</b>`;
    }
    
    if (!channelOK) {
      startMessage += `\n\n⚠️ <b>Avval kanalga obuna bo'ling:</b>`;
    }
    
    await ctx.replyWithHTML(
      startMessage,
      Markup.inlineKeyboard([
        ...(channelOK ? [] : [[Markup.button.callback('✅ Tekshirish', 'check_subscription')]]),
        [Markup.button.url(`${getEmoji('support')} Support`, `https://t.me/x7fan`)]
      ])
    );
  } catch (err) {
    console.error('Start error:', err);
    ctx.reply('❌ Xatolik! Admin bilan bog\'laning.');
  }
});

// ========================
// OBUNA TEKSHIR
// ========================

bot.action('check_subscription', async (ctx) => {
  try {
    const channelOK = await checkChannelSubscription(ctx.from.id);
    
    if (channelOK) {
      const user = await User.findOne({ userId: ctx.from.id });
      if (user) {
        user.subscribed = true;
        await user.save();
      }
      
      await ctx.editMessageText(
        `${getEmoji('check')} <b>Obuna tasdiqlandi!</b>`,
        Markup.inlineKeyboard([
          [Markup.button.callback('${getEmoji(\'hand\')} Davom etish', 'continue_main')]
        ])
      );
    } else {
      await ctx.editMessageText(
        `${getEmoji('warning')} <b>Siz hali kanalga obuna bo\'lmagansiz!</b>\n\n` +
        `Avval kanalga obuna bo\'ling, keyin qayta tekshir.`
      );
    }
    
    ctx.answerCbQuery();
  } catch (err) {
    console.error('Subscription check error:', err);
    ctx.answerCbQuery('Xatolik!');
  }
});

// ========================
// VIP COMMAND - PREMIUM EMOJIS
// ========================

bot.command('vip', async (ctx) => {
  try {
    const user = await User.findOne({ userId: ctx.from.id });
    const config = await Config.findOne();
    const prices = config ? config.vipPrices : { 
      '1month': 10000, 
      '3month': 25000, 
      '1year': 75000 
    };
    
    let vipMessage = `<b>${getEmoji('premium')} PREMIUM obunasi nima uchun kerak?</b>\n\n`;
    vipMessage += `${getEmoji('warning')} Kanallarga obuna bo'lish shart emas.\n`;
    vipMessage += `${getEmoji('back')} Hech qanday reklamasi.\n`;
    vipMessage += `${getEmoji('film')} Sifatli kinolar.\n`;
    vipMessage += `${getEmoji('diamond')} Premium kinolar.\n\n`;
    
    if (user && user.vip.active) {
      vipMessage += `${getVIPStatusMessage(user)}\n\n`;
    }
    
    vipMessage += `<b>Paket tanlang:</b>`;
    
    await ctx.replyWithHTML(
      vipMessage,
      Markup.inlineKeyboard([
        [Markup.button.callback(`1 oylik - ${prices['1month']} so'm`, 'vip_1m')],
        [Markup.button.callback(`3 oylik - ${prices['3month']} so'm`, 'vip_3m')],
        [Markup.button.callback(`1 yilik - ${prices['1year']} so'm`, 'vip_1y')]
      ])
    );
  } catch (err) {
    console.error('VIP error:', err);
    ctx.reply('❌ Xatolik!');
  }
});

// ========================
// VIP TANLASH
// ========================

bot.action(/vip_(.+)/, async (ctx) => {
  try {
    const planType = ctx.match[1];
    const plans = {
      '1m': { name: '1 oylik', price: 10000 },
      '3m': { name: '3 oylik', price: 25000 },
      '1y': { name: '1 yilik', price: 75000 }
    };
    
    const plan = plans[planType];
    
    let paymentMessage = `<b>${getEmoji('card')} To'lov usuli tanlang</b>\n\n`;
    paymentMessage += `<b>Plan:</b> ${plan.name}\n`;
    paymentMessage += `<b>${getEmoji('money')} Narx:</b> ${plan.price} so'm\n\n`;
    
    await ctx.editMessageText(
      paymentMessage,
      Markup.inlineKeyboard([
        [
          Markup.button.callback(`${getEmoji('check')} Sotib olish`, `buy_${planType}`),
          Markup.button.callback(`💬 Sovdalashish`, `nego_${planType}`)
        ],
        [Markup.button.callback(`${getEmoji('back')} Orqaga`, 'vip')]
      ])
    );
    
    ctx.answerCbQuery();
  } catch (err) {
    console.error('VIP action error:', err);
    ctx.answerCbQuery('❌ Xatolik!');
  }
});

// ========================
// SOTIB OLISH
// ========================

bot.action(/buy_(.+)/, async (ctx) => {
  try {
    const planType = ctx.match[1];
    const plans = {
      '1m': { name: '1 oylik', price: 10000, days: 30 },
      '3m': { name: '3 oylik', price: 25000, days: 90 },
      '1y': { name: '1 yilik', price: 75000, days: 365 }
    };
    
    const plan = plans[planType];
    ctx.session.vip = { plan: planType, ...plan };
    
    let buyMessage = `🛒 <b>Sotib olish</b>\n\n`;
    buyMessage += `<b>${getEmoji('money')} Narx:</b> ${plan.price} so'm\n`;
    buyMessage += `<b>${getEmoji('clock')} Muddati:</b> ${plan.name}\n\n`;
    buyMessage += `${getEmoji('check')} To'lovni tasdiqlash tugatildi deb hisoblanadi.`;
    
    await ctx.editMessageText(
      buyMessage,
      Markup.inlineKeyboard([
        [Markup.button.callback(`✅ To'lovni tasdiqlash`, `confirm_${planType}`)],
        [Markup.button.callback(`${getEmoji('back')} Orqaga`, 'vip')]
      ])
    );
    
    ctx.answerCbQuery();
  } catch (err) {
    console.error('Buy error:', err);
    ctx.answerCbQuery('❌ Xatolik!');
  }
});

// ========================
// TO'LOV TASDIQLASH
// ========================

bot.action(/confirm_(.+)/, async (ctx) => {
  try {
    const planType = ctx.match[1];
    const plans = {
      '1m': { plan: '1month', days: 30, price: 10000 },
      '3m': { plan: '3month', days: 90, price: 25000 },
      '1y': { plan: '1year', days: 365, price: 75000 }
    };
    
    const planData = plans[planType];
    const user = await User.findOne({ userId: ctx.from.id });
    
    if (!user) {
      return ctx.answerCbQuery('User topilmadi!');
    }
    
    // VIP faollashtirish
    user.vip.active = true;
    user.vip.plan = planData.plan;
    user.vip.price = planData.price;
    user.vip.method = 'click'; // yoki payme
    user.vip.startDate = new Date();
    user.vip.endDate = new Date(Date.now() + planData.days * 24 * 60 * 60 * 1000);
    user.vip.isPremium = true;
    
    // Payment history
    user.payments.push({
      amount: planData.price,
      method: 'click',
      status: 'completed',
      date: new Date(),
      plan: planData.plan
    });
    
    await user.save();
    
    let confirmMessage = `${getEmoji('check')} <b>Premium Faollashtirildi!</b>\n\n`;
    confirmMessage += `${getEmoji('diamond')} <b>Siz Premium obunali bo'ldingiz!</b>\n`;
    confirmMessage += `${getEmoji('clock')} Tugash sanasi: ${user.vip.endDate.toLocaleDateString('uz-UZ')}\n\n`;
    confirmMessage += `Barcha premium kinolarni ko'rishingiz mumkin!`;
    
    await ctx.editMessageText(
      confirmMessage,
      Markup.inlineKeyboard([
        [Markup.button.callback(`${getEmoji('film')} Kinolarni ko'rish`, 'show_movies')]
      ])
    );
    
    ctx.answerCbQuery('✅ Premium faollashtirildi!');
  } catch (err) {
    console.error('Confirm error:', err);
    ctx.answerCbQuery('❌ Xatolik!');
  }
});

// ========================
// SOVDALASHISH (NEGOTIATION)
// ========================

bot.action(/nego_(.+)/, async (ctx) => {
  try {
    const planType = ctx.match[1];
    ctx.session.negotiation = { planType, offers: [] };
    
    let negoMessage = `💬 <b>Sovdalashish boshlandi!</b>\n\n`;
    negoMessage += `Qancha pul bermoqchisiz? (raqam yuboring)\n\n`;
    negoMessage += `💡 Min narx: 7,000 so'm`;
    
    await ctx.editMessageText(
      negoMessage,
      Markup.inlineKeyboard([
        [Markup.button.callback(`${getEmoji('back')} Orqaga`, 'vip')]
      ])
    );
    
    ctx.answerCbQuery();
  } catch (err) {
    console.error('Negotiation error:', err);
    ctx.answerCbQuery('❌ Xatolik!');
  }
});

// ========================
// RANDOM KINO
// ========================

bot.command('rand', async (ctx) => {
  try {
    const isVIP = await isVIPUser(ctx.from.id);
    
    const movie = await Movie.aggregate([
      { $match: { active: true } },
      { $sample: { size: 1 } }
    ]);
    
    if (!movie.length) {
      return ctx.reply('Hozircha kinolar yo\'q 😔');
    }
    
    const m = movie[0];
    
    // Premium film tekshir
    if (m.premiumOnly && !isVIP) {
      return await ctx.replyWithHTML(
        `<b>${getEmoji('diamond')} Bu kino faqat Premium uchun!</b>\n\n` +
        `<b>${m.name}</b> - ${m.year}\n\n` +
        `Premium obunani olib, barcha kinolarni ko'ring!`,
        Markup.inlineKeyboard([
          [Markup.button.callback(`${getEmoji('premium')} Premium olish`, 'vip')]
        ])
      );
    }
    
    let movieMessage = `<b>${getEmoji('film')} ${m.name}</b>\n\n`;
    movieMessage += `📅 Yili: ${m.year}\n`;
    movieMessage += `${getEmoji('star')} Reyting: ${m.rating || 'N/A'}/10\n`;
    movieMessage += `🎭 Janri: ${m.genre?.join(', ') || 'N/A'}\n`;
    movieMessage += `${getEmoji('clock')} Davomiyligi: ${m.duration || 'N/A'} min\n\n`;
    movieMessage += `${m.description || 'Tavsif yo\'q'}\n\n`;
    movieMessage += `<b>Kod:</b> <code>${m.code}</code>`;
    
    await ctx.replyWithHTML(
      movieMessage,
      Markup.inlineKeyboard([
        [Markup.button.url(`${getEmoji('check')} Ko'rish`, m.video)],
        [Markup.button.callback(`${getEmoji('heart')} Saqlash`, `save_${m._id}`)]
      ])
    );
    
    m.views = (m.views || 0) + 1;
    await m.save();
  } catch (err) {
    console.error('Random error:', err);
    ctx.reply('❌ Xatolik!');
  }
});

// ========================
// HELP VA DEV
// ========================

bot.command('help', async (ctx) => {
  await ctx.replyWithHTML(
    `<b>${getEmoji('support')} Qo'llab-quvvatlash</b>\n\n` +
    `Savollar uchun support:`,
    Markup.inlineKeyboard([
      [Markup.button.url(`${getEmoji('hand')} Support`, `https://t.me/x7fan`)]
    ])
  );
});

bot.command('dev', async (ctx) => {
  await ctx.replyWithHTML(
    `<b>🧑‍💻 Dasturchi</b>\n\n` +
    `Bot haqida savollar va taklif:`,
    Markup.inlineKeyboard([
      [Markup.button.url('💬 Developer', `https://t.me/x7fan`)]
    ])
  );
});

// ========================
// ERROR HANDLER
// ========================

bot.catch((err, ctx) => {
  console.error('Bot error:', err);
});

// ========================
// LAUNCH
// ========================

bot.launch();
console.log('🤖 Bot ishga tushdi!');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
