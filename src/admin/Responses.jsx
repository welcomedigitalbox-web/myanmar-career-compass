import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, getDocs } from 'firebase/firestore'
import * as XLSX from 'xlsx'

const RIASEC_NAMES = { R:'Realistic', I:'Investigative', A:'Artistic', S:'Social', E:'Enterprising', C:'Conventional' }
const COLORS = { R:'#7F77DD', I:'#1D9E75', A:'#D85A30', S:'#378ADD', E:'#BA7517', C:'#888780' }

function generateReportHTML(row, entry) {
  const scores = row.scores || {}
  const maxS = Math.max(...Object.values(scores), 1)
  const today = new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' })
  const abroadMap = { yes:'japan', maybe:'sea', no:'' }
  const countryKey = abroadMap[row.abroad] || 'sea'
  const abroadUnis = row.abroad !== 'no' ? (entry?.abroad?.[countryKey] || []) : []

  const barRows = Object.entries(scores).map(([k,v]) => `
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
      <span style="font-size:12px;color:#666;width:110px;flex-shrink:0">${RIASEC_NAMES[k]||k}</span>
      <div style="flex:1;background:#f0f0f0;border-radius:99px;height:8px;overflow:hidden">
        <div style="width:${Math.round((v/maxS)*100)}%;height:100%;background:${COLORS[k]||'#7c6bff'};border-radius:99px"></div>
      </div>
      <span style="font-size:11px;color:#888;width:24px;text-align:right">${v}</span>
    </div>`).join('')

  const careers = (entry?.careers||[]).map((c,i) => `
    <div style="display:flex;justify-content:space-between;align-items:flex-start;padding:8px 0;border-bottom:${i<(entry.careers.length-1)?'1px solid #f0f0f0':'none'}">
      <div>
        <div style="font-weight:500;font-size:13px;color:#222">${c.t}</div>
        <div style="font-size:12px;color:#888;margin-top:2px">${c.s}</div>
      </div>
      <span style="font-size:11px;background:${c.m>=90?'#e8fdf5':c.m>=85?'#eeedfe':'#e8f1fb'};color:${c.m>=90?'#0f6e56':c.m>=85?'#3C3489':'#0C447C'};padding:2px 8px;border-radius:99px;white-space:nowrap;margin-left:8px">${c.m}% match</span>
    </div>`).join('')

  const majors = (entry?.majors||[]).map(m => `<span style="display:inline-block;font-size:11px;padding:3px 9px;border-radius:99px;background:#eeedfe;color:#3C3489;margin:2px">${m}</span>`).join('')
  const mmUni = (entry?.mm_uni||[]).map(u => `<div style="font-size:12px;color:#555;padding:2px 0">• ${u}</div>`).join('')
  const abroadUniHtml = abroadUnis.map(u => `<div style="font-size:12px;color:#555;padding:2px 0">• ${u}</div>`).join('')
  const mmCats = (entry?.mm||[]).map(m => `<span style="display:inline-block;font-size:11px;padding:3px 9px;border-radius:99px;background:#e8fdf5;color:#0f6e56;margin:2px">${m}</span>`).join('')
  const roadmap = (entry?.road||[]).map((s,i) => `
    <div style="display:flex;gap:10px;margin-bottom:10px">
      <div style="width:22px;height:22px;min-width:22px;border-radius:50%;background:#eeedfe;color:#3C3489;font-size:11px;font-weight:600;display:flex;align-items:center;justify-content:center">${i+1}</div>
      <div style="font-size:13px;color:#555;line-height:1.6;padding-top:2px">${s}</div>
    </div>`).join('')

  return `<!DOCTYPE html>
<html lang="my">
<head>
<meta charset="UTF-8">
<title>Career Report — ${row.name||'User'}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Arial, sans-serif; background: #fff; padding: 20px; color: #222; }
  .card { background: #fff; border: 1px solid #e8e8e8; border-radius: 12px; padding: 1.25rem; margin-bottom: 1rem; }
  .section-lbl { font-size: 11px; font-weight: 600; color: #888; text-transform: uppercase; letter-spacing: .06em; margin: 1rem 0 .5rem; }
  @media print {
    body { padding: 0; }
    .no-print { display: none !important; }
    @page { margin: 1cm; size: A4; }
  }
</style>
</head>
<body>

<div style="text-align:center;margin-bottom:1.5rem;padding:1.5rem;background:linear-gradient(135deg,#7c6bff 0%,#534AB7 100%);border-radius:14px;color:#fff">
  <div style="font-size:32px;margin-bottom:8px">🧭</div>
  <h1 style="font-size:20px;font-weight:700;margin:0 0 4px">Myanmar Career Compass</h1>
  <p style="font-size:13px;opacity:.85;margin:0">RIASEC + မြန်မာ Context Career Result</p>
  <p style="font-size:11px;opacity:.7;margin:6px 0 0">${today}</p>
</div>

<div class="card" style="background:#f8f7ff;border-color:#d8d4ff">
  <div style="display:flex;align-items:center;gap:12px">
    <div style="width:44px;height:44px;border-radius:50%;background:#7c6bff;display:flex;align-items:center;justify-content:center;color:#fff;font-size:16px;font-weight:700;flex-shrink:0">
      ${(row.name||'?')[0].toUpperCase()}
    </div>
    <div>
      <div style="font-weight:600;font-size:15px;color:#3C3489">${row.name||'—'}</div>
      <div style="font-size:12px;color:#534AB7;margin-top:2px">${row.email||'—'}</div>
      ${row.facebook ? `<div style="font-size:11px;color:#7c6bff;margin-top:2px">${row.facebook}</div>` : ''}
    </div>
  </div>
</div>

<div class="card">
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
    <span style="font-size:18px">🧬</span>
    <div>
      <div style="font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.06em">RIASEC Type</div>
      <div style="font-size:16px;font-weight:600;color:#3C3489">${row.riasecType||'—'}</div>
    </div>
  </div>
  <div class="section-lbl">Score ခွဲခြမ်းချက်</div>
  ${barRows}
</div>

<div class="card">
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
    <span style="font-size:18px">💼</span>
    <h3 style="font-size:14px;font-weight:600;margin:0;color:#222">အကိုက်ညီဆုံး Career များ</h3>
  </div>
  ${careers || '<p style="font-size:13px;color:#888">Career data မရှိပါ</p>'}
</div>

<div class="card">
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
    <span style="font-size:18px">🎓</span>
    <h3 style="font-size:14px;font-weight:600;margin:0;color:#222">Major နှင့် တက္ကသိုလ်</h3>
  </div>
  <div style="margin-bottom:10px">${majors}</div>
  ${mmUni ? `<div class="section-lbl">မြန်မာ တက္ကသိုလ်</div>${mmUni}` : ''}
  ${abroadUniHtml ? `<div class="section-lbl">နိုင်ငံရပ်ခြား တက္ကသိုလ်</div>${abroadUniHtml}` : ''}
  ${mmCats ? `<div style="margin-top:10px">${mmCats}</div>` : ''}
</div>

<div class="card">
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">
    <span style="font-size:18px">🗺️</span>
    <h3 style="font-size:14px;font-weight:600;margin:0;color:#222">Career Roadmap</h3>
  </div>
  ${roadmap || '<p style="font-size:13px;color:#888">Roadmap မရှိပါ</p>'}
</div>

${entry?.parent ? `
<div class="card" style="background:#f8f7ff;border-color:#c8c2ff">
  <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
    <span style="font-size:16px">💜</span>
    <h3 style="font-size:14px;font-weight:600;margin:0;color:#3C3489">မိဘများသို့</h3>
  </div>
  <p style="font-size:13px;color:#534AB7;line-height:1.7;margin:0">${entry.parent}</p>
</div>` : ''}

<div style="text-align:center;padding:1rem;border-top:1px solid #eee;margin-top:1rem">
  <p style="font-size:11px;color:#aaa;margin:0">Myanmar Career Compass • ${today}</p>
</div>

<div class="no-print" style="text-align:center;margin-top:1rem">
  <button onclick="window.print()" style="background:#e74c3c;color:#fff;border:none;padding:10px 24px;border-radius:8px;font-size:14px;cursor:pointer">📄 PDF Save လုပ်မည်</button>
</div>

</body>
</html>`
}

