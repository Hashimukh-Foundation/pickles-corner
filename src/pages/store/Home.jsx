import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { Link } from 'react-router-dom'
import { ArrowRight, Star, ShoppingCart } from 'lucide-react'
import { getBestDiscount, getFinalPrice, getOriginalPrice } from '../../lib/pricing'
import { useLang } from '../../lib/lang'
import { bn as BN, toBn } from '../../lib/bangla'
import { useCart } from '../../lib/cart'
import toast from 'react-hot-toast'

function ProductCard({ product }) {
  const { isBn, t } = useLang()
  const { addItem } = useCart()
  const sizes = product.product_sizes ?? []
  const bestDiscount = getBestDiscount(sizes)

  const cheapestSize = sizes
    .filter(s => s.stock_quantity > 0)
    .sort((a, b) => getFinalPrice(a, product.price) - getFinalPrice(b, product.price))[0]

  const minFinalPrice = sizes.length
    ? sizes.reduce((min, s) => { const p = getFinalPrice(s, product.price); return p < min ? p : min }, Infinity)
    : product.price
  const minOriginalPrice = sizes.length
    ? sizes.reduce((min, s) => { const p = getOriginalPrice(s, product.price); return p < min ? p : min }, Infinity)
    : product.price

  const inStock = sizes.length ? sizes.some(s => s.stock_quantity > 0) : true;

  const handleAddToCart = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!cheapestSize) return
    addItem({
      cartKey: `${product.id}_${cheapestSize.id}`,
      productId: product.id,
      productName: product.name,
      productNameBn: product.name_bn || null,
      imageUrl: product.image_url || null,
      sizeId: cheapestSize.id,
      sizeGrams: cheapestSize.size_grams,
      unitPrice: getFinalPrice(cheapestSize, product.price),
      originalPrice: getOriginalPrice(cheapestSize, product.price),
    })
    toast.success(t('Added to cart!', 'কার্টে যোগ হয়েছে!'))
  }

  return (
    <div className={`bg-[#191715] border border-[#333333] hover:border-[#1F8B4D] transition-colors duration-300 flex flex-col group relative ${!inStock ? 'opacity-75' : ''}`}>
      
      <Link to={`/products/${product.id}`} className="block relative aspect-square overflow-hidden bg-[#201e1c]">
        {product.image_url ? (
          <img 
            src={product.image_url} 
            alt={t(product.name, product.name_bn)} 
            className={`object-cover w-full h-full transition-transform duration-500 opacity-90 ${inStock ? 'group-hover:scale-105 group-hover:opacity-100' : 'grayscale'}`} 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs uppercase tracking-widest font-bangla-sans">
            {t(product.name, product.name_bn)?.[0]}
          </div>
        )}

        <div className="absolute top-2 left-2 flex flex-col gap-2 z-10">
          {!inStock && (
            <span className="bg-black/80 text-white text-xs font-bold px-2 py-1 uppercase tracking-widest border border-red-900 font-bangla-sans">
              {t('Sold Out', 'স্টক আউট')}
            </span>
          )}
          {inStock && bestDiscount && (
            <span className="bg-[#C62020] text-white text-xs font-bold px-2 py-1 uppercase tracking-widest shadow-md font-bangla-sans">
              {t('SALE', 'অফার')} {isBn ? toBn(bestDiscount.discount_percent) : bestDiscount.discount_percent}% {t('OFF', 'ছাড়')}
            </span>
          )}
        </div>
      </Link>

      <div className="p-4 text-center flex flex-col flex-grow">
        {(product.category || product.category_bn) && (
          <span className={`text-[#1F8B4D] text-[10px] font-bold uppercase tracking-widest mb-1 ${isBn ? 'font-bangla-sans' : ''}`}>
            {t(product.category, product.category_bn)}
          </span>
        )}
        
        <h3 className={`text-xl font-bold text-white mb-2 leading-tight font-bangla-sans`}>
          <Link to={`/products/${product.id}`} className="hover:text-[#1F8B4D] transition-colors">
            {t(product.name, product.name_bn)}
          </Link>
        </h3>

        <div className="mb-4 flex flex-col items-center justify-center gap-1 font-bangla-sans">
          <div className="flex items-center gap-2">
            {bestDiscount ? (
              <>
                <span className="text-gray-500 line-through text-sm">Tk {isBn ? toBn(minOriginalPrice) : minOriginalPrice.toFixed(0)}</span>
                <span className="text-[#C62020] text-lg font-bold">Tk {isBn ? toBn(minFinalPrice) : minFinalPrice.toFixed(0)}</span>
              </>
            ) : (
              <>
                <span className="text-gray-400 text-sm">{t('From', 'শুরু')}</span> 
                <span className="text-white text-lg font-medium">Tk {isBn ? toBn(minFinalPrice) : minFinalPrice.toFixed(0)}</span>
              </>
            )}
          </div>
          <span className="text-[10px] text-gray-500 uppercase tracking-widest">
            {isBn ? `${toBn(sizes.length)} ${BN.sizesAvailable}` : `${sizes.length} sizes`}
          </span>
        </div>
        
        <div className="mt-auto">
          {inStock ? (
            <button 
              onClick={handleAddToCart}
              className="w-full flex items-center justify-center gap-2 bg-[#1F8B4D] hover:bg-[#166E3B] text-white font-bold py-3 px-4 transition uppercase text-sm tracking-wide font-bangla-sans"
            >
              <ShoppingCart size={16} />
              {t('Add to Cart', 'কার্টে যোগ করুন')}
            </button>
          ) : (
            <button disabled className="w-full bg-[#333333] text-gray-500 font-bold py-3 px-4 uppercase text-sm tracking-wide cursor-not-allowed border border-[#444] font-bangla-sans">
              {t('Out of Stock', 'স্টক আউট')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const { isBn, t } = useLang()
  const [products, setProducts] = useState([])
  const [blogs, setBlogs] = useState([])
  const [reviews, setReviews] = useState([])

  useEffect(() => {
    supabase.from('products')
      .select('*, product_sizes(id, size_grams, price_override, stock_quantity, discount_percent, discount_expires_at)')
      .eq('is_active', true).limit(8)
      .then(({ data }) => setProducts(data ?? []))
    supabase.from('blogs').select('*').eq('is_published', true).order('published_at', { ascending: false }).limit(3)
      .then(({ data }) => setBlogs(data ?? []))
    supabase.from('reviews').select('*, products(name, name_bn)').eq('is_approved', true).order('created_at', { ascending: false }).limit(4)
      .then(({ data }) => setReviews(data ?? []))
  }, [])

  const saleProducts = products.filter(p => getBestDiscount(p.product_sizes ?? []))

  return (
    <main className="bg-black min-h-screen">
      
      {/* Hero Section */}
      <div className="relative bg-black mb-12 border-b border-[#2A2A2A] h-[400px] sm:h-[500px] overflow-hidden group">
        <img 
          src="https://scontent.fdac183-1.fna.fbcdn.net/v/t39.30808-6/536632897_122136542906867301_3036993042656266164_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=7b2446&_nc_eui2=AeEr_UdhTx9xwhJ9kn38PN7rWxwB9qKjDZhbHAH2oqMNmIritcb-VPC-FIK-GVon5OtDCTwqLPiV3tsCNdxQ2Wk3&_nc_ohc=l3KixPWNi1UQ7kNvwFQH1tO&_nc_oc=Adq-9geYC5SEUNC1Y94HV5WosUW-JjuaCQZOU8j7nStrYpguxjW4K5ngUyuhqVmbwFo&_nc_zt=23&_nc_ht=scontent.fdac183-1.fna&_nc_gid=M7tZfLbeGeo2K0odQf71fw&_nc_ss=7a3a8&oh=00_Af0fK5YKxk8UKM46AlaMypmSieD6nhDVMcejs4NN5cp3fw&oe=69D2C8F5" 
          alt="Hero Background" 
          className="absolute inset-0 w-full h-full object-cover opacity-40 transition-transform duration-1000 group-hover:scale-105"
        />
        
        <div className="relative z-10 px-6 h-full flex flex-col items-center justify-center text-center">
          <span className={`inline-block text-[#1F8B4D] text-xs font-bold uppercase tracking-widest mb-4 ${isBn ? 'font-bangla-sans' : ''}`}>
            {t('Premium Quality', BN.premiumQuality)}
          </span>
          <h1 className={`text-4xl md:text-6xl text-white mb-4 font-bold uppercase tracking-tighter drop-shadow-2xl font-bangla-sans`}>
            {t("Authentic", 'খাঁটি')}&nbsp;<span className="text-[#1F8B4D]">{t("Taste", 'স্বাদ')}</span>
          </h1>
          <p className={`text-sm md:text-base text-gray-200 mb-8 max-w-xl mx-auto font-light tracking-wide font-bangla-serif`}>
            {t('Handcrafted pickles made from secret family recipes. Sun-dried, spiced to perfection.', 'পারিবারিক গোপন রেসিপিতে তৈরি খাঁটি আচার। রোদে শুকানো এবং সম্পূর্ণ মশলাদার।')}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/products" className={`inline-block bg-[#1F8B4D] hover:bg-[#166E3B] text-white font-bold py-3 px-10 transition-all border border-transparent hover:border-green-400 uppercase tracking-widest text-xs ${isBn ? 'font-bangla-sans' : ''}`}>
              {t('Shop Now', BN.shopNow)}
            </Link>
            <Link to="/blogs" className={`inline-block bg-transparent text-white font-bold py-3 px-10 transition-all border border-[#333] hover:border-white uppercase tracking-widest text-xs ${isBn ? 'font-bangla-sans' : ''}`}>
              {t('Read Blog', BN.readBlog)}
            </Link>
          </div>
        </div>
      </div>

      {/* Sale Ticker */}
      {saleProducts.length > 0 && (
        <div className="bg-[#1c1a18] border-b border-[#333] py-3 mb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-4 overflow-x-auto">
            <span className={`text-[10px] font-black uppercase tracking-widest whitespace-nowrap bg-[#C62020] text-white px-3 py-1 shadow-md flex-shrink-0 font-bangla-sans`}>
              🔥 {t('ON SALE', BN.onSale)}
            </span>
            <div className="flex items-center gap-6 text-xs font-medium uppercase tracking-wider whitespace-nowrap font-bangla-sans">
              {saleProducts.map(p => {
                const best = getBestDiscount(p.product_sizes)
                return (
                  <Link key={p.id} to={`/products/${p.id}`} className="hover:text-white text-gray-400 transition-colors flex items-center gap-2">
                    <span className="text-[#1F8B4D]">{isBn ? toBn(best.discount_percent) : best.discount_percent}% {t('OFF', 'ছাড়')}</span>
                    <span>{t(p.name, p.name_bn)}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Static Category Images */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-20 font-bangla-sans">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="relative h-64 group overflow-hidden border border-[#333] bg-[#1e1c1a]">
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors z-10"></div>
            <img src="https://scontent.fdac183-1.fna.fbcdn.net/v/t39.30808-6/611231610_122160940724867301_5348885347470810926_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=13d280&_nc_eui2=AeGP6ESF02TAZQqpcrH3UZE_JvQgZ_uwRlcm9CBn-7BGV6WiRPEFrislKI2unwwzeg6vyXcb8PmmhaVva0pC5u_-&_nc_ohc=iB57xX6mhrMQ7kNvwFzx0uk&_nc_oc=Adrjj1_qND4f1xccy9y4togTkYMq8JD7xdItjYxFKLa7aFI9zFxQzr9kQnGJgg1JzmE&_nc_zt=23&_nc_ht=scontent.fdac183-1.fna&_nc_gid=4W2YOxBj3t6ThEOMGlxzqw&_nc_ss=7a3a8&oh=00_Af1ItxuL91MK6g7Z4ttfEhA_bZ1WyDOmnJqmAVHdtATDyg&oe=69D2AEBB" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60" alt="Pickles" />
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
              <h3 className="text-2xl font-bold text-white uppercase tracking-widest mb-2">{t('Pickles', 'আচার')}</h3>
              <Link to="/products" className="text-[#1F8B4D] text-xs font-bold uppercase tracking-widest border-b border-[#1F8B4D] pb-1 hover:text-white hover:border-white transition-colors">{t('View Collection', 'কালেকশন দেখুন')}</Link>
            </div>
          </div>

          <div className="relative h-64 group overflow-hidden border border-[#333] bg-[#1e1c1a]">
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors z-10"></div>
            <img src="https://scontent.fdac183-1.fna.fbcdn.net/v/t39.30808-6/621693998_122164316066867301_1570377121362583921_n.jpg?_nc_cat=105&ccb=1-7&_nc_sid=13d280&_nc_eui2=AeGvWkE2yhQYFwgkquDBFa0S-xtdg4hpRVP7G12DiGlFU6gGb1EBsZXNzwHh5v7focXoavLtR8X7k7LO9OXIRO07&_nc_ohc=1EHbxw7HasAQ7kNvwFVzc5u&_nc_oc=Adqv7w7oWx3CkrJ7YLvxeKIZ5MEyR6PMe5jc2Zj1oTuruEZmLxw46rSN3ZF_wcwAGrg&_nc_zt=23&_nc_ht=scontent.fdac183-1.fna&_nc_gid=X9ZbntyEEj_F1H5HdW7LeA&_nc_ss=7a3a8&oh=00_Af1HD-DUI-hAmm_xpOaBJ4hUf_FvAJuLQpWkcBoxISGEkQ&oe=69D29A6B" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60" alt="Sauces" />
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
              <h3 className="text-2xl font-bold text-white uppercase tracking-widest mb-2">{t('Sauces', 'সস')}</h3>
              <Link to="/products" className="text-[#1F8B4D] text-xs font-bold uppercase tracking-widest border-b border-[#1F8B4D] pb-1 hover:text-white hover:border-white transition-colors">{t('View Collection', 'কালেকশন দেখুন')}</Link>
            </div>
          </div>

          <div className="relative h-64 group overflow-hidden border border-[#333] bg-[#1e1c1a]">
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors z-10"></div>
            <img src="https://scontent.fdac183-1.fna.fbcdn.net/v/t39.30808-6/616731133_122163130964867301_3608389515201217897_n.jpg?_nc_cat=101&ccb=1-7&_nc_sid=13d280&_nc_eui2=AeEoFEfZGupZk0-GqNyk1qICqIew5WfKCyCoh7DlZ8oLIPvRP6CUQUNFvosAxszQh4nY3lj7q7_3hOrYIbkIolKU&_nc_ohc=GnjHFOfQ8fcQ7kNvwFZEegL&_nc_oc=Adoo9Y3pobsOmv3oPNdX5OBaOcZQVUbsLruWTrJt987xwxc_7jGTEMrxk92LL-4UMXA&_nc_zt=23&_nc_ht=scontent.fdac183-1.fna&_nc_gid=amsExr0K_UASfLCSB4Xz4Q&_nc_ss=7a3a8&oh=00_Af2p9e--GQK0ayPZrjtfKZqMg4698WDmwXXtAQhy9umtVA&oe=69D2C5EA" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60" alt="Premium Achar" />
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
              <h3 className="text-2xl font-bold text-white uppercase tracking-widest mb-2">{t('Premium Achar', 'প্রিমিয়াম আচার')}</h3>
              <Link to="/products" className="text-[#1F8B4D] text-xs font-bold uppercase tracking-widest border-b border-[#1F8B4D] pb-1 hover:text-white hover:border-white transition-colors">{t('View Collection', 'কালেকশন দেখুন')}</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Main Product Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-24">
        <div className="flex items-center justify-between mb-8">
          <h2 className={`text-xl font-bold text-white uppercase tracking-wide border-l-4 border-[#1F8B4D] pl-4 font-bangla-sans`}>
            {t('Shop Favorites', BN.ourProducts)}
          </h2>
          <Link to="/products" className={`text-xs text-gray-500 uppercase tracking-widest hover:text-white transition-colors font-bangla-sans`}>
            {t('View All', BN.viewAll)}
          </Link>
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        ) : (
          <p className="text-gray-500 text-sm uppercase tracking-widest font-bangla-sans">{t('No products available yet.', 'এখনো কোনো পণ্য নেই।')}</p>
        )}
      </div>

      {/* Reviews Section */}
      {reviews.length > 0 && (
        <div className="bg-[#1c1a18] border-y border-[#333] py-16 mb-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <h2 className={`text-2xl font-bold text-white uppercase tracking-wide mb-2 font-bangla-sans`}>{t('What People Say', BN.customerReviews)}</h2>
              <div className="h-1 w-16 bg-[#1F8B4D] mx-auto"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {reviews.map(r => (
                <div key={r.id} className="bg-[#191715] p-6 border border-[#333] relative">
                  <div className="text-[#1F8B4D] text-3xl absolute top-4 right-6 font-serif opacity-20">"</div>
                  <div className="flex text-[#1F8B4D] mb-3 text-sm">
                    {[1,2,3,4,5].map(i => (
                      <span key={i} className={i <= r.rating ? 'text-[#1F8B4D]' : 'text-gray-700'}>★</span>
                    ))}
                  </div>
                  <p className="font-bangla-serif text-gray-400 text-xs leading-relaxed mb-4 font-light">
                    "{r.comment}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center text-white font-bold text-[10px]">
                      {r.customer_name[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-bangla-sans text-white text-xs font-bold uppercase tracking-wide">{r.customer_name}</h4>
                      {r.products?.name && <p className="font-bangla-sans text-gray-500 text-[10px] uppercase tracking-widest">{t(r.products.name, r.products.name_bn)}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Blog Section */}
      {blogs.length > 0 && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
          <div className="flex items-center justify-between mb-8">
            <h2 className={`text-xl font-bold text-white uppercase tracking-wide border-l-4 border-[#1F8B4D] pl-4 font-bangla-sans`}>
              {t('From Our Blog', BN.fromOurBlog)}
            </h2>
            <Link to="/blogs" className={`text-xs text-gray-500 uppercase tracking-widest hover:text-white transition-colors font-bangla-sans`}>
              {t('All Posts', BN.allPosts)}
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {blogs.map(b => (
              <div key={b.id} className="bg-[#191715] border border-[#333333] hover:border-[#1F8B4D] transition-colors duration-300 flex flex-col group relative p-8">
                <div className="flex flex-col flex-grow">
                  <span className="font-bangla-sans text-[#1F8B4D] text-[10px] font-bold uppercase tracking-widest mb-3 block">
                    {b.author || 'Editorial Team'}
                  </span>
                  
                  <h3 className="font-bangla-sans text-xl font-bold text-white mb-3 leading-tight group-hover:text-[#1F8B4D] transition-colors">
                    <Link to={`/blogs/${b.slug}`}>
                      {t(b.title, b.title_bn)}
                    </Link>
                  </h3>
                  
                  <p className="font-bangla-serif text-gray-400 text-sm leading-relaxed font-light mb-6 line-clamp-3">
                    {t(b.excerpt, b.excerpt_bn)}
                  </p>
                  
                  <div className="mt-auto border-t border-[#333] pt-4 font-bangla-sans">
                    <Link 
                      to={`/blogs/${b.slug}`} 
                      className="inline-flex items-center gap-2 text-[#1F8B4D] text-xs font-bold uppercase tracking-widest group-hover:text-white transition-colors"
                    >
                      {t('Read Article', 'আর্টিকেলটি পড়ুন')} <span className="transition-transform group-hover:translate-x-1">→</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  )
}