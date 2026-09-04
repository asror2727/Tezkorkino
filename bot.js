const { Telegraf, Markup, session } = require('telegraf');
const mongoose = require('mongoose');
require('dotenv').config();

// Modellar
const User = require('./models/User');
const Movie = require('./models/Movie');
const Config = require('./models/Config');
const Stats = require('./models/Stats');

const bot = new Telegraf(process.env.BOT_TOKEN);

// Session middleware
bot.use(session());

// MongoDB ulash
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB ulandi'))
  .catch(err => console.log('❌ MongoDB xatosi:', err));

// ========================
// EMOJI IDLARI
// ========================
const EMOJI = {
  user: '5271829423899845716',
  hand: '5271765841203995324',
  money: '5271857409906745357',
  support: '5271586238556574482',
  id: '5271628651358622439',
  back: '5271512047291507931',
  clap: '5271857014769754460',
  search: '5272013068111485452',
  dollar: '5271739719212901906',
  card: '5271907450570709756',
  warning: '5271535227230028862',
  check: '5271507881173227410'
};

// ========================
// UTILITY FUNKSIYALAR
// ========================

async function checkChannelSubscription(userId, channelIds) {
  for (let channelId of channelIds) {
    try {
      const member = await bot.telegram.getChatMember(channelId, userId);
      if (member.status === 'left' || member.status === 'kicked') {
        return false;
      }
    } catch (err) {
      return false;
    }
  }
  return true;
}

async function getStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let stats = await Stats.findOne({ date: today });
  if (!stats) {
    stats = new Stats({ date: today });
  }
  
  stats.totalUsers = await User.countDocuments();
  stats.vipUsers = await User.countDocuments({ 'vip.active': true });
  stats.subscribedUsers = await User.countDocuments({ subscribed: true });
  
  return stats;
}

// ========================
// /START BUYRUG'I
// ========================

bot.start(async (ctx) => {
  try {
    const userId = ctx.from.id;
    const username = ctx.from.username || ctx.from.first_name;
    
    // Foydalanuvchini saqlash yoki yangilash
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
    
    // Xush kelibsiz xabari
    await ctx.replyWithHTML(
      `<b>👋 Salom ♪</b>\n\n` +
      `Kino botga xush kelibsiz!\n\n` +
      `<b>📚 Buyruqlar:</b>\n` +
      `/rand - 🔄 Random kino\n` +
      `/top - 🏆 Top kino\n` +
      `/last - 📽️ Oxirgi yuklangan\n` +
      `/help - ☎️ Qo'llab-quvvatlash\n` +
      `/vip - 💎 Premium\n` +
      `/dev - 🧑‍💻 Dasturchi\n\n` +
      `🍿 <b>Kino kodi yoki nomini yuboring:</b>`,
      Markup.inlineKeyboard([
        [Markup.button.callback('🔍 Kod kiritish', 'search_movie')],
        [Markup.button.url('📞 Support', `https://t.me/${process.env.SUPPORT_USERNAME || 'support'}`)]
      ])
    );
  } catch (err) {
    console.log('Start xatosi:', err);
  }
});

// ========================
// OBUNA TEKSHIR
// ========================

bot.action('check_subscription', async (ctx) => {
  try {
    const config = await Config.findOne();
    if (!config || !config.requiredChannels.length) {
      return ctx.answerCbQuery('Kanallar tayin qilinmagan');
    }
    
    const channelIds = config.requiredChannels.map(c => c.channelId);
    const isSubscribed = await checkChannelSubscription(ctx.from.id, channelIds);
    
    if (isSubscribed) {
      const user = await User.findOne({ userId: ctx.from.id });
      user.subscribed = true;
      user.subscribedChannels = channelIds;
      user.subscribeDate = new Date();
      await user.save();
      
      await ctx.editMessageText('✅ Tekshirish tugallandi! Siz obuna bo\'ldingiz.');
      ctx.answerCbQuery('Saqlandi!');
    } else {
      await ctx.editMessageText('❌ Siz hali ham kanalga obuna bo\'lmagansiz!');
      ctx.answerCbQuery('Iltimos, kanalga obuna bo\'ling');
    }
  } catch (err) {
    console.log('Subscription check xatosi:', err);
    ctx.answerCbQuery('Xatolik yuz berdi');
  }
});

// ========================
// VIP BUYRUG'I
// ========================