function downloadReport(row, entry) {
  const html = generateReportHTML(row, entry)
  const win = window.open('', '_blank')
  win.document.write(html)
  win.document.close()
  setTimeout(() => win.print(), 800)
}

function DetailModal({ row, entry, onClose }) {
  if (!row) return null
  const scores = row.scores || {}
  const maxS = Math.max(...Object.values(scores), 1)

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={e => e.target===e.currentTarget&&onClose()}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, width:520, maxHeight:'85vh', overflowY:'auto' }}>
        <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h3 style={{ fontSize:15, fontWeight:500 }}>{row.name||'—'} ၏ Result</h3>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={() => downloadReport(row, entry)} style={{ background:'#e74c3c', color:'#fff', border:'none', padding:'5px 12px', borderRadius:6, fontSize:12, cursor:'pointer' }}>📄 PDF</button>
            <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--muted)', fontSize:20, cursor:'pointer' }}>×</button>
          </div>
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
  const [careerData, setCareerData] = useState([])
  const [loading, setLoading] = useState(true)
  const [detail, setDetail] = useState(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      const [rSnap, cSnap] = await Promise.all([
        getDocs(collection(db, 'responses')),
        getDocs(collection(db, 'careerTypes')),
      ])
      const responses = []
      rSnap.forEach(d => responses.push({ id:d.id, ...d.data() }))
      responses.sort((a,b) => (b.createdAt||0)-(a.createdAt||0))
      setRows(responses)
      const careers = []
      cSnap.forEach(d => careers.push({ _id:d.id, ...d.data() }))
      setCareerData(careers)
      setLoading(false)
    }
    load()
  }, [])

  const getEntry = (row) => careerData.find(c => c.key === row.matchKey) || careerData[0] || null

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

  const downloadAllExcel = () => {
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

  const btnSm = { padding:'4px 10px', borderRadius:6, fontSize:12, border:'1px solid var(--border)', background:'var(--surface2)', cursor:'pointer' }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
        <h2 style={{ fontSize:16, fontWeight:500 }}>User Responses</h2>
        <button onClick={downloadAllExcel} style={{ background:'var(--accent2)', color:'#04342C', border:'none', padding:'7px 16px', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer' }}>
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
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="နာမည်၊ Email၊ RIASEC type ရှာပါ..." style={{ width:'100%', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:8, padding:'9px 14px', color:'var(--text)', fontSize:13, outline:'none' }} />
      </div>

      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr>{['နာမည်','Email','Facebook','RIASEC','Top Career','Date','Actions'].map(h=>(
                <th key={h} style={{ textAlign:'left', padding:'8px 12px', color:'var(--muted)', fontSize:11, textTransform:'uppercase', letterSpacing:'.05em', borderBottom:'1px solid var(--border)' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign:'center', padding:'2rem', color:'var(--muted)' }}>Loading...</td></tr>
              ) : filtered.length===0 ? (
                <tr><td colSpan={7} style={{ textAlign:'center', padding:'2rem', color:'var(--muted)', fontSize:13 }}>Response မရှိသေးပါ</td></tr>
              ) : filtered.map(r => (
                <tr key={r.id} style={{ borderBottom:'1px solid var(--border)' }}>
                  <td style={{ padding:'10px 12px', fontWeight:500 }}>{r.name||'—'}</td>
                  <td style={{ padding:'10px 12px', fontSize:12, color:'var(--muted)' }}>{r.email||'—'}</td>
                  <td style={{ padding:'10px 12px', fontSize:12 }}>
                    {r.facebook ? <a href={r.facebook} target="_blank" rel="noreferrer" style={{ color:'var(--accent)', textDecoration:'none' }}>🔗 Link</a> : '—'}
                  </td>
                  <td style={{ padding:'10px 12px' }}>
                    <span style={{ background:'rgba(124,107,255,.15)', color:'#a89bff', fontSize:11, padding:'2px 8px', borderRadius:99 }}>{r.riasecType||'—'}</span>
                  </td>
                  <td style={{ padding:'10px 12px', fontSize:12 }}>{r.topCareer||'—'}</td>
                  <td style={{ padding:'10px 12px', fontSize:11, color:'var(--muted)' }}>{r.createdAt?new Date(r.createdAt).toLocaleString():'—'}</td>
                  <td style={{ padding:'10px 12px' }}>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={()=>setDetail(r)} style={{ ...btnSm, color:'var(--text)' }}>Detail</button>
                      <button onClick={()=>downloadReport(r, getEntry(r))} style={{ ...btnSm, color:'#e74c3c', borderColor:'#e74c3c' }}>📄 PDF</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {detail && <DetailModal row={detail} entry={getEntry(detail)} onClose={()=>setDetail(null)} />}
    </div>
  )
}
