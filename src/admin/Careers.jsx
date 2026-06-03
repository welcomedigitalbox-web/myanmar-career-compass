import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, getDocs, doc, setDoc, addDoc, deleteDoc } from 'firebase/firestore'
import * as XLSX from 'xlsx'

const EMPTY = { key:'', type:'', careers:'[]', majors:'', mm:'', mm_uni:'', japan:'', sea:'', aus:'', eu:'', road:'', parent:'' }

function Modal({ data, onChange, onSave, onClose }) {
  const fields = [
    { id:'key', label:'RIASEC Key', placeholder:'RI / AE / SE', half:true },
    { id:'type', label:'Type Name', placeholder:'Investigative-Realistic (IR)', half:true },
    { id:'careers', label:'Careers (JSON)', placeholder:'[{"t":"Data Scientist","s":"ကျပ်သိန်း ၁၀-၄၀","m":92}]', textarea:true, rows:4 },
    { id:'majors', label:'Majors (comma separated)', placeholder:'Computer Science, Data Science' },
    { id:'mm', label:'Myanmar Categories (comma separated)', placeholder:'IT, Science and Mathematics' },
    { id:'mm_uni', label:'Myanmar Universities (comma separated)', placeholder:'ရန်ကုန် နည်းပညာတက္ကသိုလ်' },
    { id:'japan', label:'Japan Universities', placeholder:'Tokyo Tech, Waseda', half:true },
    { id:'sea', label:'SEA Universities', placeholder:'NUS, Mahidol', half:true },
    { id:'aus', label:'Australia/NZ', placeholder:'Melbourne, UNSW', half:true },
    { id:'eu', label:'EU/UK', placeholder:'Edinburgh, TU Munich', half:true },
    { id:'road', label:'Roadmap (one step per line)', placeholder:'အဆင့် ၁: ...\nအဆင့် ၂: ...', textarea:true, rows:5 },
    { id:'parent', label:'Parent Advice', placeholder:'မိဘများသို့ အကြံပေးချက်...', textarea:true },
  ]
  const inputStyle = { width:'100%', background:'var(--bg)', border:'1px solid var(--border)', borderRadius:8, padding:'8px 12px', color:'var(--text)', fontSize:13, outline:'none', resize:'vertical' }
  const pairs = []
  const singles = []
  fields.forEach(f => f.half ? pairs.push(f) : singles.push(f))
  const pairedRows = []
  for (let i = 0; i < pairs.length; i += 2) pairedRows.push([pairs[i], pairs[i+1]])

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, width:580, maxHeight:'85vh', overflowY:'auto' }}>
        <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h3 style={{ fontSize:15, fontWeight:500 }}>{data._id ? 'Career Type ပြင်ဆင်မည်' : 'Career Type အသစ် ထည့်မည်'}</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--muted)', fontSize:20, cursor:'pointer' }}>×</button>
        </div>
        <div style={{ padding:'1.5rem' }}>
          {pairedRows.map((row, i) => (
            <div key={i} style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {row.map(f => f && (
                <div key={f.id} style={{ marginBottom:'1rem' }}>
                  <label style={{ fontSize:12, color:'var(--muted)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.05em' }}>{f.label}</label>
                  <input value={data[f.id]} onChange={e => onChange(f.id, e.target.value)} placeholder={f.placeholder} style={inputStyle} />
                </div>
              ))}
            </div>
          ))}
          {singles.map(f => (
            <div key={f.id} style={{ marginBottom:'1rem' }}>
              <label style={{ fontSize:12, color:'var(--muted)', display:'block', marginBottom:5, textTransform:'uppercase', letterSpacing:'.05em' }}>{f.label}</label>
              {f.textarea
                ? <textarea value={data[f.id]} onChange={e => onChange(f.id, e.target.value)} placeholder={f.placeholder} rows={f.rows||3} style={inputStyle} />
                : <input value={data[f.id]} onChange={e => onChange(f.id, e.target.value)} placeholder={f.placeholder} style={inputStyle} />
              }
            </div>
          ))}
        </div>
        <div style={{ padding:'1rem 1.5rem', borderTop:'1px solid var(--border)', display:'flex', justifyContent:'flex-end', gap:8 }}>
          <button onClick={onClose} style={{ padding:'6px 14px', borderRadius:6, fontSize:12, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text)', cursor:'pointer' }}>ပယ်ဖျက်</button>
          <button onClick={onSave} style={{ padding:'7px 16px', borderRadius:8, fontSize:13, fontWeight:500, background:'var(--accent)', color:'#fff', border:'none', cursor:'pointer' }}>သိမ်းမည်</button>
        </div>
      </div>
    </div>
  )
}