bot.command('vip', async (ctx) => {
  try {
    const config = await Config.findOne();
    const prices = config ? config.vipPrices : { '1month': 10000, '3month': 25000, '1year': 75000 };
    
    await ctx.replyWithHTML(
      `<b>💎 PREMIUM obunasi nima uchun kerak?</b>\n\n` +
      `⚠️ • Kanallarga obuna bo'lish shart emas.\n` +
      `🚫 • Hech qanday reklamalarsiz.\n` +
      `🎞️ • Kerakli kinolar sifatli formatda.\n` +
      `💎 • Premium kinolarni ko'rish imkoniyati.\n\n` +
      `<b>📌 Ta'rif tanlang:</b>`,
      Markup.inlineKeyboard([
        [Markup.button.callback(`1 oylik - ${prices['1month']} so'm`, 'vip_1month')],
        [Markup.button.callback(`3 oylik - ${prices['3month']} so'm`, 'vip_3month')],
        [Markup.button.callback(`1 yilik - ${prices['1year']} so'm`, 'vip_1year')]
      ])
    );
  } catch (err) {
    console.log('VIP buyrug'i xatosi:', err);
  }
});

// ========================
// VIP TANLASH
// ========================

bot.action(/vip_(.+)/, async (ctx) => {
  try {
    const plan = ctx.match[1];
    const config = await Config.findOne();
    const price = config.vipPrices[plan];
    
    const planNames = {
      '1month': '1 oylik',
      '3month': '3 oylik',
      '1year': '1 yilik'
    };
    
    ctx.session.vip = { plan, price };
    
    // Jinsiyat so'rash
    await ctx.editMessageText(
      `<b>👥 Siz qaysi?</b>\n\n` +
      `(Sovdalashish va dizayn uchun kerak)`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback('🧒 O\'g\'il bola', 'gender_male'),
          Markup.button.callback('👧 Qiz bola', 'gender_female')
        ],
        [Markup.button.callback('◀️ Orqaga', 'back_main')]
      ])
    );
    
    ctx.answerCbQuery();
  } catch (err) {
    console.log('VIP tanlash xatosi:', err);
  }
});

// ========================
// JINSIYAT TANLASH
// ========================

bot.action(/gender_(.+)/, async (ctx) => {
  try {
    const gender = ctx.match[1];
    const user = await User.findOne({ userId: ctx.from.id });
    if (user) {
      user.gender = gender;
      await user.save();
    }
    
    const config = await Config.findOne();
    const { plan, price } = ctx.session.vip;
    
    const planNames = {
      '1month': '1 oylik',
      '3month': '3 oylik',
      '1year': '1 yilik'
    };
    
    // To'lov usuli tanlash
    await ctx.editMessageText(
      `<b>💳 To'lov usulini tanlang</b>\n\n` +
      `<b>Plan:</b> ${planNames[plan]}\n` +
      `<b>Narx:</b> ${price} so'm\n\n`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback('🛒 Sotib olish', `payment_buy_${plan}`),
          Markup.button.callback('💬 Sovdalashish', `payment_negotiate_${plan}`)
        ],
        [Markup.button.callback('◀️ Orqaga', 'back_main')]
      ])
    );
    
    ctx.answerCbQuery();
  } catch (err) {
    console.log('Jinsiyat tanlash xatosi:', err);
  }
});

// ========================
// SOTIB OLISH (KARTA)
// ========================

bot.action(/payment_buy_(.+)/, async (ctx) => {
  try {
    const plan = ctx.match[1];
    const config = await Config.findOne();
    const price = config.vipPrices[plan];
    
    const paymentMethods = [];
    
    if (config.paymentMethods.click.enabled) {
      paymentMethods.push(
        Markup.button.callback('Click 💳', `pay_click_${plan}`)
      );
    }
    if (config.paymentMethods.payme.enabled) {
      paymentMethods.push(
        Markup.button.callback('Payme 📱', `pay_payme_${plan}`)
      );
    }
    if (config.paymentMethods.hazna.enabled) {
      paymentMethods.push(
        Markup.button.callback('Hazna 🏦', `pay_hazna_${plan}`)
      );
    }
    
    // Jinsiyat bo'yicha javob
    const genderResponses = {
      'erkak': {
        emoji: '🧒',
        text: 'Ey bro! 💪'
      },
      'ayol': {
        emoji: '👧',
        text: 'Opa, singim! ❤️'
      }
    };
    
    const userResp = genderResponses[ctx.session.vip?.gender] || { emoji: '👤', text: 'Bro!' };
    
    await ctx.editMessageText(
      `${userResp.emoji} ${userResp.text}\n\n` +
      `🛒 <b>Sotib olish</b>\n\n` +
      `Narx: <b>${price} so'm</b>\n\n` +
      `<b>📌 To'lov usuli tanlang:</b>`,
      Markup.inlineKeyboard([
        paymentMethods,
        [Markup.button.callback('◀️ Orqaga', 'back_main')]
      ])
    );
    
    ctx.answerCbQuery();
  } catch (err) {
    console.log('Sotib olish xatosi:', err);
  }
});

