// src/App.tsx
import React, { useEffect, useState } from "react";
import "./App.css";
import { useAuth } from "./hooks/useAuth";
import { saveOperation, loadOperations } from "./db";

export default function App() {
  const { user, loading, loginWithGoogle, registerWithEmail, logout } = useAuth();

  // Form state (mantén IDs si tu CSS los usa)
  const [base, setBase] = useState("");
  const [quote, setQuote] = useState("");
  const [priceBuy, setPriceBuy] = useState("");
  const [priceSell, setPriceSell] = useState("");
  const [ops, setOps] = useState<any[]>([]);

  // Al cambiar de usuario, carga operaciones
  useEffect(() => {
    async function fetchOps() {
      if (!user) { setOps([]); return; }
      const list = await loadOperations(user.uid);
      setOps(list);
    }
    fetchOps();
  }, [user]);

  async function handleSaveOp() {
    if (!user) return alert("Inicia sesión para guardar operaciones");
    const pb = parseFloat(priceBuy || "0");
    const ps = parseFloat(priceSell || "0");
    try {
      await saveOperation(user.uid, base, quote, pb, ps);
      const list = await loadOperations(user.uid);
      setOps(list);
      // limpiar formulario
      setBase(""); setQuote(""); setPriceBuy(""); setPriceSell("");
    } catch (e: any) {
      alert("Error guardando operación: " + e.message);
    }
  }

  return (
    <div>
      {/* === HERO (mantén tu diseño tal cual) */}
      <section id="hero">
        <div className="logo">JJXCAPITAL ⚡</div>
        <p className="tagline">Seguridad, velocidad y confianza</p>

        <button id="btn-simulador" onClick={() => alert("Simulador - aún en desarrollo")}>🔄 Ir al Simulador</button>

        {!user && (
          <div id="auth-buttons">
            <button id="btn-login" onClick={loginWithGoogle}>🚀 Iniciar Sesión con Google</button>
            <button id="btn-register" onClick={() => registerWithEmail(prompt("Email") || "", prompt("Contraseña") || "")}>📝 Regístrate Gratis</button>
          </div>
        )}
      </section>

      {/* PERFIL */}
      <section id="profile" style={{ display: user ? "block" : "none" }}>
        <h2>👤 Mi Perfil</h2>
        <p>Nombre: <span id="profile-name">{user?.displayName ?? "—"}</span></p>
        <p>Email: <span id="profile-email">{user?.email ?? "—"}</span></p>
        <button onClick={() => logout()}>🚪 Cerrar Sesión</button>
      </section>

      {/* PAGOS */}
      <section id="payments" style={{ display: user ? "block" : "none" }}>
        <h2>💎 Plan PREMIUM - $15 USD/mes</h2>
        <div id="paypal-button-container"></div>
      </section>

      {/* DASHBOARD / FORM operaciones */}
      <section id="dashboard" style={{ display: user ? "block" : "none", padding: 20 }}>
        <h3>Registrar Operación</h3>
        <input id="base" value={base} onChange={e => setBase(e.target.value)} placeholder="Base (BTC)" />
        <input id="quote" value={quote} onChange={e => setQuote(e.target.value)} placeholder="Quote (USDT)" />
        <input id="price-buy" type="number" value={priceBuy} onChange={e => setPriceBuy(e.target.value)} placeholder="Precio Compra" />
        <input id="price-sell" type="number" value={priceSell} onChange={e => setPriceSell(e.target.value)} placeholder="Precio Venta" />
        <button id="btn-save-op" onClick={handleSaveOp}>💾 Guardar</button>

        <h4>Mis Operaciones</h4>
        <ul id="ops-list">
          {ops.map((o, i) => (
            <li key={i}>{o.base}/{o.quote} → Profit: {o.profit}</li>
          ))}
        </ul>
      </section>

      <nav id="app-nav" style={{ display: user ? "flex" : "none" }}>
        <a href="#dashboard">🏠 Dashboard</a>
        <a href="#arbitraje">⚡ Arbitraje</a>
        <a href="#historial">📜 Historial</a>
        <a href="#p2p">🤝 P2P</a>
        <a href="#premium">💎 Premium</a>
      </nav>
    </div>
  );
}