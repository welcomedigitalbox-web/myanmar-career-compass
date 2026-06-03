import { useState, useEffect } from 'react'
import { db } from '../firebase'
import { collection, getDocs, addDoc } from 'firebase/firestore'
import Result from './Result'

const RQ = [
  { q:'လက်တွေ့ ကိရိယာ၊ စက်ပစ္စည်း သို့မဟုတ် နည်းပညာနဲ့ အလုပ်လုပ်ရသည်ကို နှစ်သက်သလား?', t:'R' },
  { q:'သင်္ချာ၊ ဒေတာ ခွဲခြမ်းခြင်း သို့မဟုတ် သိပ္ပံပုစ္ဆာများ ဖြေဆိုရသည်ကို နှစ်သက်သလား?', t:'I' },
  { q:'ပန်းချီ၊ ဒီဇိုင်း၊ ဂီတ သို့မဟုတ် ဖန်တီးရေးသားခြင်း နှစ်သက်သလား?', t:'A' },
  { q:'လူများကို သင်ကြား၊ ကူညီ သို့မဟုတ် ဆေးကုသပေးရသည်ကို နှစ်သက်သလား?', t:'S' },
  { q:'စီမံ၊ ခေါင်းဆောင် သို့မဟုတ် team ကို ဦးဆောင်ရသည်ကို နှစ်သက်သလား?', t:'E' },
  { q:'မှတ်တမ်းသွင်း၊ ဒေတာစီမံ သို့မဟုတ် စနစ်တကျ အလုပ်လုပ်ရသည်ကို နှစ်သက်သလား?', t:'C' },
  { q:'အဆောက်အအုံ၊ ကွန်ရက် သို့မဟုတ် hardware ပြင်ဆင်တည်ဆောက်ရသည်ကို နှစ်သက်သလား?', t:'R' },
  { q:'သုတေသန၊ စစ်တမ်းကောက်ယူ သို့မဟုတ် ဆေးပညာဆိုင်ရာ လေ့လာမှု နှစ်သက်သလား?', t:'I' },
  { q:'ကိုယ်ပိုင်ဖန်တီးနိုင်မှု အပြည့်ရှိသည့် အလုပ်မျိုး နှစ်သက်သလား?', t:'A' },
  { q:'လူ့အဖွဲ့အစည်း၊ NGO သို့မဟုတ် ကျန်းမာရေးဝန်ဆောင်မှု နယ်ပယ် ဆွဲဆောင်မှုရှိသလား?', t:'S' },
  { q:'ရောင်းဝယ်ရေး၊ တင်ဒါ သို့မဟုတ် Business တည်ထောင်ခြင်း နှစ်သက်သလား?', t:'E' },
  { q:'စာရင်းကိုင်၊ ဘဏ္ဍာရေး သို့မဟုတ် ရုံးလုပ်ငန်း procedures နှစ်သက်သလား?', t:'C' },
]

const MQ = [
  { q:'မင်းဘာကို ပိုကောင်းသည်ဟု ထင်သလဲ?', o:['ကိန်းဂဏန်း / Logic','ဖန်တီးနိုင်မှု / Design','ဆက်သွယ်ရေး / ခေါင်းဆောင်','လက်တွေ့ / နည်းပညာ'], k:'strength' },
  { q:'မိဘဆန္ဒနှင့် ကိုယ်ဝါသနာ မကိုက်ညီပါက?', o:['မိဘဆန္ဒ လိုက်နာမည်','ကိုယ်ဝါသနာ ဦးစားပေး','နှစ်ခုပေါင်းစပ် လမ်းကြောင်းရှာ','မသိသေး'], k:'parent' },
  { q:'ငွေကြေးဆိုင်ရာ ဦးစားပေးမှု?', o:['အမြင့်ဆုံး လစာ','တည်ငြိမ်သော ဝင်ငွေ','ကိုယ်ပိုင်လုပ်ငန်း','ဝါသနာပါသည့်အလုပ်'], k:'money' },
  { q:'ဘယ်ပတ်ဝန်းကျင်မှာ အကောင်းဆုံး လုပ်ဆောင်နိုင်သလဲ?', o:['တစ်ယောက်တည်း တိတ်ဆိတ်','အဖွဲ့နှင့် ပူးပေါင်း','လူများနှင့် အဆက်မပြတ်','ကွင်းဆင်း / ခရီးသွား'], k:'env' },
  { q:'Study Abroad ဘတ်ဂျက်?', o:['USD 10k အောက် (Scholarship)','USD 10k–25k','USD 25k–50k','မြန်မာပြည်တွင်ပဲ'], k:'budget' },
  { q:'ဘယ်နိုင်ငံ/ဒေသ ပိုနှစ်သက်သလဲ?', o:['ဂျပန် / တောင်ကိုရီးယား / တရုတ်','မလေးရှား / သင်္ကာပူ / ထိုင်း','ဩစတြေးလျ / ဗြိတိန် / ဥရောပ','မြန်မာပြည်တွင်ပဲ'], k:'country' },
  { q:'Career ရှာဖွေရာတွင် ဘာကို အဓိကထားသလဲ?', o:['ဝင်ငွေ + Work-Life Balance','ကမ္ဘာ့ပြောင်းလဲမှုတွင် ပါဝင်','မြန်မာဖွံ့ဖြိုးရေး ပူးပေါင်း','Passion ဦးစားပေး'], k:'priority' },
  { q:'အနာဂတ်အိပ်မက်?', o:['ကမ္ဘာ့နာမည်ကြီး ကုမ္ပဏီ Expert','ကိုယ်ပိုင် Business CEO','လူ့အဖွဲ့အစည်းကူညီ','ကမ္ဘာ့အဆင့်မီ ပညာရှင်'], k:'dream' },
]

