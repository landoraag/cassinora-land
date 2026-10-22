import { createContext, useContext, useEffect, useState } from "react";
import { clearCollectionCache } from "../lib/useCollection";
import { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, updateProfile } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../lib/firebase";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        try {
          const snap = await getDoc(doc(db, "users", u.uid));
          setProfile(snap.exists() ? snap.data() : { nickname: u.displayName || u.email });
        } catch {
          setProfile({ nickname: u.displayName || u.email, email: u.email });
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsub;
  }, []);

  async function login(email, password) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function register(email, password, nickname) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: nickname });
    await setDoc(doc(db, "users", cred.user.uid), { email, nickname, createdAt: serverTimestamp() });
    setProfile({ email, nickname });
  }

  async function updatePhoto(photoURL) {
    const u = auth.currentUser;
    if (!u) return;
    const value = photoURL || null;
    await setDoc(doc(db, "users", u.uid), { photoURL: value, email: u.email, nickname: profile?.nickname || u.displayName || u.email }, { merge: true });
    setProfile((p) => ({ ...(p || {}), photoURL: value }));
  }

  async function logout() {
    clearCollectionCache(); // desliga as listas guardadas antes de sair (evita erro de permissão)
    await signOut(auth);
  }

  return <AuthContext.Provider value={{ user, profile, loading, login, register, logout, updatePhoto }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
