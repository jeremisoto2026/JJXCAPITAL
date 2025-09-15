// src/db.ts
import { db } from "./firebase";
import { collection, addDoc, query, where, orderBy, getDocs, serverTimestamp } from "firebase/firestore";

export async function saveOperation(uid: string, base: string, quote: string, priceBuy: number, priceSell: number) {
  const profit = priceSell - priceBuy;
  return addDoc(collection(db, "operations"), {
    uid,
    base,
    quote,
    priceBuy,
    priceSell,
    profit,
    ts: serverTimestamp()
  });
}

export async function loadOperations(uid: string) {
  const q = query(collection(db, "operations"), where("uid", "==", uid), orderBy("ts", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
}