function UploadModal({ onClose, onDone }) {
  const [status, setStatus] = useState('idle')
  const [log, setLog] = useState([])
  const [preview, setPreview] = useState([])

  const downloadTemplate = () => {
    const headers = [
      'key','type',
      'career1_title','career1_salary','career1_match',
      'career2_title','career2_salary','career2_match',
      'career3_title','career3_salary','career3_match',
      'career4_title','career4_salary','career4_match',
      'majors','mm_categories','mm_universities',
      'japan_unis','sea_unis','aus_unis','eu_unis',
      'roadmap','parent_advice'
    ]
    const sample = [
      'RI','Realistic-Investigative (RI)',
      'Data Scientist','ကျပ်သိန်း ၁၀-၄၀',92,
      'Software Engineer','ကျပ်သိန်း ၈-၃၀',88,
      'Cybersecurity Analyst','ကျပ်သိန်း ၁၀-၃၀',85,
      'Network Engineer','ကျပ်သိန်း ၅-၂၀',80,
      'Computer Science | Data Science | AI/ML',
      'Information Technology | Engineering',
      'ရန်ကုန် နည်းပညာတက္ကသိုလ် | မန္တလေး နည်းပညာတက္ကသိုလ်',
      'Tokyo Tech | Osaka University',
      'NUS Singapore | Mahidol University',
      'University of Melbourne | ANU',
      'TU Munich | University of Edinburgh',
      'အဆင့် ၁: သင်္ချာ ပြင်ဆင်ပါ | အဆင့် ၂: Python သင်ပါ | အဆင့် ၃: IELTS ပြင်ဆင်ပါ',
      'သင်္ချာဝါသနာပါသောကလေးများကို Data Science နယ်ပယ် ဆက်လေ့လာပါ'
    ]
    const ws = XLSX.utils.aoa_to_sheet([headers, sample])
    ws['!cols'] = headers.map(() => ({ wch: 25 }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'CareerTypes')
    XLSX.writeFile(wb, 'career_types_template.xlsx')
  }

  const handleFile = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setStatus('parsing')
    setLog([])
    setPreview([])

    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const wb = XLSX.read(ev.target.result, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(ws)

        const parsed = rows.map(r => {
          const sp = (v) => v ? String(v).split('|').map(s => s.trim()).filter(Boolean) : []
          return {
            key: String(r.key || '').trim(),
            type: String(r.type || '').trim(),
            careers: [
              r.career1_title && { t: r.career1_title, s: r.career1_salary || '', m: Number(r.career1_match) || 80 },
              r.career2_title && { t: r.career2_title, s: r.career2_salary || '', m: Number(r.career2_match) || 78 },
              r.career3_title && { t: r.career3_title, s: r.career3_salary || '', m: Number(r.career3_match) || 76 },
              r.career4_title && { t: r.career4_title, s: r.career4_salary || '', m: Number(r.career4_match) || 74 },
            ].filter(Boolean),
            majors: sp(r.majors),
            mm: sp(r.mm_categories),
            mm_uni: sp(r.mm_universities),
            abroad: {
              japan: sp(r.japan_unis),
              sea: sp(r.sea_unis),
              aus: sp(r.aus_unis),
              eu: sp(r.eu_unis),
            },
            road: sp(r.roadmap),
            parent: String(r.parent_advice || '').trim(),
            updatedAt: Date.now(),
          }
        }).filter(r => r.key && r.type)

        setPreview(parsed)
        setStatus('preview')
      } catch (err) {
        setStatus('error')
        setLog([`Error: ${err.message}`])
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleUpload = async () => {
    setStatus('uploading')
    const logs = []
    for (const d of preview) {
      try {
        await addDoc(collection(db, 'careerTypes'), d)
        logs.push(`✓ ${d.key} — ${d.type}`)
      } catch (e) {
        logs.push(`✗ ${d.key} — ${e.message}`)
      }
      setLog([...logs])
    }
    setStatus('done')
    setTimeout(() => { onDone(); onClose() }, 1500)
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:100, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:14, width:560, maxHeight:'85vh', overflowY:'auto' }}>
        <div style={{ padding:'1.25rem 1.5rem', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h3 style={{ fontSize:15, fontWeight:500 }}>Excel မှ Career Data Upload</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', color:'var(--muted)', fontSize:20, cursor:'pointer' }}>×</button>
        </div>
        <div style={{ padding:'1.5rem' }}>

          <div style={{ background:'var(--surface2)', borderRadius:10, padding:'1rem', marginBottom:'1.25rem', fontSize:13 }}>
            <p style={{ fontWeight:500, marginBottom:6 }}>အသုံးပြုနည်း</p>
            <ol style={{ color:'var(--muted)', paddingLeft:'1.25rem', lineHeight:2 }}>
              <li>Template download ယူပါ</li>
              <li>Excel မှာ career data ဖြည့်ပါ (| နဲ့ ခွဲပါ)</li>
              <li>File ကို upload လုပ်ပါ</li>
            </ol>
          </div>

          <button onClick={downloadTemplate} style={{ width:'100%', padding:'10px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text)', fontSize:13, cursor:'pointer', marginBottom:'1rem', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
            📥 Template Download ယူပါ
          </button>

          <div style={{ border:'2px dashed var(--border)', borderRadius:10, padding:'1.5rem', textAlign:'center', marginBottom:'1rem' }}>
            <input type="file" accept=".xlsx,.xls" onChange={handleFile} id="xlfile" style={{ display:'none' }} />
            <label htmlFor="xlfile" style={{ cursor:'pointer' }}>
              <div style={{ fontSize:28, marginBottom:8 }}>📂</div>
              <div style={{ fontSize:13, color:'var(--muted)' }}>Excel file ရွေးချယ်ရန် နှိပ်ပါ</div>
              <div style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>.xlsx / .xls</div>
            </label>
          </div>

          {status === 'preview' && preview.length > 0 && (
            <div style={{ marginBottom:'1rem' }}>
              <p style={{ fontSize:13, fontWeight:500, marginBottom:8 }}>Preview — {preview.length} rows တွေ့ပြီ</p>
              <div style={{ background:'var(--surface2)', borderRadius:8, padding:'0.75rem', maxHeight:160, overflowY:'auto' }}>
                {preview.map((r, i) => (
                  <div key={i} style={{ fontSize:12, color:'var(--muted)', padding:'3px 0', borderBottom:'1px solid var(--border)' }}>
                    <span style={{ color:'var(--accent)', marginRight:8 }}>{r.key}</span>{r.type} — {r.careers.length} careers
                  </div>
                ))}
              </div>
              <button onClick={handleUpload} style={{ width:'100%', marginTop:'1rem', padding:'10px', borderRadius:8, background:'var(--accent)', color:'#fff', border:'none', fontSize:13, fontWeight:500, cursor:'pointer' }}>
                🚀 Firebase ထဲ Upload လုပ်မည်
              </button>
            </div>
          )}

          {log.length > 0 && (
            <div style={{ background:'var(--surface2)', borderRadius:8, padding:'0.75rem', maxHeight:150, overflowY:'auto' }}>
              {log.map((l, i) => (
                <div key={i} style={{ fontSize:12, color: l.startsWith('✓') ? 'var(--accent2)' : 'var(--danger)', padding:'2px 0' }}>{l}</div>
              ))}
            </div>
          )}

          {status === 'done' && (
            <div style={{ textAlign:'center', padding:'1rem', color:'var(--accent2)', fontSize:14, fontWeight:500 }}>
              🎉 Upload ပြီးပါပြီ!
            </div>
          )}

          {status === 'error' && (
            <div style={{ color:'var(--danger)', fontSize:13 }}>File format မှားသည် — template ကို သုံးပါ</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function Careers() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [showUpload, setShowUpload] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type='success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2800)
  }

  const load = async () => {
    setLoading(true)
    const snap = await getDocs(collection(db, 'careerTypes'))
    const data = []
    snap.forEach(d => data.push({ _id: d.id, ...d.data() }))
    setRows(data)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const openAdd = () => setModal({ ...EMPTY })
  const openEdit = row => setModal({
    _id: row._id,
    key: row.key || '',
    type: row.type || '',
    careers: JSON.stringify(row.careers || [], null, 2),
    majors: (row.majors || []).join(', '),
    mm: (row.mm || []).join(', '),
    mm_uni: (row.mm_uni || []).join(', '),
    japan: (row.abroad?.japan || []).join(', '),
    sea: (row.abroad?.sea || []).join(', '),
    aus: (row.abroad?.aus || []).join(', '),
    eu: (row.abroad?.eu || []).join(', '),
    road: (row.road || []).join('\n'),
    parent: row.parent || '',
  })

  const onChange = (field, val) => setModal(m => ({ ...m, [field]: val }))

  const onSave = async () => {
    let careers
    try { careers = JSON.parse(modal.careers || '[]') }
    catch { showToast('Careers JSON format မှားသည်', 'error'); return }
    const data = {
      key: modal.key.trim(),
      type: modal.type.trim(),
      careers,
      majors: modal.majors.split(',').map(s => s.trim()).filter(Boolean),
      mm: modal.mm.split(',').map(s => s.trim()).filter(Boolean),
      mm_uni: modal.mm_uni.split(',').map(s => s.trim()).filter(Boolean),
      abroad: {
        japan: modal.japan.split(',').map(s => s.trim()).filter(Boolean),
        sea: modal.sea.split(',').map(s => s.trim()).filter(Boolean),
        aus: modal.aus.split(',').map(s => s.trim()).filter(Boolean),
        eu: modal.eu.split(',').map(s => s.trim()).filter(Boolean),
      },
      road: modal.road.split('\n').map(s => s.trim()).filter(Boolean),
      parent: modal.parent.trim(),
      updatedAt: Date.now(),
    }
    try {
      if (modal._id) await setDoc(doc(db, 'careerTypes', modal._id), data)
      else await addDoc(collection(db, 'careerTypes'), data)
      setModal(null)
      await load()
      showToast('သိမ်းပြီးပါပြီ ✓')
    } catch (e) { showToast('Error: ' + e.message, 'error') }
  }

  const onDelete = async (id) => {
    if (!confirm('ဤ Career Type ကို ဖျက်မည်လား?')) return
    await deleteDoc(doc(db, 'careerTypes', id))
    await load()
    showToast('ဖျက်ပြီးပါပြီ')
  }

  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.25rem' }}>
        <h2 style={{ fontSize:16, fontWeight:500 }}>Career Types</h2>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={() => setShowUpload(true)} style={{ padding:'7px 14px', borderRadius:8, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text)', fontSize:13, cursor:'pointer' }}>📥 Excel Upload</button>
          <button onClick={openAdd} style={{ background:'var(--accent)', color:'#fff', border:'none', padding:'7px 16px', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer' }}>+ ထည့်မည်</button>
        </div>
      </div>

      <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, overflow:'hidden' }}>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr>{['Key','Type Name','Careers','Myanmar Categories',''].map(h => (
                <th key={h} style={{ textAlign:'left', padding:'8px 12px', color:'var(--muted)', fontSize:11, textTransform:'uppercase', letterSpacing:'.05em', borderBottom:'1px solid var(--border)' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ textAlign:'center', padding:'2rem', color:'var(--muted)' }}>Loading...</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} style={{ textAlign:'center', padding:'2rem', color:'var(--muted)', fontSize:13 }}>
                  Career data မရှိသေးပါ — Excel upload သို့မဟုတ် manually ထည့်ပါ
                </td></tr>
              ) : rows.map(r => (
                <tr key={r._id} style={{ borderBottom:'1px solid var(--border)' }}>
                  <td style={{ padding:'10px 12px' }}><span style={{ background:'rgba(124,107,255,.15)', color:'#a89bff', fontSize:11, padding:'2px 8px', borderRadius:99, fontFamily:'monospace' }}>{r.key || r._id}</span></td>
                  <td style={{ padding:'10px 12px' }}>{r.type || '—'}</td>
                  <td style={{ padding:'10px 12px', color:'var(--muted)', fontSize:12 }}>{(r.careers || []).length} careers</td>
                  <td style={{ padding:'10px 12px', fontSize:12 }}>{(r.mm || []).slice(0, 2).join(', ')}</td>
                  <td style={{ padding:'10px 12px', display:'flex', gap:6 }}>
                    <button onClick={() => openEdit(r)} style={{ padding:'4px 10px', borderRadius:6, fontSize:12, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--text)', cursor:'pointer' }}>Edit</button>
                    <button onClick={() => onDelete(r._id)} style={{ padding:'4px 10px', borderRadius:6, fontSize:12, border:'1px solid var(--border)', background:'var(--surface2)', color:'var(--danger)', cursor:'pointer' }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && <Modal data={modal} onChange={onChange} onSave={onSave} onClose={() => setModal(null)} />}
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} onDone={() => { load(); showToast('Upload ပြီးပါပြီ ✓') }} />}

      {toast && (
        <div style={{ position:'fixed', bottom:'1.5rem', right:'1.5rem', background:'var(--surface2)', border:`1px solid ${toast.type==='error'?'var(--danger)':'var(--accent2)'}`, color: toast.type==='error'?'var(--danger)':'var(--accent2)', borderRadius:10, padding:'.75rem 1.25rem', fontSize:13, zIndex:200 }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
