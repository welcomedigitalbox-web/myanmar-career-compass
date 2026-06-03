import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, getDocs } from 'firebase/firestore'

export default function Responses() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const snap = await getDocs(collection(db, 'responses'))
      const data = []
      snap.forEach(d => data.push({ id: d.id, ...d.data() }))
      data.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      setRows(data)
      setLoading(false)
    }
    load()
  }, [])

  const tc = {}
  rows.forEach(r => { if (r.riasecType) tc[r.riasecType] = (tc[r.riasecType] || 0) + 1 })
  const topTypes = Object.entries(tc).sort((a, b) => b[1] - a[1]).slice(0, 3)

  return (
    <div>
      <h2 style={{ fontSize:16, fontWeight:500, marginBottom:'1.25rem' }}>User Responses</h2>

      {topTypes.length > 0 && (
        <div style={{ display:'flex', gap:12, marginBottom:'1.5rem' }}>
          {topTypes.map(([type, count]) => (
            <div key={type} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'1rem 1.25rem', flex:1 }}>
              <div style={{ fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>Top Type</div>
              <div style={{ fontSize:20, fontWeight:600 }}>{type}</div>
              <div style={{ fontSize:11, color:'var(--muted)', marginTop:3 }}>{count} responses</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr>{['Date','RIASEC Type','Top Career','Abroad Pref','Scores'].map(h => (
                <th key={h} style={{ textAlign:'left', padding:'8px 12px', color:'var(--muted)', fontSize:11, textTransform:'uppercase', letterSpacing:'.05em', borderBottom:'1px solid var(--border)' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign:'center', padding:'2rem', color:'var(--muted)' }}>Loading...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign:'center', padding:'2rem', color:'var(--muted)', fontSize:13 }}>Response မရှိသေးပါ</td></tr>
              ) : rows.map(r => (
                <tr key={r.id} style={{ borderBottom:'1px solid var(--border)' }}>
                  <td style={{ padding:'10px 12px', fontSize:12, color:'var(--muted)' }}>{r.createdAt ? new Date(r.createdAt).toLocaleString() : '—'}</td>
                  <td style={{ padding:'10px 12px' }}><span style={{ background:'rgba(124,107,255,.15)', color:'#a89bff', fontSize:11, padding:'2px 8px', borderRadius:99 }}>{r.riasecType || '—'}</span></td>
                  <td style={{ padding:'10px 12px' }}>{r.topCareer || '—'}</td>
                  <td style={{ padding:'10px 12px', fontSize:12 }}>{r.abroad || '—'}</td>
                  <td style={{ padding:'10px 12px', fontSize:11, color:'var(--muted)', fontFamily:'monospace' }}>{r.scores ? `R${r.scores.R} I${r.scores.I} A${r.scores.A} S${r.scores.S} E${r.scores.E} C${r.scores.C}` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
