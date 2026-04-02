import { createContext, useContext, useState, useEffect } from 'react'

const LangContext = createContext(null)

export function LangProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en')

  useEffect(() => {
    localStorage.setItem('lang', lang)
    // Update <html lang="..."> so CSS selectors like [lang="bn"] work
    document.documentElement.lang = lang
  }, [lang])

  const toggle = () => setLang(l => l === 'en' ? 'bn' : 'en')
  const isBn = lang === 'bn'

  /**
   * Pick the right string: Bangla if available and lang=bn, else English.
   * t(product.name, product.name_bn) → returns Bangla name if lang=bn and name_bn exists.
   */
  const t = (en, bn) => (isBn && bn) ? bn : en

  return (
    <LangContext.Provider value={{ lang, isBn, toggle, t }}>
      {children}
    </LangContext.Provider>
  )
}

export const useLang = () => useContext(LangContext)
