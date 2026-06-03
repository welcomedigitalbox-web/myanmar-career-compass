import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, getDocs } from 'firebase/firestore'
import * as XLSX from 'xlsx'

const RIASEC_NAMES = { R:'Realistic', I:'Investigative', A:'Artistic', S:'Social', E:'Enterprising', C:'Conventional' }
const COLORS = { R:'#7F77DD', I:'#1D9E75', A:'#D85A30', S:'#378ADD', E:'#BA7517', C:'#888780' }

function DetailModal({ row, onClose }) {
  if (!row) return null
  const scores = row.scores || {}
  const maxS = Math.max(...Object.values(scores), 1)

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={e => e.target===e.currentTarget&&onClose()}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, width:520, maxHeight:'85vh', overflowY:'auto' }}>
        <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h3 style={{ fontSize:15, fontWeight:500 }}>{row.name || '—'} ၏ Result</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--muted)', fontSize:20, cursor:'pointer' }}>×</button>
        </div>
        <div style={{ padding:'1.5rem' }}>
          <div style={{ background:'var(--surface2)', borderRadius:10, padding:'1rem', marginBottom:'1.25rem' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, fontSize:13 }}>
              <div><span style={{ color:'var(--muted)' }}>နာမည် — </span>{row.name||'—'}</div>
              <div><span style={{ color:'var(--muted)' }}>Email — </span>{row.email||'—'}</div>
              <div style={{ gridColumn:'1/-1' }}>
                <span style={{ color:'var(--muted)' }}>Facebook — </span>
                {row.facebook ? <a href={row.facebook} target="_blank" rel="noreferrer" style={{ color:'var(--accent)' }}>{row.facebook}</a> : '—'}
              </div>
              <div><span style={{ color:'var(--muted)' }}>Date — </span>{row.createdAt?new Date(row.createdAt).toLocaleString():'—'}</div>
              <div><span style={{ color:'var(--muted)' }}>Abroad — </span>{row.abroad||'—'}</div>
            </div>
          </div>

          <div style={{ marginBottom:'1.25rem' }}>
            <p style={{ fontSize:12, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:10 }}>RIASEC Type</p>
            <div style={{ display:'inline-block', background:'rgba(124,107,255,.15)', color:'#a89bff', fontSize:14, fontWeight:500, padding:'4px 14px', borderRadius:99 }}>{row.riasecType||'—'}</div>
          </div>

          <div style={{ marginBottom:'1.25rem' }}>
            <p style={{ fontSize:12, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:10 }}>RIASEC Scores</p>
            {Object.entries(scores).map(([k,v]) => (
              <div key={k} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                <span style={{ fontSize:12, color:'var(--muted)', width:110, flexShrink:0 }}>{RIASEC_NAMES[k]||k}</span>
                <div style={{ flex:1, background:'var(--surface2)', borderRadius:99, height:8, overflow:'hidden' }}>
                  <div style={{ width:`${Math.round((v/maxS)*100)}%`, height:'100%', background:COLORS[k]||'var(--accent)', borderRadius:99 }} />
                </div>
                <span style={{ fontSize:11, color:'var(--muted)', width:24, textAlign:'right' }}>{v}</span>
              </div>
            ))}
          </div>

          <div>
            <p style={{ fontSize:12, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 }}>Top Career</p>
            <p style={{ fontSize:14, fontWeight:500 }}>{row.topCareer||'—'}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Responses() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      const snap = await getDocs(collection(db, 'responses'))
      const data = []
      snap.forEach(d => data.push({ id:d.id, ...d.data() }))
      data.sort((a,b) => (b.createdAt||0)-(a.createdAt||0))
      setRows(data)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = rows.filter(r => {
    if (!search) return true
    const s = search.toLowerCase()
    return (r.name||'').toLowerCase().includes(s) ||
           (r.email||'').toLowerCase().includes(s) ||
           (r.riasecType||'').toLowerCase().includes(s) ||
           (r.topCareer||'').toLowerCase().includes(s)
  })

  const tc = {}
  rows.forEach(r => { if(r.riasecType) tc[r.riasecType]=(tc[r.riasecType]||0)+1 })
  const topTypes = Object.entries(tc).sort((a,b)=>b[1]-a[1]).slice(0,3)

  const downloadExcel = () => {
    const exData = rows.map(r => ({
      'နာမည်': r.name||'',
      'Email': r.email||'',
      'Facebook': r.facebook||'',
      'RIASEC Type': r.riasecType||'',
      'Top Career': r.topCareer||'',
      'Abroad Pref': r.abroad||'',
      'R Score': r.scores?.R||0,
      'I Score': r.scores?.I||0,
      'A Score': r.scores?.A||0,
      'S Score': r.scores?.S||0,
      'E Score': r.scores?.E||0,
      'C Score': r.scores?.C||0,
      'Date': r.createdAt ? new Date(r.createdAt).toLocaleString() : '',
    }))
    const ws = XLSX.utils.json_to_sheet(exData)
    ws['!cols'] = [20,25,30,25,25,15,8,8,8,8,8,8,20].map(w=>({wch:w}))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Responses')
    XLSX.writeFile(wb, `responses_${new Date().toISOString().slice(0,10)}.xlsx`)
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
        <h2 style={{ fontSize:16, fontWeight:500 }}>User Responses</h2>
        <button onClick={downloadExcel} style={{ background:'var(--accent2)', color:'#04342C', border:'none', padding:'7px 16px', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer' }}>
          📥 Excel Download ({rows.length})
        </button>
      </div>

      {topTypes.length > 0 && (
        <div style={{ display:'flex', gap:12, marginBottom:'1.5rem' }}>
          {topTypes.map(([type,count]) => (
            <div key={type} style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, padding:'1rem 1.25rem', flex:1 }}>
              <div style={{ fontSize:11, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:6 }}>Top Type</div>
              <div style={{ fontSize:18, fontWeight:600 }}>{type}</div>
              <div style={{ fontSize:11, color:'var(--muted)', marginTop:3 }}>{count} responses</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginBottom:'1rem' }}>
        <input
          value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="နာမည်၊ Email၊ RIASEC type ရှာပါ..."
          style={{ width:'100%', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'9px 14px', color:'var(--text)', fontSize:13, outline:'none' }}
        />
      </div>

      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr>{['နာမည်','Email','Facebook','RIASEC','Top Career','Abroad','Date',''].map(h=>(
                <th key={h} style={{ textAlign:'left', padding:'8px 12px', color:'var(--muted)', fontSize:11, textTransform:'uppercase', letterSpacing:'.05em', borderBottom:'1px solid var(--border)' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} style={{ textAlign:'center', padding:'2rem', color:'var(--muted)' }}>Loading...</td></tr>
              ) : filtered.length===0 ? (
                <tr><td colSpan={8} style={{ textAlign:'center', padding:'2rem', color:'var(--muted)', fontSize:13 }}>Response မရှိသေးပါ</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} style={{ borderBottom:'1px solid var(--border)' }}>
                  <td style={{ padding:'10px 12px', fontWeight:500 }}>{r.name||'—'}</td>
                  <td style={{ padding:'10px 12px', fontSize:12, color:'var(--muted)' }}>{r.email||'—'}</td>
                  <td style={{ padding:'10px 12px', fontSize:12 }}>
                    {r.facebook ? <a href={r.facebook} target="_blank" rel="noreferrer" style={{ color:'var(--accent)', textDecoration:'none' }}>🔗 Link</a> : '—'}
                  </td>
                  <td style={{ padding:'10px 12px' }}><span style={{ background:'rgba(124,107,255,.15)', color:'#a89bff', fontSize:11, padding:'2px 8px', borderRadius:99 }}>{r.riasecType||'—'}</span></td>
                  <td style={{ padding:'10px 12px', fontSize:12 }}>{r.topCareer||'—'}</td>
                  <td style={{ padding:'10px 12px', fontSize:12 }}>{r.abroad||'—'}</td>
                  <td style={{ padding:'10px 12px', fontSize:11, color:'var(--muted)' }}>{r.createdAt?new Date(r.createdAt).toLocaleString():'—'}</td>
                  <td style={{ padding:'10px 12px' }}>
                    <button onClick={()=>setDetail(r)} style={{ padding:'4px 10px', borderRadius:6, fontSize:12, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text)', cursor:'pointer' }}>Detail</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {detail && <DetailModal row={detail} onClose={()=>setDetail(null)} />}
    </div>
  )
}
