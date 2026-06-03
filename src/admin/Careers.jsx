import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, getDocs, doc, setDoc, addDoc, deleteDoc } from 'firebase/firestore'

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

export default function Careers() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)

  const showToast = (msg, type='success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2800)
  }

  const load = async () => {
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
    setSaving(true)
    try {
      if (modal._id) await setDoc(doc(db, 'careerTypes', modal._id), data)
      else await addDoc(collection(db, 'careerTypes'), data)
      setModal(null)
      await load()
      showToast('သိမ်းပြီးပါပြီ ✓')
    } catch (e) { showToast('Error: ' + e.message, 'error') }
    setSaving(false)
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
        <button onClick={openAdd} style={{ background:'var(--accent)', color:'#fff', border:'none', padding:'7px 16px', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer' }}>+ ထည့်မည်</button>
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
                  Career data မရှိသေးပါ — <button onClick={openAdd} style={{ background:'var(--accent)', color:'#fff', border:'none', padding:'4px 12px', borderRadius:6, fontSize:12, cursor:'pointer', marginLeft:8 }}>ထည့်မည်</button>
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

      {toast && (
        <div style={{ position:'fixed', bottom:'1.5rem', right:'1.5rem', background:'var(--surface2)', border:`1px solid ${toast.type==='error'?'var(--danger)':'var(--accent2)'}`, color: toast.type==='error'?'var(--danger)':'var(--accent2)', borderRadius:10, padding:'.75rem 1.25rem', fontSize:13, zIndex:200 }}>
          {toast.msg}
        </div>
      )}
    </div>
  )
}
