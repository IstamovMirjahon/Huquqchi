import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api, ApiError } from '../api'
import type { ChatAnswer, ChatStage, Conversation, DocumentItem, HandoffPreview, Message } from '../api/types'
import { useAuth } from '../auth'
import { Icon } from '../components/Icon'
import { LawyerCardView } from '../components/LawyerCard'
import { Badge, errText, FilePick, Modal, Seg, useAction, useAsync, useToast } from '../components/ui'
import { ago, dateFull } from '../lib/format'

const STAGES: Record<ChatStage, string> = { planning: 'Savolni tahlil qilyapman', searching: 'Qonunlardan qidiryapman', writing: 'Javob yozyapman', verifying: 'Manbalarni tekshiryapman' }

export default function Chat() {
  const { id } = useParams()
  const [sp, setSp] = useSearchParams()
  const nav = useNavigate()
  const toast = useToast()
  const { isLawyer, refresh } = useAuth()
  const convs = useAsync(() => api.chat.list(), [])
  const [conv, setConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [style, setStyle] = useState<'short' | 'detailed'>('short')
  const [streaming, setStreaming] = useState<{ stage: ChatStage | null; text: string } | null>(null)
  const [limitErr, setLimitErr] = useState<string | null>(null)
  const [handoff, setHandoff] = useState(false)
  const [picker, setPicker] = useState(false)
  const abort = useRef<AbortController | null>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const started = useRef(false)
  const justCreated = useRef<string | null>(null)

  useEffect(() => {
    setLimitErr(null)
    if (!id) { setConv(null); setMessages([]); return }
    if (justCreated.current === id) { justCreated.current = null; return }
    api.chat.get(id).then(setConv).catch(() => nav('/chat', { replace: true }))
    api.chat.messages(id).then(setMessages)
  }, [id, nav])

  useEffect(() => { scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: 'smooth' }) }, [messages, streaming?.text])

  // ?q= from home page / ?doc= to attach a saved document
  useEffect(() => {
    if (started.current) return
    const q = sp.get('q'), doc = sp.get('doc')
    if (!q && !doc) return
    started.current = true
    ;(async () => {
      const c = await api.chat.create(q?.slice(0, 60) || 'Hujjat bo‘yicha savol', isLawyer ? 'professional' : 'client')
      if (doc) await api.chat.attach(c.id, doc)
      setSp({}, { replace: true })
      nav(`/chat/${c.id}`, { replace: true, state: { send: q } })
    })()
  }, [sp, setSp, nav, isLawyer])

  const loc = useLocation()
  const pendingSend = (loc.state as { send?: string } | null)?.send
  const sentFor = useRef<string | null>(null)
  useEffect(() => {
    if (id && pendingSend && conv?.id === id && sentFor.current !== id) {
      sentFor.current = id
      nav(loc.pathname, { replace: true, state: null })
      send(pendingSend)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, conv, pendingSend])

  async function send(text = input) {
    const content = text.trim()
    if (!content || streaming) return
    let cid = id
    if (!cid) {
      const c = await api.chat.create(content.slice(0, 60), isLawyer ? 'professional' : 'client')
      cid = c.id
      setConv(c)
      justCreated.current = c.id
      nav(`/chat/${c.id}`, { replace: true })
    }
    setInput(''); setLimitErr(null)
    const ctrl = new AbortController()
    abort.current = ctrl
    const tempId = `tmp-${Date.now()}`
    setMessages((m) => [...m, { id: tempId, role: 'user', content, answer: null, feedback: null, createdAt: new Date().toISOString() }])
    setStreaming({ stage: 'planning', text: '' })
    try {
      const final = await api.chat.send(cid, { content, answerStyle: style }, {
        onStatus: (stage) => setStreaming((s) => (s ? { ...s, stage } : s)),
        onDelta: (t) => setStreaming((s) => (s ? { ...s, text: s.text + t } : s)),
        onUser: (u) => setMessages((m) => m.map((x) => (x.id === tempId ? u : x))),
      }, ctrl.signal)
      setMessages((m) => [...m, final])
      convs.reload(true)
      refresh()
    } catch (e) {
      if ((e as Error).name === 'AbortError') toast('Javob to‘xtatildi')
      else if (e instanceof ApiError && e.status === 402) { setLimitErr(e.message); setMessages((m) => m.filter((x) => x.id !== tempId)); setInput(content) }
      else toast(errText(e), 'error')
    } finally {
      setStreaming(null)
      abort.current = null
    }
  }

  const feedback = async (m: Message, v: 'up' | 'down') => {
    if (!id) return
    await api.chat.feedback(id, m.id, v)
    setMessages((ms) => ms.map((x) => (x.id === m.id ? { ...x, feedback: v } : x)))
    if (v === 'down' && !isLawyer) { toast('Rahmat! Javob yetarli bo‘lmasa, yurist bilan tekshirtiring.'); setHandoff(true) }
  }

  const attach = async (d: DocumentItem) => {
    let cid = id
    if (!cid) { const c = await api.chat.create(`${d.name} bo‘yicha savol`, isLawyer ? 'professional' : 'client'); cid = c.id; nav(`/chat/${c.id}`, { replace: true }) }
    await api.chat.attach(cid, d.id)
    setConv(await api.chat.get(cid))
    setPicker(false)
  }
  const detach = async (docId: string) => { if (!id) return; await api.chat.detach(id, docId); setConv(await api.chat.get(id)) }

  const lastAnswer = [...messages].reverse().find((m) => m.answer)

  return (
    <div className="chat">
      <aside className="chat-side">
        <Link to="/chat" className="btn btn-primary btn-block" style={{ marginBottom: 14 }}><Icon name="plus" size={17} />Yangi suhbat</Link>
        <div className="side-label" style={{ paddingLeft: 4 }}>Suhbatlar</div>
        {convs.data?.map((c) => (
          <Link key={c.id} to={`/chat/${c.id}`} className={`conv-link ${c.id === id ? 'active' : ''}`} title={c.title}>{c.title}</Link>
        ))}
        {convs.data?.length === 0 && <p className="xs faint" style={{ padding: 8 }}>Hali suhbat yo‘q</p>}
      </aside>

      <div className="chat-main">
        <div className="chat-scroll" ref={scroller}>
          <div className="chat-inner">
            {conv && (
              <div className="row between wrap" style={{ padding: '10px 0 16px', gap: 10 }}>
                <div className="row" style={{ gap: 8 }}>
                  <h1 className="h3 clamp2">{conv.title}</h1>
                  {conv.mode === 'professional' && <Badge tone="gold">Professional</Badge>}
                </div>
                {!isLawyer && messages.some((m) => m.answer) && (
                  <div className="row" style={{ gap: 6 }}>
                    <button className="btn btn-sm btn-ghost" onClick={() => nav('/cases/new', { state: { conversationId: id, situation: messages.find((m) => m.role === 'user')?.content ?? '', title: '' } })}><Icon name="layout" size={16} />Ish ochish</button>
                    <button className="btn btn-sm btn-gold" onClick={() => setHandoff(true)}><Icon name="users" size={16} />Yuristga tekshirtirish</button>
                  </div>
                )}
              </div>
            )}

            {!id && messages.length === 0 && <Welcome lawyer={isLawyer} onPick={(q) => send(q)} />}

            <div className="stack-lg">
              {messages.map((m) => m.role === 'user'
                ? <div key={m.id} className="bubble-user">{m.content}</div>
                : <AnswerView key={m.id} m={m} isLawyer={isLawyer} conversationId={id!} onFeedback={(v) => feedback(m, v)} onHandoff={() => setHandoff(true)} />)}
              {streaming && (
                <div className="bubble-ai">
                  <div className="stage"><span className="spinner" style={{ width: 14, height: 14 }} />{streaming.stage ? STAGES[streaming.stage] : 'Kutilmoqda'}…</div>
                  {streaming.text && <p style={{ marginTop: 12, color: 'var(--ink-body)' }}>{streaming.text}</p>}
                </div>
              )}
            </div>
            {limitErr && (
              <div className="banner gold" style={{ marginTop: 16 }}>
                <Icon name="zap" /><div className="grow"><b>Limit tugadi.</b> {limitErr}</div>
                <Link to="/profile#plans" className="btn btn-sm btn-gold">Plus’ga o‘tish</Link>
              </div>
            )}
          </div>
        </div>

        <div className="chat-input">
          <div className="box">
            {conv && conv.documents.length > 0 && (
              <div className="row wrap" style={{ gap: 6, marginBottom: 8 }}>
                {conv.documents.map((d) => (
                  <span key={d.id} className="file-chip"><Icon name="file" size={14} />{d.name}<button onClick={() => detach(d.id)} style={{ border: 0, background: 'none', cursor: 'pointer', padding: 0 }} aria-label="Olib tashlash"><Icon name="x" size={13} /></button></span>
                ))}
              </div>
            )}
            <textarea rows={1} value={input} placeholder={isLawyer ? 'Huquqiy savol, modda yoki holatni yozing…' : 'Savolingizni yozing…'}
              onChange={(e) => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = `${e.target.scrollHeight}px` }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }} />
            <div className="row between" style={{ marginTop: 6 }}>
              <div className="row" style={{ gap: 6 }}>
                <button className="btn btn-sm btn-ghost" onClick={() => setPicker(true)}><Icon name="paperclip" size={16} />Hujjat</button>
                <Seg value={style} onChange={setStyle} options={[['short', 'Qisqa'], ['detailed', 'Batafsil']]} />
              </div>
              {streaming
                ? <button className="btn btn-sm btn-ghost" onClick={() => abort.current?.abort()}><Icon name="stop" size={14} />To‘xtatish</button>
                : <button className="btn btn-sm btn-lapis" onClick={() => send()} disabled={!input.trim()}><Icon name="send" size={15} />Yuborish</button>}
            </div>
          </div>
          <p className="xs faint" style={{ textAlign: 'center', marginTop: 8 }}>AI javobi. Muhim qaror oldidan mutaxassis bilan tekshiring.</p>
        </div>
      </div>

      {handoff && id && <HandoffModal conversationId={id} answer={lastAnswer?.answer ?? null} onClose={() => setHandoff(false)} />}
      <DocPicker open={picker} onClose={() => setPicker(false)} onPick={attach} />
    </div>
  )
}

