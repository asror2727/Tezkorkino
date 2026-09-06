// Premium Emoji ID's
// https://t.me/BotEmojisBot orqali olib olish mumkin

const EMOJIS = {
  // Emoji ID'lar
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
  check: '5271507881173227410',
  
  // Custom emojilar
  film: '5271923847563847102',
  star: '5271934857463857103',
  heart: '5271945867574968204',
  premium: '5271956878685079305',
  clock: '5271967889796180406',
  gift: '5271978900807291507',
  rocket: '5271989911918402608',
  fire: '5272000922029513709',
  diamond: '5272011933140624810',
  crown: '5272022944251735911'
};

// Regular emoji'lar (custom emoji bo'lmasa)
const REGULAR_EMOJIS = {
  user: '👤',
  hand: '👋',
  money: '💰',
  support: '📞',
  id: '🆔',
  back: '◀️',
  clap: '👏',
  search: '🔍',
  dollar: '💵',
  card: '💳',
  warning: '⚠️',
  check: '✅',
  film: '🎬',
  star: '⭐',
  heart: '❤️',
  premium: '💎',
  clock: '⏱️',
  gift: '🎁',
  rocket: '🚀',
  fire: '🔥',
  diamond: '💎',
  crown: '👑'
};

/**
 * Emoji olish - Premium yoki Regular
 * @param {string} key - Emoji kalit
 * @param {boolean} usePremium - Premium ID foydalanish
 * @returns {string} Emoji
 */
function getEmoji(key, usePremium = true) {
  if (usePremium && EMOJIS[key]) {
    return `${EMOJIS[key]}`;
  }
  return REGULAR_EMOJIS[key] || '';
}

/**
 * Emoji HTML format
 * @param {string} key - Emoji kalit
 * @param {boolean} usePremium - Premium ID foydalanish
 * @returns {string} HTML formatted emoji
 */
function formatEmoji(key, usePremium = true) {
  const emoji = getEmoji(key, usePremium);
  if (emoji.length > 10) {
    // Custom emoji ID
    return `<tg-emoji emoji-id="${emoji}">🎨</tg-emoji>`;
  }
  return emoji;
}

module.exports = {
  EMOJIS,
  REGULAR_EMOJIS,
  getEmoji,
  formatEmoji
};
