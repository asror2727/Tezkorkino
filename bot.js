const { Telegraf, Markup, session } = require('telegraf');
const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Movie = require('./models/Movie');
const Config = require('./models/Config');

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
// START
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
    
    await ctx.replyWithHTML(
      `<b>👋 Salom ♪</b>\n\n` +
      `Kino botga xush kelibsiz!\n\n` +
      `<b>📚 Buyruqlar:</b>\n` +
      `/rand - 🔄 Random kino\n` +
      `/vip - 💎 Premium\n` +
      `/help - ☎️ Qo'llab-quvvatlash\n` +
      `/dev - 🧑‍💻 Dasturchi\n\n` +
      `🍿 <b>Kino kodi yuboring:</b>`,
      Markup.inlineKeyboard([
        [Markup.button.url('📞 Support', `https://t.me/x7fan`)]
      ])
    );
  } catch (err) {
    console.error('Start error:', err);
    ctx.reply('Xatolik! Admin bilan bog\'laning.');
  }
});

// ========================
// VIP COMMAND - TUGMALAR BILAN
// ========================

bot.command('vip', async (ctx) => {
  try {
    const config = await Config.findOne();
    const prices = config ? config.vipPrices : { 
      '1month': 10000, 
      '3month': 25000, 
      '1year': 75000 
    };
    
    await ctx.replyWithHTML(
      `<b>💎 PREMIUM obunasi nima uchun kerak?</b>\n\n` +
      `⚠️ Kanallarga obuna bo'lish shart emas\n` +
      `🚫 Hech qanday reklamasi\n` +
      `🎞️ Sifatli kinolar\n` +
      `💎 Premium kinolar\n\n` +
      `<b>Paket tanlang:</b>`,
      Markup.inlineKeyboard([
        [Markup.button.callback(`1 oylik - ${prices['1month']} so'm`, 'vip_1m')],
        [Markup.button.callback(`3 oylik - ${prices['3month']} so'm`, 'vip_3m')],
        [Markup.button.callback(`1 yilik - ${prices['1year']} so'm`, 'vip_1y')]
      ])
    );
  } catch (err) {
    console.error('VIP error:', err);
  }
});

// ========================
// VIP TANLASH - ACTIONLAR
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
    
    await ctx.editMessageText(
      `<b>💳 To'lov usuli tanlang</b>\n\n` +
      `<b>Plan:</b> ${plan.name}\n` +
      `<b>Narx:</b> ${plan.price} so'm\n\n`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback('🛒 Sotib olish', `buy_${planType}`),
          Markup.button.callback('💬 Sovdalashish', `nego_${planType}`)
        ],
        [Markup.button.callback('◀️ Orqaga', 'vip')]
      ])
    );
    
    ctx.answerCbQuery();
  } catch (err) {
    console.error('VIP action error:', err);
  }
});

// ========================
// SOTIB OLISH ACTION
// ========================

bot.action(/buy_(.+)/, async (ctx) => {
  try {
    const planType = ctx.match[1];
    const plans = {
      '1m': 10000,
      '3m': 25000,
      '1y': 75000
    };
    
    await ctx.editMessageText(
      `🛒 <b>Sotib olish</b>\n\n` +
      `Narx: <b>${plans[planType]} so'm</b>\n\n` +
      `💳 To'lov usuli:\n\n` +
      `(Hozircha demo mode - Click/Payme integration kerak)`,
      Markup.inlineKeyboard([
        [Markup.button.callback('✅ To\'lovni tasdiqlash', `confirm_${planType}`)],
        [Markup.button.callback('◀️ Orqaga', 'vip')]
      ])
    );
    
    ctx.answerCbQuery();
  } catch (err) {
    console.error('Buy action error:', err);
  }
});

// ========================
// SOVDALASHISH ACTION
// ========================

bot.action(/nego_(.+)/, async (ctx) => {
  try {
    await ctx.editMessageText(
      `💬 <b>Sovdalashish boshlandi!</b>\n\n` +
      `Qancha pul bermoqchisiz? (raqam yuboring)\n\n` +
      `💡 Min narx: 7,000 so'm`,
      Markup.inlineKeyboard([
        [Markup.button.callback('◀️ Orqaga', 'vip')]
      ])
    );
    
    ctx.answerCbQuery();
  } catch (err) {
    console.error('Negotiation action error:', err);
  }
});

// ========================
// RANDOM KINO
// ========================

bot.command('rand', async (ctx) => {
  try {
    const movie = await Movie.aggregate([
      { $match: { active: true } },
      { $sample: { size: 1 } }
    ]);
    
    if (!movie.length) {
      return ctx.reply('Hozircha kinolar yo\'q 😔');
    }
    
    const m = movie[0];
    
    await ctx.replyWithHTML(
      `<b>🎬 ${m.name}</b>\n\n` +
      `📅 Yili: ${m.year}\n` +
      `⭐ Reyting: ${m.rating || 'N/A'}/10\n` +
      `🎭 Janri: ${m.genre?.join(', ') || 'N/A'}\n` +
      `⏱️ Davomiyligi: ${m.duration || 'N/A'} min\n\n` +
      `${m.description || 'Tavsif yo\'q'}\n\n` +
      `<b>Kod:</b> <code>${m.code}</code>`,
      Markup.inlineKeyboard([
        [Markup.button.url('▶️ Ko\'rish', m.video)],
        [Markup.button.callback('❤️ Saqlash', `save_${m._id}`)]
      ])
    );
    
    m.views = (m.views || 0) + 1;
    await m.save();
  } catch (err) {
    console.error('Random error:', err);
    ctx.reply('Xatolik!');
  }
});

// ========================
// TEXT HANDLER - KINO QIDIRISH
// ========================

bot.on('text', async (ctx) => {
  try {
    const query = ctx.message.text;
    
    if (query.startsWith('/')) return;
    
    const movie = await Movie.findOne({
      $or: [
        { code: query },
        { name: { $regex: query, $options: 'i' } }
      ],
      active: true
    });
    
    if (!movie) {
      return ctx.reply('🔍 Kino topilmadi!');
    }
    
    await ctx.replyWithHTML(
      `<b>🎬 ${movie.name}</b>\n\n` +
      `${movie.description || 'Tavsif yo\'q'}`,
      Markup.inlineKeyboard([
        [Markup.button.url('▶️ Ko\'rish', movie.video)]
      ])
    );
    
    movie.views = (movie.views || 0) + 1;
    await movie.save();
  } catch (err) {
    console.error('Text error:', err);
  }
});

// ========================
// HELP
// ========================

bot.command('help', async (ctx) => {
  await ctx.replyWithHTML(
    `<b>☎️ Qo'llab-quvvatlash</b>\n\n` +
    `Savollar uchun:`,
    Markup.inlineKeyboard([
      [Markup.button.url('📞 Support', 'https://t.me/x7fan')]
    ])
  );
});

bot.command('dev', async (ctx) => {
  await ctx.replyWithHTML(
    `<b>🧑‍💻 Dasturchi</b>`,
    Markup.inlineKeyboard([
      [Markup.button.url('💬 Developer', 'https://t.me/x7fan')]
    ])
  );
});

// ========================
// ERROR HANDLER
// ========================

bot.catch((err, ctx) => {
  console.error('Bot xatosi:', err);
});

// ========================
// LAUNCH
// ========================

bot.launch();
console.log('🤖 Bot ishga tushdi!');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
