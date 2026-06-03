const COLORS = { R:'#7F77DD', I:'#1D9E75', A:'#D85A30', S:'#378ADD', E:'#BA7517', C:'#888780' }
const NAMES = { R:'Realistic', I:'Investigative', A:'Artistic', S:'Social', E:'Enterprising', C:'Conventional' }

function BarRow({ label, value, max, color }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
      <span style={{ fontSize:12, color:'var(--muted)', width:120, flexShrink:0 }}>{label}</span>
      <div style={{ flex:1, background:'var(--surface2)', borderRadius:99, height:8, overflow:'hidden' }}>
        <div style={{ width:`${Math.round((value/max)*100)}%`, height:'100%', background:color, borderRadius:99, transition:'width .6s' }} />
      </div>
      <span style={{ fontSize:11, color:'var(--muted)', width:28, textAlign:'right' }}>{value}</span>
    </div>
  )
}

function Card({ children, style }) {
  return (
    <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12, padding:'1.25rem', marginBottom:'.875rem', ...style }}>
      {children}
    </div>
  )
}

function SectionLabel({ children }) {
  return <div style={{ fontSize:11, fontWeight:500, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.06em', margin:'1rem 0 .5rem' }}>{children}</div>
}

export default function Result({ result, onRetry }) {
  const { entry, scores, countryKey, abroad } = result

  if (!entry) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ textAlign:'center' }}>
        <p style={{ color:'var(--muted)', marginBottom:'1rem' }}>Career data မရှိသေးပါ</p>
        <button onClick={onRetry} style={{ background:'var(--accent)', color:'#fff', border:'none', padding:'8px 18px', borderRadius:8, cursor:'pointer' }}>ပြန်သွားမည်</button>
      </div>
    </div>
  )

  const maxScore = Math.max(...Object.values(scores), 1)
  const abroadUnis = abroad !== 'no' ? (entry.abroad?.[countryKey] || []) : []

  return (
    <div style={{ minHeight:'100vh', padding:'2rem 1.5rem' }}>
      <div style={{ maxWidth:600, margin:'0 auto' }}>
        <div style={{ textAlign:'center', marginBottom:'2rem' }}>
          <div style={{ fontSize:32, marginBottom:8 }}>🎯</div>
          <h1 style={{ fontSize:20, fontWeight:600, marginBottom:4 }}>သင်၏ Career Result</h1>
          <p style={{ fontSize:13, color:'var(--muted)' }}>RIASEC + မြန်မာ Context ပေါင်းစပ် ခွဲခြမ်းချက်</p>
        </div>

        <Card>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <span style={{ fontSize:18 }}>🧬</span>
            <h3 style={{ fontSize:14, fontWeight:500 }}>RIASEC Type: {entry.type}</h3>
          </div>
          <SectionLabel>Score ခွဲခြမ်းချက်</SectionLabel>
          {Object.entries(scores).map(([k, v]) => (
            <BarRow key={k} label={NAMES[k]} value={v} max={maxScore} color={COLORS[k]} />
          ))}
        </Card>

        <Card>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <span style={{ fontSize:18 }}>💼</span>
            <h3 style={{ fontSize:14, fontWeight:500 }}>အကိုက်ညီဆုံး Career များ</h3>
          </div>
          {(entry.careers || []).map((c, i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'8px 0', borderBottom: i < entry.careers.length-1 ? '1px solid var(--border)' : 'none' }}>
              <div>
                <div style={{ fontWeight:500, fontSize:13 }}>{c.t}</div>
                <div style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>{c.s}</div>
              </div>
              <span style={{ fontSize:11, background: c.m>=90?'rgba(0,212,160,.12)':c.m>=85?'rgba(124,107,255,.12)':'rgba(55,138,221,.12)', color: c.m>=90?'var(--accent2)':c.m>=85?'#a89bff':'#60a5fa', padding:'2px 8px', borderRadius:99, whiteSpace:'nowrap' }}>{c.m}% match</span>
            </div>
          ))}
        </Card>

        <Card>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
            <span style={{ fontSize:18 }}>🎓</span>
            <h3 style={{ fontSize:14, fontWeight:500 }}>Major နှင့် တက္ကသိုလ်</h3>
          </div>
          <div style={{ marginBottom:10 }}>
            {(entry.majors || []).map(m => (
              <span key={m} style={{ display:'inline-block', fontSize:11, padding:'3px 9px', borderRadius:99, background:'rgba(124,107,255,.12)', color:'#a89bff', margin:2 }}>{m}</span>
            ))}
          </div>
          <SectionLabel>မြန်မာ တက္ကသိုလ်</SectionLabel>
          {(entry.mm_uni || []).map(u => <div key={u} style={{ fontSize:12, color:'var(--muted)', padding:'2px 0' }}>• {u}</div>)}
          {abroadUnis.length > 0 && <>
            <SectionLabel>နိုင်ငံရပ်ခြား</SectionLabel>
            {abroadUnis.map(u => <div key={u} style={{ fontSize:12, color:'var(--muted)', padding:'2px 0' }}>• {u}</div>)}
          </>}
          {(entry.mm || []).length > 0 && (
            <div style={{ marginTop:10 }}>
              {entry.mm.map(m => (
                <span key={m} style={{ display:'inline-block', fontSize:11, padding:'3px 9px', borderRadius:99, background:'rgba(0,212,160,.1)', color:'var(--accent2)', margin:2 }}>{m}</span>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <span style={{ fontSize:18 }}>🗺️</span>
            <h3 style={{ fontSize:14, fontWeight:500 }}>Career Roadmap</h3>
          </div>
          {(entry.road || []).map((step, i) => (
            <div key={i} style={{ display:'flex', gap:10, marginBottom:10 }}>
              <div style={{ width:22, height:22, minWidth:22, borderRadius:'50%', background:'rgba(124,107,255,.15)', color:'#a89bff', fontSize:11, fontWeight:500, display:'flex', alignItems:'center', justifyContent:'center' }}>{i+1}</div>
              <div style={{ fontSize:13, color:'var(--muted)', lineHeight:1.6, paddingTop:2 }}>{step}</div>
            </div>
          ))}
        </Card>

        {entry.parent && (
          <Card style={{ background:'rgba(124,107,255,.06)', borderColor:'rgba(124,107,255,.2)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <span style={{ fontSize:16 }}>💜</span>
              <h3 style={{ fontSize:14, fontWeight:500, color:'#a89bff' }}>မိဘများသို့</h3>
            </div>
            <p style={{ fontSize:13, color:'#a89bff', lineHeight:1.7, opacity:.9 }}>{entry.parent}</p>
          </Card>
        )}

        <div style={{ display:'flex', gap:8, marginTop:'1.5rem', flexWrap:'wrap' }}>
          <button onClick={onRetry} style={{ padding:'9px 18px', borderRadius:8, border:'1px solid var(--border)', background:'transparent', color:'var(--text)', fontSize:13, cursor:'pointer' }}>🔄 ထပ်ဖြေမည်</button>
        </div>
      </div>
    </div>
  )
}
