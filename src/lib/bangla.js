/**
 * English → Bangla digit map
 * ০ ১ ২ ৩ ৪ ৫ ৬ ৭ ৮ ৯
 */
const EN_TO_BN = { '0':'০','1':'১','2':'২','3':'৩','4':'৪','5':'৫','6':'৬','7':'৭','8':'৮','9':'৯' }

/**
 * Convert any numeric string or number to Bangla numerals.
 * toBn(1250) → "১২৫০"
 * toBn("12.50") → "১২.৫০"
 */
export function toBn(value) {
  return String(value).replace(/[0-9]/g, d => EN_TO_BN[d])
}

/**
 * Format price in English: ৳12.50
 * Format price in Bangla: ৳১২.৫০
 */
export function fmtPrice(amount, isBn = false) {
  const formatted = parseFloat(amount).toFixed(2)
  return '৳' + (isBn ? toBn(formatted) : formatted)
}

/**
 * Format a weight in grams.
 * fmtGrams(250, true) → "২৫০ গ্রাম"
 * fmtGrams(250, false) → "250g"
 */
export function fmtGrams(grams, isBn = false) {
  if (isBn) return toBn(grams) + ' গ্রাম'
  return grams + 'g'
}

/**
 * Bangla UI string map — static labels used across the store.
 */
export const bn = {
  home: 'হোম',
  shop: 'দোকান',
  blog: 'ব্লগ',
  products: 'পণ্যসমূহ',
  allProducts: 'সকল পণ্য',
  viewAll: 'সব দেখুন',
  fromPrice: 'শুরু থেকে',
  sizes: 'সাইজ',
  chooseSize: 'সাইজ বেছে নিন',
  inStock: 'স্টকে আছে',
  outOfStock: 'স্টক শেষ',
  left: 'টি বাকি',
  shopNow: 'এখনই কিনুন',
  readBlog: 'ব্লগ পড়ুন',
  ourProducts: 'আমাদের পণ্য',
  freshStock: 'তাজা স্টক, একাধিক সাইজ উপলব্ধ',
  customerReviews: 'ক্রেতাদের মতামত',
  fromOurBlog: 'আমাদের ব্লগ থেকে',
  allPosts: 'সব পোস্ট',
  writeReview: 'মতামত লিখুন',
  yourRating: 'আপনার রেটিং',
  yourName: 'আপনার নাম',
  email: 'ইমেইল (ঐচ্ছিক)',
  comment: 'মন্তব্য',
  submitReview: 'মতামত পাঠান',
  submitting: 'পাঠানো হচ্ছে...',
  reviewThankYou: 'ধন্যবাদ!',
  reviewPending: 'আপনার মতামত পর্যালোচনার পর প্রকাশিত হবে।',
  backToProducts: 'পণ্যে ফিরে যান',
  backToBlog: 'ব্লগে ফিরে যান',
  searchProducts: 'পণ্য খুঁজুন...',
  onSale: 'ছাড়ে',
  off: '% ছাড়',
  youSave: 'আপনি সাশ্রয় করছেন',
  available: 'উপলব্ধ',
  noProductsFound: 'কোনো পণ্য পাওয়া যায়নি।',
  noBlogsFound: 'কোনো পোস্ট নেই।',
  by: 'লেখক',
  premiumQuality: 'সর্বোচ্চ মান',
  heroTitle1: 'প্রকৃতির সেরা',
  heroTitle2: 'বাদাম ও শুকনো ফল',
  heroSubtitle: 'হাতে বাছাই করা, প্রাকৃতিক উৎস থেকে সংগ্রহ, তাজা সরবরাহ। আমাদের প্রিমিয়াম পণ্য দিয়ে আপনার পুষ্টি উন্নত করুন।',
  nutritionBlog: 'পুষ্টি ও স্বাস্থ্য বিষয়ক টিপস, তথ্য ও গাইড',
  sizesAvailable: 'সাইজ উপলব্ধ',
}