function Welcome({ lawyer, onPick }: { lawyer: boolean; onPick: (q: string) => void }) {
  const qs = lawyer
    ? ['Mehnat shartnomasini bekor qilish asoslari', 'Uy-joyga egalik huquqini sud orqali himoya qilish', 'Meros ochilish vaqti va joyi', 'Jinoyat ishida himoyachining huquqlari']
    : ['Ishdan ogohlantirishsiz bo‘shatishdi', 'Ijaraga beruvchi garovni qaytarmayapti', 'Ajrimda bola kim bilan qoladi?', 'Politsiyaga chaqirishdi, nima qilaman?']
  return (
    <div style={{ textAlign: 'center', padding: '56px 0 24px' }}>
      <div className="tile-ico" style={{ background: 'var(--grad-lapis)', margin: '0 auto', width: 56, height: 56, borderRadius: 18 }}><Icon name="sparkles" size={26} /></div>
      <h1 className="h1" style={{ marginTop: 16 }}>{lawyer ? 'AI yordamchi, professional rejim' : 'AI huquqshunos'}</h1>
      <p className="sub" style={{ maxWidth: 520, margin: '8px auto 0' }}>
        {lawyer ? 'Javoblar yuridik terminlarda, moddalarga havola bilan. Mijoz hujjatlarini biriktirib tahlil qilishingiz mumkin.' : 'Savolingizga O‘zbekiston qonunlari asosida, manbasi bilan javob beraman. Ishonchingiz komil bo‘lmasa, bir tugmada yuristga yuborasiz.'}
      </p>
      <div className="grid g2" style={{ marginTop: 26, textAlign: 'left' }}>
        {qs.map((q) => <button key={q} className="card" style={{ padding: 14 }} onClick={() => onPick(q)}><span className="small strong">{q}</span></button>)}
      </div>
    </div>
  )
}

