import React, { useEffect, useState } from 'react'
import { auth, provider, db } from './firebase'
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth'
import { collection, addDoc, query, orderBy, onSnapshot, Timestamp } from 'firebase/firestore'
import { Line } from 'react-chartjs-2'
import 'chart.js/auto'

type Op = {
  id?: string
  date: string
  exchange: string
  coin: string
  amount: number
  profit: number
  note?: string
  createdAt?: any
  uid?: string
}

export default function App() {
  const [user, setUser] = useState<User | null>(null)
  const [ops, setOps] = useState<Op[]>([])
  const [form, setForm] = useState({ date: '', exchange: 'Binance', coin: 'USDT', amount: '', profit: '', note: '' })
  const [loadingPayPal, setLoadingPayPal] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
    })
    return () => unsub()
  }, [])

  // load ops from Firestore when authenticated
  useEffect(() => {
    if (!user) {
      setOps([]) // reset local ops if you wish
      return
    }
    const q = query(collection(db, 'operations'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snapshot) => {
      setOps(snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) })))
    })
    return () => unsub()
  }, [user])

  // local add (and push to firestore if user)
  async function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const op: Op = {
      date: form.date || new Date().toISOString().slice(0, 10),
      exchange: form.exchange,
      coin: form.coin,
      amount: Number(form.amount || 0),
      profit: Number(form.profit || 0),
      note: form.note,
      createdAt: Timestamp.now(),
      uid: user?.uid
    }
    if (user) {
      await addDoc(collection(db, 'operations'), op)
    } else {
      setOps(prev => [op, ...prev])
    }
    setForm({ date: '', exchange: 'Binance', coin: 'USDT', amount: '', profit: '', note: '' })
  }

  const login = async () => {
    await signInWithPopup(auth, provider)
  }
  const logout = async () => {
    await signOut(auth)
  }

  const totalProfit = ops.reduce((s, o) => s + Number(o.profit || 0), 0)

  // Chart data
  const chartData = {
    labels: ops.slice().reverse().map(o => o.date),
    datasets: [
      {
        label: 'Profit',
        data: ops.slice().reverse().map(o => Number(o.profit)),
        tension: 0.3,
        fill: false
      }
    ]
  }

  // PayPal buttons render helper
  useEffect(() => {
    const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID
    if (!clientId) return
    if ((window as any).paypal) {
      renderButtons()
      return
    }
    setLoadingPayPal(true)
    const script = document.createElement('script')
    script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=USD`
    script.onload = () => {
      setLoadingPayPal(false)
      renderButtons()
    }
    document.body.appendChild(script)
  }, [user])

  function renderButtons() {
    try {
      ;(window as any).paypal.Buttons({
        createOrder: (data: any, actions: any) => actions.order.create({
          purchase_units: [{ amount: { value: '15.00' } }],
          application_context: { shipping_preference: 'NO_SHIPPING' }
        }),
        onApprove: (data: any, actions: any) => actions.order.capture().then((details: any) => {
          alert('Pago completado: ' + details.payer.name.given_name)
        })
      }).render('#paypal-button-container')
    } catch (e) {
      console.error('PayPal render error', e)
    }
  }

  // Binance & Blockchain pay links (your values)
  const BINANCE_LINK = 'https://pay.binance.com/en?merchantId=807678814'
  const BLOCKCHAIN_LINK = 'https://commerce.blockchain.com/payment-request/create?address=0x4c64b783f1babc0a2fe62f174873f415393c2269&asset=USDTBEP20'

  // WhatsApp/Telegram direct: if you want to hide number use serverless redirect (explained abajo)
  const TELEGRAM_LINK = 'https://t.me/your_username'
  // If you cannot hide, use 'wa.me' with number OR use serverless redirect
  const WA_REDIRECT = '/.netlify/functions/wa' // example if you deploy on Netlify (see abajo)

  return (
    <div style={{ paddingBottom: 100 }}>
      <header id="hero">
        <h1>JJXCAPITAL ⚡ Arbitraje P2P Manager</h1>
        <p>Registro y control de operaciones P2P</p>

        <button id="btn-simulador">Simulador</button>

        <div id="auth-buttons" style={{ display: user ? 'none' : 'inline-block' }}>
          <button id="btn-login" onClick={login}>Iniciar Sesión (Google)</button>
          <button id="btn-register" onClick={login}>Registrarse</button>
        </div>

        <div style={{ display: user ? 'block' : 'none', marginTop: 12 }}>
          <button onClick={logout}>Cerrar sesión</button>
        </div>
      </header>

      <nav id="app-nav" style={{ display: user ? 'flex' : 'none' }}>
        <a href="#dashboard">Dashboard</a>
        <a href="#arbitraje">Arbitraje</a>
        <a href="#historial">Historial</a>
        <a href="#p2p">P2P</a>
        <a href="#premium">Premium</a>
      </nav>

      <main style={{ padding: 20 }}>
        <section id="profile" style={{ display: user ? 'block' : 'none' }}>
          <h3>Mi Perfil</h3>
          <p><strong>Usuario:</strong> {user?.displayName}</p>
          <p><strong>Email:</strong> {user?.email}</p>
        </section>

        <section id="form" style={{ marginTop: 20 }}>
          <h3>Registrar Operación</h3>
          <form onSubmit={handleAdd}>
            <input value={form.date} onChange={e => setForm({...form, date: e.target.value})} type="date" />
            <input placeholder="Exchange" value={form.exchange} onChange={e => setForm({...form, exchange: e.target.value})} />
            <input placeholder="Coin" value={form.coin} onChange={e => setForm({...form, coin: e.target.value})} />
            <input placeholder="Amount" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} />
            <input placeholder="Profit" value={form.profit} onChange={e => setForm({...form, profit: e.target.value})} />
            <input placeholder="Nota" value={form.note} onChange={e => setForm({...form, note: e.target.value})} />
            <button type="submit">Agregar</button>
          </form>
        </section>

        <section id="dashboard" style={{ marginTop: 20 }}>
          <h3>Dashboard</h3>
          <p>Total Profit: <strong>{totalProfit.toFixed(2)}</strong></p>
          <div style={{ maxWidth: 800 }}>
            <Line data={chartData} />
          </div>
        </section>

        <section id="historial" style={{ marginTop: 20 }}>
          <h3>Historial</h3>
          <table>
            <thead><tr><th>Fecha</th><th>Exchange</th><th>Coin</th><th>Monto</th><th>Profit</th></tr></thead>
            <tbody>
              {ops.map((o, i) => (
                <tr key={i}>
                  <td>{o.date}</td>
                  <td>{o.exchange}</td>
                  <td>{o.coin}</td>
                  <td>{o.amount}</td>
                  <td>{o.profit}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section id="payments" style={{ display: user ? 'block' : 'none', marginTop: 20 }}>
          <h3>Pagos</h3>

          <div id="paypal-button-container">{loadingPayPal && <p>Cargando PayPal...</p>}</div>

          <p style={{ marginTop: 12 }}>
            <a className="btn btn-warning" href={BINANCE_LINK} target="_blank">BINANCE PAY</a>
            <a className="btn btn-dark" href={BLOCKCHAIN_LINK} target="_blank">BLOCKCHAIN PAY</a>
          </p>
        </section>

        <section id="premium" style={{ display: user ? 'block' : 'none', marginTop: 20 }}>
          <h3>Premium - Contacto</h3>
          <p>
            <a className="btn btn-success" href={WA_REDIRECT} target="_blank" rel="noreferrer">WhatsApp</a>
            <a className="btn btn-info" href={TELEGRAM_LINK} target="_blank" rel="