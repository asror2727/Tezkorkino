const { Telegraf, Markup, session } = require('telegraf');
const mongoose = require('mongoose');
require('dotenv').config();

// Modellar
const User = require('./models/User.js');
const Movie = require('./models/Movie.js');
const Config = require('./models/Config.js');
const Stats = require('./models/Stats.js');

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.use(session());

// MongoDB Connection
console.log('🔄 MongoDB ulanmoqda...');
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB ulandi!'))
  .catch(err => {
    console.error('❌ MongoDB xatosi:', err.message);
    process.exit(1);
  });

// ========================
// START COMMAND
// ========================

bot.start(async (ctx) => {
  try {
    const userId = ctx.from.id;
    const username = ctx.from.username || ctx.from.first_name;
    
    let user = await User.findOne({ userId });
    if (!user) {
      user = new User({
        userId,
        username,
        firstName: ctx.from.first_name,
        lastName: ctx.from.last_name,
        gender: 'unknown'
      });
      await user.save();
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
        [Markup.button.url('📞 Support', `https://t.me/${process.env.SUPPORT_USERNAME || 'support'}`)]
      ])
    );
  } catch (err) {
    console.error('Start error:', err);
  }
});

// ========================
// VIP COMMAND
// ========================

bot.command('vip', async (ctx) => {
  try {
    const config = await Config.findOne();
    const prices = config ? config.vipPrices : { '1month': 10000, '3month': 25000, '1year': 75000 };
    
    await ctx.replyWithHTML(
      `<b>💎 PREMIUM obunasi</b>\n\n` +
      `⚠️ • Kanallarga obuna bo'lish shart emas.\n` +
      `🚫 • Hech qanday reklamasi.\n` +
      `🎞️ • Sifatli kinolar.\n` +
      `💎 • Premium kinolar.\n\n`,
      Markup.inlineKeyboard([
        [Markup.button.callback(`1 oylik - ${prices['1month']} so'm`, 'vip_1month')],
        [Markup.button.callback(`3 oylik - ${prices['3month']} so'm`, 'vip_3month')],
        [Markup.button.callback(`1 yilik - ${prices['1year']} so'm`, 'vip_1year')]
      ])
    );
  } catch (err) {
    console.error('VIP error:', err);
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
      `📅 ${m.year}\n` +
      `⭐ ${m.rating}/10\n` +
      `🎭 ${m.genre.join(', ')}\n\n` +
      `Kod: <code>${m.code}</code>`,
      Markup.inlineKeyboard([
        [Markup.button.url('▶️ Ko\'rish', m.video)]
      ])
    );
  } catch (err) {
    console.error('Random error:', err);
  }
});

// ========================
// HELP COMMAND
// ========================

bot.command('help', async (ctx) => {
  await ctx.replyWithHTML(
    `<b>☎️ Qo'llab-quvvatlash</b>\n\n` +
    `Savollar uchun contact:`,
    Markup.inlineKeyboard([
      [Markup.button.url('📞 Support', `https://t.me/${process.env.SUPPORT_USERNAME || 'support'}`)]
    ])
  );
});

bot.command('dev', async (ctx) => {
  await ctx.replyWithHTML(
    `<b>🧑‍💻 Dasturchi</b>`,
    Markup.inlineKeyboard([
      [Markup.button.url('💬 Dev', `https://t.me/${process.env.DEVELOPER_USERNAME || 'developer'}`)]
    ])
  );
});

// ========================
// TEXT HANDLER
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
      return ctx.reply('Kino topilmadi 🔍');
    }
    
    await ctx.replyWithHTML(
      `<b>🎬 ${movie.name}</b>\n\n` +
      `${movie.description || 'Tavsif yo\'q'}`,
      Markup.inlineKeyboard([
        [Markup.button.url('▶️ Ko\'rish', movie.video)]
      ])
    );
    
    movie.views += 1;
    await movie.save();
  } catch (err) {
    console.error('Text error:', err);
  }
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