function AnswerView({ m, isLawyer, onFeedback, onHandoff }: { m: Message; isLawyer: boolean; conversationId: string; onFeedback: (v: 'up' | 'down') => void; onHandoff: () => void }) {
  const a = m.answer
  const toast = useToast()
  if (!a) return <div className="bubble-ai"><p>{m.content}</p></div>
  const conf = { high: ['Yuqori ishonch', 'success'], medium: ['O‘rtacha ishonch', 'warning'], low: ['Past ishonch', 'danger'] }[a.confidence]
  return (
    <div className="bubble-ai card" style={{ padding: 22 }}>
      <div className="row wrap" style={{ gap: 6, marginBottom: 12 }}>
        <Badge tone="lapis" icon="sparkles">AI javobi</Badge>
        <Badge tone={conf[1]}>{conf[0]}</Badge>
        {a.legalBasisVerified ? <Badge tone="success" icon="check">Manba tasdiqlangan</Badge> : <Badge tone="warning" icon="alert">Huquqiy asos tasdiqlanmadi</Badge>}
      </div>
      {a.kind === 'clarification' ? (
        <div><p className="strong">Aniqroq javob uchun:</p><ul>{a.clarifyingQuestions.map((q) => <li key={q}>{q}</li>)}</ul></div>
      ) : (
        <>
          <p style={{ fontSize: 15.5, lineHeight: 1.65 }}>{a.summary}</p>
          {a.legalBasis.length > 0 && (
            <Section title="Huquqiy asos" icon="scale">
              <div className="stack">
                {a.legalBasis.map((lb, i) => {
                  const cits = a.citations.filter((c) => lb.citations.includes(c.sectionId))
                  return (
                    <div key={i}>
                      <p className="small">{lb.statement}</p>
                      {cits.map((c) => <CitationCard key={c.sectionId} c={c} />)}
                    </div>
                  )
                })}
              </div>
            </Section>
          )}
          {a.steps.length > 0 && <Section title="Nima qilish kerak" icon="checkCircle"><ol style={{ margin: 0, paddingLeft: 20 }} className="small">{a.steps.map((s) => <li key={s} style={{ marginBottom: 4 }}>{s}</li>)}</ol></Section>}
          {a.missingInfo.length > 0 && <Section title="Javobga ta’sir qiladigan savollar" icon="info"><ul style={{ margin: 0, paddingLeft: 20 }} className="small muted">{a.missingInfo.map((s) => <li key={s}>{s}</li>)}</ul></Section>}
          {a.limitations.length > 0 && <div className="banner warn xs" style={{ marginTop: 14 }}><Icon name="alert" size={16} /><div>{a.limitations.join(' ')}</div></div>}
        </>
      )}

      {!isLawyer && a.escalation.recommended && (
        <div className="banner gold" style={{ marginTop: 16, alignItems: 'center' }}>
          <Icon name="shieldCheck" />
          <div className="grow small"><b>Yurist bilan maslahatlashish tavsiya etiladi.</b> {a.escalation.reason}</div>
          <button className="btn btn-sm btn-gold" onClick={onHandoff}>Yurist tanlash</button>
        </div>
      )}

      <div className="row between wrap" style={{ marginTop: 16, gap: 8 }}>
        <div className="row wrap" style={{ gap: 6 }}>
          {a.suggestedActions.map((s, i) => s.type === 'create_draft'
            ? <Link key={i} to={`/create?template=${s.templateCode}`} className="btn btn-sm btn-soft"><Icon name="filePlus" size={15} />{s.label}</Link>
            : s.type === 'find_lawyer' && !isLawyer
              ? <button key={i} className="btn btn-sm btn-ghost" onClick={onHandoff}><Icon name="users" size={15} />{s.label}</button>
              : null)}
        </div>
        <div className="row" style={{ gap: 4 }}>
          <button className="icon-btn" style={{ width: 34, height: 34 }} title="Nusxa olish" onClick={() => { navigator.clipboard.writeText(a.summary); toast('Nusxa olindi') }}><Icon name="copy" size={15} /></button>
          <button className="icon-btn" style={{ width: 34, height: 34, color: m.feedback === 'up' ? 'var(--success)' : undefined }} title="Foydali" onClick={() => onFeedback('up')}><Icon name="thumbsUp" size={15} /></button>
          <button className="icon-btn" style={{ width: 34, height: 34, color: m.feedback === 'down' ? 'var(--danger)' : undefined }} title="Foydali emas" onClick={() => onFeedback('down')}><Icon name="thumbsDown" size={15} /></button>
        </div>
      </div>
    </div>
  )
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 18 }}>
      <div className="row xs strong" style={{ gap: 6, color: 'var(--ink-2)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}><Icon name={icon} size={15} />{title}</div>
      {children}
    </div>
  )
}