// ========================
// SOVDALASHISH (NEGOTIATION)
// ========================

bot.action(/payment_negotiate_(.+)/, async (ctx) => {
  try {
    const plan = ctx.match[1];
    const config = await Config.findOne();
    const originalPrice = config.vipPrices[plan];
    
    const planNames = {
      '1month': '1 oylik',
      '3month': '3 oylik',
      '1year': '1 yilik'
    };
    
    // Sovdalashish konteksti saqla
    ctx.session.negotiation = {
      plan,
      originalPrice,
      minPrice: Math.floor(originalPrice * 0.65),
      maxPrice: originalPrice,
      offers: [],
      gender: ctx.session.vip?.gender || 'unknown'
    };
    
    await ctx.editMessageText(
      `<b>💬 Sovdalashish boshlandi!</b>\n\n` +
      `<b>Original narx:</b> ${originalPrice} so'm\n` +
      `<b>Plan:</b> ${planNames[plan]}\n\n` +
      `Qancha pul bermoqchisiz? (raqam yuboring)\n\n` +
      `💡 <i>Min narx: ${ctx.session.negotiation.minPrice} so'm</i>`
    );
    
    ctx.answerCbQuery();
  } catch (err) {
    console.log('Sovdalashish xatosi:', err);
  }
});

// ========================
// SOVDALASHISH RESPONSE
// ========================

bot.hears(/^\d+$/, async (ctx) => {
  try {
    if (!ctx.session?.negotiation) return;
    
    const userOffer = parseInt(ctx.message.text);
    const negotiation = ctx.session.negotiation;
    const { originalPrice, minPrice, maxPrice, gender } = negotiation;
    
    // Jinsiyat bo'yicha javoblar
    const maleResponses = [
      `Ey brodar, ${userOffer} to'rtmidi? 😅 Man ${Math.floor(originalPrice * 0.85)} diman!`,
      `${userOffer}? Biroz kam bro! 🤔 Min ${Math.floor(originalPrice * 0.8)} qil?`,
      `Ey, yerga urvordizmi? 😂 ${userOffer}? Hech xohlamas! ${Math.floor(originalPrice * 0.85)} qil bro!`,
      `Akam, ${userOffer}? Lekin bombii ${Math.floor(originalPrice * 0.75)} qlin oka! 💪`,
      `Bro, siz juda kamga olmoqchisiz! 📉 Men ${Math.floor(originalPrice * 0.8)} dan past qilmaman!`
    ];
    
    const femaleResponses = [
      `Opa, ${userOffer}? 😅 Men ${Math.floor(originalPrice * 0.85)} so'm qsam?`,
      `${userOffer} turkimi? Biroz kam singim! 🙁 ${Math.floor(originalPrice * 0.8)} bo'lsa?`,
      `Singim, yerga urvordizmi? 😂 ${userOffer}? Yoqdi keyin! ${Math.floor(originalPrice * 0.85)} so'm!`,
      `Opa, ${userOffer}? Boshqa qilsam? ${Math.floor(originalPrice * 0.75)} so'm? 💕`,
      `Singim, siz juda arzonni istaysiz! 📉 ${Math.floor(originalPrice * 0.8)} dan past qila olmayman!`
    ];
    
    const responses = gender === 'ayol' ? femaleResponses : maleResponses;
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    
    // Bot taklifi
    const botCounterOffer = Math.floor(originalPrice * (0.75 + Math.random() * 0.1));
    
    negotiation.offers.push({
      userOffer,
      botCounterOffer,
      time: new Date()
    });
    
    // 5 ta taklif bo'lsa, kelishmasliq deb qabul qil
    if (negotiation.offers.length >= 5) {
      return await ctx.reply(
        `❌ <b>Kelishmaolmadik! 😔</b>\n\n` +
        `Original narx: <b>${originalPrice} so'm</b>\n` +
        `Sizning taklifingiz: <b>${userOffer} so'm</b>\n` +
        `Farq: ${originalPrice - userOffer} so'm\n\n` +
        `Boshqa samanumizni ko'ramiz? /help`,
        Markup.inlineKeyboard([
          [Markup.button.callback('◀️ VIP ga orqaga', 'vip')]
        ])
      );
    }
    
    // Bot javobini kul-soz bilan yubor
    await ctx.reply(
      randomResponse,
      Markup.inlineKeyboard([
        [
          Markup.button.callback(
            `✅ ${botCounterOffer} so'm kelisdim!`,
            `negotiate_accept_${plan}_${botCounterOffer}`
          )
        ],
        [Markup.button.callback('🔄 Yana taklif qilish', 'reoffer')],
        [Markup.button.callback('❌ Bekor qilish', 'cancel_negotiate')]
      ])
    );
  } catch (err) {
    console.log('Text xatosi:', err);
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
      `⭐ Reyting: ${m.rating}/10\n` +
      `🎭 Janri: ${m.genre.join(', ')}\n` +
      `⏱️ Davomiyligi: ${m.duration} min\n\n` +
      `${m.description || 'Tavsif yo\'q'}\n\n` +
      `<b>Kod:</b> <code>${m.code}</code>`,
      Markup.inlineKeyboard([
        [
          Markup.button.callback('➕ Ko\'proq', 'rand_more'),
          Markup.button.callback('💾 Saqlash', `save_${m._id}`)
        ],
        [Markup.button.callback('✍️ Izoh', `note_${m._id}`)]
      ])
    );
    
    // Views yangilash
    m.views += 1;
    await Movie.updateOne({ _id: m._id }, { views: m.views });
  } catch (err) {
    console.log('Random kino xatosi:', err);
  }
});

