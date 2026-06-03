import { useState, useEffect } from 'react'
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { auth } from '../firebase'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import Dashboard from './Dashboard'
import Careers from './Careers'
import Responses from './Responses'

const s = {
  wrap: { display:'flex', minHeight:'100vh' },
  sidebar: { width:220, background:'var(--surface)', borderRight:'1px solid var(--border)', display:'flex', flexDirection:'column', padding:'1.5rem 0', flexShrink:0 },
  logo: { padding:'0 1.25rem 1.5rem', borderBottom:'1px solid var(--border)', marginBottom:'1rem' },
  brand: { fontSize:15, fontWeight:600 },
  sub: { fontSize:11, color:'var(--muted)', marginTop:2 },
  main: { flex:1, display:'flex', flexDirection:'column' },
  topbar: { padding:'1rem 1.75rem', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' },
  content: { flex:1, padding:'1.75rem', overflowY:'auto' },
  logoutBtn: { background:'none', border:'none', color:'var(--danger)', fontSize:12, marginTop:'auto', padding:'1rem 1.25rem', borderTop:'1px solid var(--border)', cursor:'pointer', textAlign:'left' },
}

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      style={({ isActive }) => ({
        display:'flex', alignItems:'center', gap:10,
        padding:'9px 1.25rem', fontSize:13, textDecoration:'none',
        color: isActive ? 'var(--accent)' : 'var(--muted)',
        borderLeft: isActive ? '2px solid var(--accent)' : '2px solid transparent',
        background: isActive ? 'rgba(124,107,255,.08)' : 'transparent',
        transition:'all .15s',
      })}
    >
      {children}
    </NavLink>
  )
}

function LoginScreen() {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const login = async () => {
    if (!email || !pw) { setErr('Email နှင့် Password ထည့်ပါ'); return }
    setErr(''); setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, pw)
    } catch {
      setErr('Email သို့မဟုတ် Password မှားသည်')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ width:380, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:16, padding:'2.5rem' }}>
        <h1 style={{ fontSize:22, fontWeight:600, marginBottom:4 }}>Career Compass</h1>
        <p style={{ fontSize:13, color:'var(--muted)', marginBottom:'2rem' }}>Admin Panel — ဝင်ရောက်ပါ</p>
        {['Email','Password'].map((label, i) => (
          <div key={label} style={{ marginBottom:'1rem' }}>
            <label style={{ fontSize:12, color:'var(--muted)', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:'.05em' }}>{label}</label>
            <input
              type={i === 1 ? 'password' : 'email'}
              value={i === 0 ? email : pw}
              onChange={e => i === 0 ? setEmail(e.target.value) : setPw(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && login()}
              placeholder={i === 0 ? 'admin@example.com' : '••••••••'}
              style={{ width:'100%', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:8, padding:'10px 14px', color:'var(--text)', fontSize:14, outline:'none' }}
            />
          </div>
        ))}
        {err && <p style={{ color:'var(--danger)', fontSize:12, marginBottom:8 }}>{err}</p>}
        <button
          onClick={login}
          disabled={loading}
          style={{ width:'100%', background:'var(--accent)', color:'#fff', border:'none', borderRadius:8, padding:11, fontSize:14, fontWeight:500, marginTop:4, opacity: loading ? .7 : 1 }}
        >
          {loading ? 'Loading...' : 'ဝင်ရောက်မည်'}
        </button>
      </div>
    </div>
  )
}

export default function AdminApp() {
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    return onAuthStateChanged(auth, u => setUser(u ?? null))
  }, [])

  if (user === undefined) return <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--muted)' }}>Loading...</div>
  if (!user) return <LoginScreen />

  return (
    <div style={s.wrap}>
      <div style={s.sidebar}>
        <div style={s.logo}>
          <div style={s.brand}>Career Compass</div>
          <div style={s.sub}>Admin Panel</div>
        </div>
        <NavItem to="/admin">📊 Dashboard</NavItem>
        <NavItem to="/admin/careers">💼 Career Types</NavItem>
        <NavItem to="/admin/responses">👥 Responses</NavItem>
        <button style={s.logoutBtn} onClick={() => signOut(auth)}>↩ Logout</button>
      </div>
      <div style={s.main}>
        <div style={s.content}>
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="careers" element={<Careers />} />
            <Route path="responses" element={<Responses />} />
          </Routes>
        </div>
      </div>
    </div>
  )
}