function CitationCard({ c }: { c: ChatAnswer['citations'][number] }) {
  return (
    <Link to={`/laws/${c.legalDocumentId}?section=${c.sectionId}`} className="citation" style={{ marginTop: 8 }}>
      <div className="row between" style={{ gap: 8 }}>
        <b>{c.documentTitle}{c.articleNumber ? `, ${c.articleNumber}-modda` : ''}</b>
        {c.editionDate && <span className="xs faint">tahrir: {dateFull(c.editionDate)}</span>}
      </div>
      <p className="xs muted clamp3" style={{ marginTop: 4, fontFamily: 'Georgia, serif' }}>{c.quote}</p>
    </Link>
  )
}

function DocPicker({ open, onClose, onPick }: { open: boolean; onClose: () => void; onPick: (d: DocumentItem) => void }) {
  const docs = useAsync(() => (open ? api.documents.list() : Promise.resolve([])), [open])
  const { busy, run } = useAction()
  return (
    <Modal open={open} onClose={onClose} title="Hujjat biriktirish" sub="AI faqat siz biriktirgan hujjatlarga tayanadi.">
      <FilePick className="btn btn-ghost btn-block" accept=".pdf,.docx,.jpg,.jpeg,.png" disabled={busy} onFile={async (f) => { const d = await run(() => api.documents.upload(f, 'Chat'), 'Hujjat saqlandi va «Hujjatlarim»da ko‘rinadi'); if (d) onPick(d) }}>
        <Icon name="upload" size={17} />{busy ? 'Yuklanmoqda…' : 'Yangi fayl yuklash (PDF, DOCX, JPG, PNG)'}
      </FilePick>
      <div className="side-label" style={{ paddingLeft: 0 }}>Hujjatlarimdan tanlash</div>
      <div className="list">
        {docs.data?.map((d) => (
          <button key={d.id} className="list-item" style={{ border: 0, background: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }} onClick={() => onPick(d)}>
            <Icon name="file" className="faint" /><div className="grow"><div className="small strong">{d.name}</div><div className="xs faint">{ago(d.createdAt)}</div></div><Icon name="plus" size={16} />
          </button>
        ))}
        {docs.data?.length === 0 && <p className="small muted">Saqlangan hujjat yo‘q.</p>}
      </div>
    </Modal>
  )
}

