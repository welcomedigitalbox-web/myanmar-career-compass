import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, getDocs } from 'firebase/firestore'

function StatCard({ label, value, sub }) {
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'1rem 1.25rem' }}>
      <div style={{ fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>{label}</div>
      <div style={{ fontSize:24, fontWeight:600 }}>{value}</div>
      {sub && <div style={{ fontSize:11, color:'var(--muted)', marginTop:3 }}>{sub}</div>}
    </div>
  )
}

export default function Dashboard() {
  const [stats, setStats] = useState({ careers:0, responses:0, topType:'—' })
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [cSnap, rSnap] = await Promise.all([
        getDocs(collection(db, 'careerTypes')),
        getDocs(collection(db, 'responses')),
      ])
      const rows = []
      rSnap.forEach(d => rows.push({ id: d.id, ...d.data() }))
      rows.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      const tc = {}
      rows.forEach(r => { if (r.riasecType) tc[r.riasecType] = (tc[r.riasecType] || 0) + 1 })
      const top = Object.entries(tc).sort((a, b) => b[1] - a[1])[0]
      setStats({ careers: cSnap.size, responses: rSnap.size, topType: top?.[0] || '—' })
      setRecent(rows.slice(0, 10))
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <p style={{ color:'var(--muted)' }}>Loading...</p>

  return (
    <div>
      <h2 style={{ fontSize:16, fontWeight:500, marginBottom:'1.25rem' }}>Dashboard</h2>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:'1.75rem' }}>
        <StatCard label="Career Types" value={stats.careers} sub="RIASEC pairs" />
        <StatCard label="User Responses" value={stats.responses} sub="ဖြေဆိုပြီးသော" />
        <StatCard label="Top RIASEC Type" value={stats.topType} sub="အများဆုံး" />
      </div>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12 }}>
        <div style={{ padding:'.875rem 1.25rem', borderBottom:'1px solid var(--border)', fontSize:13, fontWeight:500 }}>Recent Responses</div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr>{['Time','RIASEC Type','Top Career','Abroad'].map(h => (
                <th key={h} style={{ textAlign:'left', padding:'8px 12px', color:'var(--muted)', fontSize:11, textTransform:'uppercase', letterSpacing:'.05em', borderBottom:'1px solid var(--border)' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {recent.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign:'center', padding:'2rem', color:'var(--muted)', fontSize:13 }}>Response မရှိသေးပါ</td></tr>
              ) : recent.map(r => (
                <tr key={r.id} style={{ borderBottom:'1px solid var(--border)' }}>
                  <td style={{ padding:'10px 12px', fontSize:12, color:'var(--muted)' }}>{r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}</td>
                  <td style={{ padding:'10px 12px' }}><span style={{ background:'rgba(124,107,255,.15)', color:'#a89bff', fontSize:11, padding:'2px 8px', borderRadius:99 }}>{r.riasecType || '—'}</span></td>
                  <td style={{ padding:'10px 12px' }}>{r.topCareer || '—'}</td>
                  <td style={{ padding:'10px 12px', fontSize:12 }}>{r.abroad || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