const ALL_Q = [...RQ, ...MQ]
const RIASEC_PAIRS = ['RI','RE','IS','AE','SE','EC','SC','AC']

function getMatchKey(scores) {
  return RIASEC_PAIRS.map(k => ({ k, v: scores[k[0]] + scores[k[1]] }))
    .sort((a, b) => b.v - a.v)[0].k
}

function getDBEntry(careerData, scores) {
  const key = getMatchKey(scores)
  return careerData.find(d => d.key === key) || careerData[0] || null
}

export default function CareerTest() {
  const [careerData, setCareerData] = useState([])
  const [dbLoading, setDbLoading] = useState(true)
  const [cur, setCur] = useState(-1)
  const [ans, setAns] = useState({})
  const [abroad, setAbroad] = useState('yes')
  const [result, setResult] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getDocs(collection(db, 'careerTypes')).then(snap => {
      const data = []
      snap.forEach(d => data.push({ _id: d.id, ...d.data() }))
      setCareerData(data)
      setDbLoading(false)
    })
  }, [])

  const scores = { R:0, I:0, A:0, S:0, E:0, C:0 }
  RQ.forEach((q, i) => { if (ans[i] !== undefined) scores[q.t] += [3,2,1,0][ans[i]] })

  const pick = (qi, oi) => setAns(a => ({ ...a, [qi]: oi }))

  const finish = async () => {
    setSaving(true)
    const matchKey = getMatchKey(scores)
    const entry = getDBEntry(careerData, scores)
    const countryKey = ['japan','sea','aus','eu'][ans[RQ.length + 5] ?? 1]
    const topCareer = (entry?.careers?.[0]?.t) || '—'
    try {
      await addDoc(collection(db, 'responses'), {
        riasecType: entry?.type || matchKey,
        topCareer,
        abroad,
        scores: { ...scores },
        mmAnswers: Object.fromEntries(MQ.map((q, i) => [q.k, ans[RQ.length + i] ?? 0])),
        createdAt: Date.now(),
      })
    } catch(e) { console.error(e) }
    setResult({ entry, scores, countryKey, abroad })
    setSaving(false)
  }

  if (result) return <Result result={result} onRetry={() => { setResult(null); setCur(-1); setAns({}); setAbroad('yes') }} />

  const q = ALL_Q[cur]
  const isRiasec = cur < RQ.length
  const opts = isRiasec ? ['အရမ်းနှစ်သက်','နှစ်သက်','သာမန်','မနှစ်သက်'] : q?.o
  const total = ALL_Q.length
  const pct = cur >= 0 ? Math.round(((cur + 1) / total) * 100) : 0

  const btnStyle = (active) => ({
    width:'100%', textAlign:'left', padding:'12px 14px', marginBottom:8,
    background: active ? '#EEEDFE' : 'transparent',
    border: active ? '1.5px solid #7F77DD' : '1px solid var(--border)',
    borderRadius:10, color: active ? '#3C3489' : 'var(--text)',
    fontSize:14, cursor:'pointer', transition:'all .15s', lineHeight:1.5,
  })

  if (cur === -1) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'1.5rem' }}>
      <div style={{ maxWidth:480, width:'100%' }}>
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>🧭</div>
          <h1 style={{ fontSize:24, fontWeight:600, marginBottom:8 }}>Myanmar Career Compass</h1>
          <p style={{ fontSize:14, color:'var(--muted)', lineHeight:1.7 }}>RIASEC + မြန်မာ Context ပေါင်းစပ်ထားသော Career Test<br/>မေးခွန်း {total} ခု — မိနစ် ၅ ခန့်</p>
        </div>

        {dbLoading ? (
          <p style={{ textAlign:'center', color:'var(--muted)', fontSize:13 }}>Career data loading...</p>
        ) : careerData.length === 0 ? (
          <div style={{ background:'rgba(255,92,92,.1)', border:'1px solid var(--danger)', borderRadius:10, padding:'1rem', fontSize:13, color:'var(--danger)', textAlign:'center', marginBottom:'1.5rem' }}>
            Admin Panel မှ Career data ထည့်ပါ
          </div>
        ) : null}

        <div style={{ marginBottom:'1.5rem' }}>
          <p style={{ fontSize:13, color:'var(--muted)', marginBottom:10 }}>နိုင်ငံရပ်ခြားပညာရေး ဦးစားပေးမှု</p>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            {[['yes','သွားချင်သည်'],['maybe','ဆိုင်မဆိုင် ကြည့်မည်'],['no','မြန်မာပြည်တွင်ပဲ']].map(([v,l]) => (
              <button key={v} onClick={() => setAbroad(v)} style={{ padding:'7px 14px', borderRadius:99, border: abroad===v ? '1.5px solid var(--accent)' : '1px solid var(--border)', background: abroad===v ? 'rgba(124,107,255,.1)' : 'transparent', color: abroad===v ? 'var(--accent)' : 'var(--muted)', fontSize:13, cursor:'pointer' }}>{l}</button>
            ))}
          </div>
        </div>

        <button onClick={() => setCur(0)} disabled={careerData.length === 0} style={{ width:'100%', background:'var(--accent)', color:'#fff', border:'none', borderRadius:10, padding:14, fontSize:15, fontWeight:500, cursor:'pointer', opacity: careerData.length===0 ? .5 : 1 }}>
          စတင်မည် →
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', padding:'1.5rem' }}>
      <div style={{ maxWidth:520, width:'100%' }}>
        <div style={{ background:'var(--border)', borderRadius:99, height:5, marginBottom:'1.5rem', overflow:'hidden' }}>
          <div style={{ width:`${pct}%`, height:'100%', background:'var(--accent)', borderRadius:99, transition:'width .4s' }} />
        </div>

        <div style={{ display:'inline-flex', alignItems:'center', gap:6, fontSize:12, padding:'4px 12px', borderRadius:99, marginBottom:'1rem', background: isRiasec ? 'rgba(124,107,255,.12)' : 'rgba(0,212,160,.1)', color: isRiasec ? '#a89bff' : 'var(--accent2)' }}>
          {isRiasec ? '🧠 Phase 1 — RIASEC' : '🇲🇲 Phase 2 — မြန်မာ Context'}
        </div>

        <p style={{ fontSize:12, color:'var(--muted)', marginBottom:8 }}>မေးခွန်း {cur+1} / {total}</p>
        <p style={{ fontSize:17, fontWeight:500, marginBottom:'1.5rem', lineHeight:1.6 }}>{q.q}</p>

        <div>
          {opts.map((o, i) => (
            <button key={i} onClick={() => pick(cur, i)} style={btnStyle(ans[cur] === i)}>{o}</button>
          ))}
        </div>

        <div style={{ display:'flex', justifyContent:'space-between', marginTop:'1.25rem' }}>
          <button onClick={() => setCur(c => c-1)} disabled={cur === 0} style={{ padding:'8px 18px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--text)', fontSize:13, cursor:'pointer', opacity: cur===0 ? .4 : 1 }}>← နောက်</button>
          <button
            onClick={cur === total-1 ? finish : () => setCur(c => c+1)}
            disabled={ans[cur] === undefined || saving}
            style={{ padding:'8px 18px', borderRadius:8, border:'none', background:'var(--accent)', color:'#fff', fontSize:13, fontWeight:500, cursor:'pointer', opacity: ans[cur]===undefined ? .4 : 1 }}
          >
            {saving ? 'Saving...' : cur === total-1 ? 'ရလဒ်ကြည့်မည် ✓' : 'ရှေ့ →'}
          </button>
        </div>
      </div>
    </div>
  )
}