function HandoffModal({ conversationId, onClose }: { conversationId: string; answer: ChatAnswer | null; onClose: () => void }) {
  const nav = useNavigate()
  const [p, setP] = useState<HandoffPreview | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [summary, setSummary] = useState('')
  const [docs, setDocs] = useState<string[]>([])
  const [shareConv, setShareConv] = useState(true)
  useEffect(() => {
    api.chat.handoffPreview(conversationId).then((x) => { setP(x); setSummary(x.summary); setDocs(x.documents.map((d) => d.id)) }).catch((e) => setErr(errText(e)))
  }, [conversationId])
  const ctx = { conversationId, shareConversation: shareConv, documentIds: docs, summary, title: p?.title ?? '', category: p?.category.code }
  return (
    <Modal open onClose={onClose} wide title="Yuristga tekshirtirish" sub="AI suhbatingizni yurist uchun qisqa mazmunga aylantirdi. Nimani ulashishni o‘zingiz tanlaysiz.">
      {!p && !err && <div className="page-loading" style={{ padding: 40 }}><div className="row"><span className="spinner" />Mazmun tayyorlanmoqda…</div></div>}
      {err && <div className="banner danger">{err}</div>}
      {p && (
        <div className="stack-lg">
          <div className="grid g2">
            <div className="stack">
              <label className="field"><span>Yurist ko‘radigan mazmun</span><textarea className="textarea" rows={6} value={summary} onChange={(e) => setSummary(e.target.value)} /></label>
              <div className="row wrap" style={{ gap: 6 }}><Badge tone="lapis">{p.category.name}</Badge>{p.urgency === 'high' && <Badge tone="danger">Shoshilinch</Badge>}</div>
            </div>
            <div className="stack">
              <div className="field"><span>Ulashiladigan materiallar</span></div>
              <label className="check"><input type="checkbox" checked={shareConv} onChange={(e) => setShareConv(e.target.checked)} /><span className="small">AI suhbat tarixi (faqat o‘qish uchun)</span></label>
              {p.documents.map((d) => (
                <label key={d.id} className="check"><input type="checkbox" checked={docs.includes(d.id)} onChange={(e) => setDocs(e.target.checked ? [...docs, d.id] : docs.filter((x) => x !== d.id))} /><span className="small">{d.name}</span></label>
              ))}
              <p className="xs faint">Materiallar faqat to‘lovdan keyin, faqat siz tanlagan yuristga ochiladi.</p>
            </div>
          </div>
          <div>
            <div className="row between" style={{ marginBottom: 10 }}><h3 className="h3">Mos yuristlar</h3><span className="xs faint">yo‘nalish, reyting va bo‘sh vaqt bo‘yicha</span></div>
            <div className="stack">
              {p.recommendedLawyers.map((l) => (
                <LawyerCardView key={l.id} l={l} compact action={<button className="btn btn-sm btn-primary" onClick={() => nav(`/lawyers/${l.id}`, { state: { handoff: ctx } })}>Tanlash</button>} />
              ))}
            </div>
          </div>
          <div className="sunken row between wrap" style={{ gap: 12 }}>
            <div><b className="small">Yuristni o‘zim tanlay olmayman</b><div className="xs muted">Ochiq e’lon joylang, yuristlar narx va muddat taklif qiladi. Tavsiya byudjet: {p.suggestedBudget.min.toLocaleString('ru-RU')}–{p.suggestedBudget.max.toLocaleString('ru-RU')} so‘m</div></div>
            <button className="btn btn-ghost" onClick={() => nav('/jobs/new', { state: { handoff: ctx, budget: p.suggestedBudget } })}><Icon name="megaphone" size={16} />E’lon joylash</button>
          </div>
        </div>
      )}
    </Modal>
  )
}