// ========================
// KINO QIDIRISH
// ========================

bot.on('text', async (ctx) => {
  try {
    const query = ctx.message.text;
    
    // Buyruglarni o'tkazib yubor
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
    
    // VIP tekshir
    const user = await User.findOne({ userId: ctx.from.id });
    if (movie.premiumOnly && (!user || !user.vip.active)) {
      return ctx.replyWithHTML(
        `<b>💎 Bu kino faqat Premium obunalilarga ruxsat!</b>\n\n` +
        `<b>${movie.name}</b> - ${movie.year}\n\n` +
        `<b>Premium</b> obunani olib, barcha kinolarni ochib ko'ring!`,
        Markup.inlineKeyboard([
          [Markup.button.callback('💎 Premium olish', 'vip')]
        ])
      );
    }
    
    // Kino ko'rsat
    await ctx.replyWithHTML(
      `<b>🎬 ${movie.name}</b>\n\n` +
      `📅 Yili: ${movie.year}\n` +
      `⭐ Reyting: ${movie.rating}/10\n` +
      `🎭 Janri: ${movie.genre.join(', ')}\n` +
      `⏱️ Davomiyligi: ${movie.duration} min\n\n` +
      `${movie.description || 'Tavsif yo\'q'}`,
      Markup.inlineKeyboard([
        [
          Markup.button.url('▶️ Ko\'rish', movie.video),
          Markup.button.callback('💾 Saqlash', `save_${movie._id}`)
        ],
        [Markup.button.callback('✍️ Izoh', `note_${movie._id}`)]
      ])
    );
    
    // Stats yangilash
    movie.views += 1;
    await movie.save();
  } catch (err) {
    console.log('Qidirish xatosi:', err);
  }
});

// ========================
// HELP VA DEV
// ========================

bot.command('help', async (ctx) => {
  const config = await Config.findOne();
  await ctx.replyWithHTML(
    `<b>☎️ Qo'llab-quvvatlash</b>\n\n` +
    `Savollaringiz bo'lsa, support ga yozib qo'ying:`,
    Markup.inlineKeyboard([
      [Markup.button.url('📞 Support', `https://t.me/${config?.supportUsername || 'support'}`)]
    ])
  );
});

bot.command('dev', async (ctx) => {
  const config = await Config.findOne();
  await ctx.replyWithHTML(
    `<b>🧑‍💻 Dasturchi</b>\n\n` +
    `Bot haqida savollar va taklif:`,
    Markup.inlineKeyboard([
      [Markup.button.url('💬 Developer', `https://t.me/${config?.developerUsername || 'developer'}`)]
    ])
  );
});

// ========================
// ERROR HANDLING
// ========================

bot.catch((err, ctx) => {
  console.log('Bot xatosi:', err);
});

// ========================
// BOT ISHGA TUSHIRISH
// ========================

bot.launch();
console.log('🤖 Bot ishga tushdi!');

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
