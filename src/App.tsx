import { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  User,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
} from "firebase/firestore";

// ✅ Tu configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBMHC2YuUO3mwHQORDDGZaQ84-k4tmJGjY",
  authDomain: "jjxcapital-2.firebaseapp.com",
  projectId: "jjxcapital-2",
  storageBucket: "jjxcapital-2.firebasestorage.app",
  messagingSenderId: "842768954334",
  appId: "1:842768954334:web:63248c0a432f583abf234f",
  measurementId: "G-VVYKFN4WPD",
};

// ✅ Inicializa Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [ops, setOps] = useState<any[]>([]);

  // Escuchar cambios de sesión
  useEffect(() => {
    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) loadOperations(currentUser.uid);
    });
  }, []);

  // Login con Google
  const loginGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error("Error en login:", err);
    }
  };

  // Logout
  const logout = async () => {
    await signOut(auth);
  };

  // Guardar operación de prueba en Firestore
  const saveOperation = async () => {
    if (!user) return;
    await addDoc(collection(db, "operations"), {
      uid: user.uid,
      base: "BTC",
      quote: "USDT",
      priceBuy: 25000,
      priceSell: 25500,
      profit: 500,
      ts: new Date(),
    });
    loadOperations(user.uid);
  };

  // Cargar operaciones del usuario
  const loadOperations = async (uid: string) => {
    const q = query(
      collection(db, "operations"),
      where("uid", "==", uid),
      orderBy("ts", "desc")
    );
    const snap = await getDocs(q);
    setOps(snap.docs.map((doc) => doc.data()));
  };

  return (
    <div style={{ textAlign: "center", color: "white", background: "#000" }}>
      {/* HERO */}
      <section id="hero" style={{ padding: "40px" }}>
        <h1 className="logo">JJXCAPITAL ⚡</h1>
        <p className="tagline">Seguridad, velocidad y confianza</p>

        <button id="btn-simulador">🔄 Ir al Simulador</button>

        {!user && (
          <div id="auth-buttons">
            <button onClick={loginGoogle}>🚀 Iniciar Sesión con Google</button>
            <button>📝 Regístrate Gratis</button>
          </div>
        )}
      </section>

      {/* PERFIL */}
      {user && (
        <section id="profile" style={{ padding: "20px", background: "#111" }}>
          <h2>👤 Mi Perfil</h2>
          <p>
            Nombre: <span>{user.displayName}</span>
          </p>
          <p>
            Email: <span>{user.email}</span>
          </p>
          <button onClick={logout}>🚪 Cerrar Sesión</button>
        </section>
      )}

      {/* PAGOS */}
      {user && (
        <section id="payments" style={{ padding: "20px", background: "#222" }}>
          <h2>💎 Plan PREMIUM - $15 USD/mes</h2>
          <div>
            <button className="btn btn-warning">BINANCE PAY</button>
            <button className="btn btn-dark">BLOCKCHAIN PAY</button>
          </div>
        </section>
      )}

      {/* OPERACIONES DE PRUEBA */}
      {user && (
        <section style={{ marginTop: "20px" }}>
          <button onClick={saveOperation}>💾 Guardar operación de prueba</button>
          <ul>
            {ops.map((o, i) => (
              <li key={i}>
                {o.base}/{o.quote} → Profit: {o.profit}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export default App;