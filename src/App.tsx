import React, { useEffect, useState } from "react";
import "./App.css";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
  User
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  serverTimestamp
} from "firebase/firestore";

/* ----------------------------
   Tu firebaseConfig (tal como lo proporcionaste)
   ---------------------------- */
const firebaseConfig = {
  apiKey: "AIzaSyBMHC2YuUO3mwHQORDDGZaQ84-k4tmJGjY",
  authDomain: "jjxcapital-2.firebaseapp.com",
  projectId: "jjxcapital-2",
  storageBucket: "jjxcapital-2.appspot.com",
  messagingSenderId: "842768954334",
  appId: "1:842768954334:web:63248c0a432f583abf234f",
  measurementId: "G-VVYKFN4WPD"
};

/* Inicializa Firebase */
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);

/* Tipos simples */
type Op = {
  base: string;
  quote: string;
  priceBuy: number;
  priceSell: number;
  profit: number;
  ts?: any;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [ops, setOps] = useState<Op[]>([]);
  const [form, setForm] = useState({ base: "", quote: "", priceBuy: "", priceSell: "" });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) loadOperations(u.uid);
    });
    return () => unsub();
  }, []);

  // Login Google
  async function loginGoogle() {
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error("login error", e);
      alert("Error iniciando sesión: " + (e as any).message);
    }
  }

  // Register email/password
  async function registerEmail() {
    const email = prompt("Introduce tu email:");
    const pass = prompt("Introduce contraseña:");
    if (!email || !pass) return alert("Email y contraseña requeridos");
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      alert("Registro correcto. Ya puedes iniciar sesión.");
    } catch (e) {
      console.error(e);
      alert("Error registro: " + (e as any).message);
    }
  }

  // Logout
  async function logout() {
    await signOut(auth);
  }

  // Guardar operación (desde inputs)
  async function saveOperation() {
    if (!user) return alert("Inicia sesión para guardar operaciones");
    const base = form.base.trim();
    const quote = form.quote.trim();
    const priceBuy = parseFloat(form.priceBuy || "0");
    const priceSell = parseFloat(form.priceSell || "0");
    const profit = priceSell - priceBuy;
    if (!base || !quote) return alert("Base y Quote obligatorios");
    try {
      await addDoc(collection(db, "operations"), {
        uid: user.uid,
        base,
        quote,
        priceBuy,
        priceSell,
        profit,
        ts: serverTimestamp()
      });
      setForm({ base: "", quote: "", priceBuy: "", priceSell: "" });
      loadOperations(user.uid);
    } catch (e) {
      console.error(e);
      alert("Error guardando operación: " + (e as any).message);
    }
  }

  async function loadOperations(uid: string) {
    try {
      const q = query(collection(db, "operations"), where("uid", "==", uid), orderBy("ts", "desc"));
      const snap = await getDocs(q);
      const list: Op[] = snap.docs.map((d) => d.data() as Op);
      setOps(list);
    } catch (e) {
      console.error("load ops", e);
      alert("Error cargando operaciones: " + (e as any).message);
    }
  }

  return (
    <div>
      {/* HERO */}
      <section id="hero">
        <div className="logo">JJXCAPITAL ⚡</div>
        <p className="tagline">Seguridad, velocidad y confianza</p>
        <button id="btn-simulador" onClick={() => alert("Simulador (pendiente)")} >
          🔄 Ir al Simulador
        </button>

        {!user ? (
          <div id="auth-buttons">
            <button id="btn-login" onClick={loginGoogle}>🚀 Iniciar Sesión con Google</button>
            <button id="btn-register" onClick={registerEmail}>📝 Regístrate Gratis</button>
          </div>
        ) : null}
      </section>

      {/* PROFILE */}
      <section id="profile" className={user ? "show" : ""} style={{ display: user ? "block" : "none" }}>
        <h2>👤 Mi Perfil</h2>
        <p>Nombre: <span id="profile-name">{user?.displayName ?? "—"}</span></p>
        <p>Email: <span id="profile-email">{user?.email ?? "—"}</span></p>
        <p>Miembro desde: <span id="profile-date">{user?.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : "—"}</span></p>
        <p>Estado: <span id="profile-status">Plan Gratuito</span></p>
        <button onClick={logout}>🚪 Cerrar Sesión</button>
      </section>

      {/* PAYMENTS */}
      <section id="payments" className={user ? "show" : ""} style={{ display: user ? "block" : "none" }}>
        <h2>💎 Plan PREMIUM - $15 USD/mes</h2>
        <div className="payment-methods">
          <div className="payment-method">
            <h4>💳 PayPal</h4>
            <div id="paypal-button-container">(PayPal)</div>
          </div>
        </div>
      </section>

      {/* DASHBOARD / OPERATIONS */}
      <section id="dashboard" style={{ display: user ? "block" : "none" }}>
        <h2>📊 Mis Operaciones</h2>
        <div style={{ marginBottom: 12 }}>
          <input id="base" placeholder="Base (BTC)" value={form.base} onChange={(e) => setForm({...form, base: e.target.value})} />
          <input id="quote" placeholder="Quote (USDT)" value={form.quote} onChange={(e) => setForm({...form, quote: e.target.value})} />
          <input id="price-buy" type="number" step="0.01" placeholder="Precio Compra" value={form.priceBuy} onChange={(e) => setForm({...form, priceBuy: e.target.value})} />
          <input id="price-sell" type="number" step="0.01" placeholder="Precio Venta" value={form.priceSell} onChange={(e) => setForm({...form, priceSell: e.target.value})} />
          <button id="btn-save-op" onClick={saveOperation}>💾 Guardar</button>
        </div>
        <ul id="ops-list">
          {ops.map((o, i) => (
            <li key={i}>{o.base}/{o.quote} → Profit: {o.profit}</li>
          ))}
        </ul>
      </section>

      <nav id="app-nav" className={user ? "show" : ""} style={{ display: user ? "flex" : "none" }}>
        <a href="#dashboard">🏠 <span className="nav-label">Dashboard</span></a>
        <a href="#arbitraje">⚡ <span className="nav-label">Arbitraje</span></a>
        <a href="#historial">📜 <span className="nav-label">Historial</span></a>
        <a href="#p2p">🤝 <span className="nav-label">P2P</span></a>
        <a href="#premium">💎 <span className="nav-label">Premium</span></a>
      </nav>
    </div>
  );
}