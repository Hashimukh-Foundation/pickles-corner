import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import { LangProvider } from './lib/lang.jsx'
import { CartProvider } from './lib/cart.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <LangProvider>
        <CartProvider>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: { fontFamily: 'DM Sans, sans-serif', fontSize: '14px' },
            }}
          />
        </CartProvider>
      </LangProvider>
    </BrowserRouter>
  </React.StrictMode>
)
