import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../api'
import type { DisputeReason, FileRef, Message, Order, OrderEvent, OrderMessage } from '../api/types'
import { useAuth } from '../auth'
import { Icon } from '../components/Icon'
import { Avatar, Badge, Empty, ErrorBox, FilePick, Loading, Modal, PageHead, Seg, StatusBadge, useAction, useAsync, useToast } from '../components/ui'
import { ago, dateTime, fileSize, FORMAT, money, ORDER_TYPE, time, until } from '../lib/format'

export function OrdersList() {
  const { isLawyer } = useAuth()
  const [group, setGroup] = useState<'active' | 'completed' | 'cancelled'>('active')
  const r = useAsync(() => api.orders.list({ group }), [group])
  return (
    <>
      <PageHead eyebrow={isLawyer ? 'Ish jarayoni' : 'Yurist bilan ishlash'} title={isLawyer ? 'Buyurtmalar' : 'Murojaatlarim'} sub={isLawyer ? 'Mijozlardan kelgan barcha buyurtmalar' : 'Yuristlarga bergan buyurtmalaringiz va ularning holati'}
        actions={!isLawyer && <Link to="/lawyers" className="btn btn-primary"><Icon name="plus" size={17} />Yangi murojaat</Link>} />
      <div className="tabs">
        {([['active', 'Faol'], ['completed', 'Yakunlangan'], ['cancelled', 'Bekor qilingan']] as const).map(([k, l]) => <button key={k} className={group === k ? 'on' : ''} onClick={() => setGroup(k)}>{l}</button>)}
      </div>
      {r.loading && !r.data ? <Loading /> : r.data?.items.length ? (
        <div className="stack">
          {r.data.items.map((o) => {
            const other = isLawyer ? o.client : o.lawyer
            return (
              <Link key={o.id} to={`/orders/${o.id}`} className="card row" style={{ gap: 16, padding: 16 }}>
                <Avatar name={other.name} size={46} />
                <div className="grow">
                  <div className="row wrap" style={{ gap: 8 }}><b>{o.title}</b><span className="xs faint">{o.number}</span></div>
                  <div className="small muted">{other.name} · {ORDER_TYPE[o.type]}{o.consultation ? ` · ${dateTime(o.consultation.start)}` : ''}</div>
                  {o.status === 'awaiting_acceptance' && o.acceptDueAt && <div className="xs" style={{ color: 'var(--warning)', marginTop: 2 }}>{isLawyer ? 'Qabul qilish uchun' : 'Yurist javobi uchun'} {until(o.acceptDueAt)} qoldi</div>}
                  {o.status === 'delivered' && o.autoCompleteAt && !isLawyer && <div className="xs" style={{ color: 'var(--gold)', marginTop: 2 }}>Natijani tekshiring: {until(o.autoCompleteAt)} ichida avto-tasdiq</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <StatusBadge status={o.status} />
                  <div className="strong small" style={{ marginTop: 6 }}>{money(isLawyer ? o.price.lawyerPayout : o.price.amount)}</div>
                  {o.unreadMessages > 0 && <Badge tone="lapis">{o.unreadMessages} yangi xabar</Badge>}
                </div>
              </Link>
            )
          })}
        </div>
      ) : <div className="card"><Empty icon="briefcase" title="Bu yerda hozircha bo‘sh" text={isLawyer ? 'Xizmatlaringizni faollashtiring va ish e’lonlariga taklif yuboring.' : 'AI javobi yetmasa, yurist bilan bog‘laning.'} action={isLawyer ? <Link to="/pro/jobs" className="btn btn-primary">Ish e’lonlari</Link> : <Link to="/lawyers" className="btn btn-primary">Yurist topish</Link>} /></div>}
    </>
  )
}

export function OrderPage() {
  const { id } = useParams()
  const { me, isLawyer } = useAuth()
  const o = useAsync(() => api.orders.get(id!), [id])
  const ev = useAsync(() => api.orders.events(id!), [id])
  const [modal, setModal] = useState<null | 'decline' | 'deliver' | 'revision' | 'dispute' | 'cancel' | 'review' | 'shared'>(null)
  const { busy, run } = useAction()
  const reload = useCallback(() => { o.reload(true); ev.reload(true) }, [o, ev])

  if (o.loading && !o.data) return <Loading />
  if (o.error || !o.data) return <ErrorBox error={o.error} retry={o.reload} />
  const order = o.data
  const other = isLawyer ? order.client : order.lawyer
  const can = (a: Order['allowedActions'][number]) => order.allowedActions.includes(a)
  const act = async (a: 'accept' | 'complete') => { const r = await run(() => api.orders.action(order.id, a), a === 'accept' ? 'Buyurtma qabul qilindi' : 'Rahmat! Pul yuristga o‘tkazildi'); if (r) { o.setData(r); ev.reload(true); if (a === 'complete') setModal('review') } }
  const join = async () => { const m = await run(() => api.orders.meeting(order.id)); if (m) window.open(m.url, '_blank') }

  return (
    <div className="stack-lg">
      <Link to="/orders" className="btn-text btn small"><Icon name="arrowLeft" size={16} />{isLawyer ? 'Buyurtmalar' : 'Murojaatlarim'}</Link>
      <div className="split">
        <div className="stack-lg">
          <section className="card pad-lg">
            <div className="row between top wrap" style={{ gap: 12 }}>
              <div>
                <div className="row wrap" style={{ gap: 8 }}><StatusBadge status={order.status} /><span className="xs faint">{order.number} · {ORDER_TYPE[order.type]}</span></div>
                <h1 className="h2" style={{ marginTop: 8 }}>{order.title}</h1>
              </div>
              <div className="row wrap" style={{ gap: 8 }}>
                {can('pay') && <Link to={`/checkout/${order.id}`} className="btn btn-primary">To‘lash</Link>}
                {can('accept') && <button className="btn btn-primary" disabled={busy} onClick={() => act('accept')}>Qabul qilish</button>}
                {can('decline') && <button className="btn btn-ghost" onClick={() => setModal('decline')}>Rad etish</button>}
                {can('join_meeting') && <button className="btn btn-lapis" onClick={join}><Icon name="video" size={17} />Qo‘ng‘iroqqa qo‘shilish</button>}
                {can('deliver') && <button className="btn btn-gold" onClick={() => setModal('deliver')}><Icon name="send" size={16} />{order.type === 'consultation' ? 'O‘tkazildi deb belgilash' : 'Ishni topshirish'}</button>}
                {can('complete') && <button className="btn btn-primary" disabled={busy} onClick={() => act('complete')}><Icon name="check" size={17} />Qabul qilaman</button>}
                {can('request_revision') && <button className="btn btn-ghost" onClick={() => setModal('revision')}>Qayta ishlash</button>}
                {can('review') && <button className="btn btn-gold" onClick={() => setModal('review')}><Icon name="star" size={16} />Sharh yozish</button>}
              </div>
            </div>
            <StatusHint order={order} isLawyer={isLawyer} />
            {order.description && <><hr className="divider" /><div className="xs strong faint" style={{ textTransform: 'uppercase', letterSpacing: '.06em' }}>{isLawyer ? 'Mijoz yozgan' : 'Siz yozgan'}</div><p className="pre small" style={{ marginTop: 6 }}>{order.description}</p></>}
            {order.shared.aiSummary && <div className="banner info small" style={{ marginTop: 12 }}><Icon name="sparkles" size={17} /><div><b>AI mazmuni:</b> {order.shared.aiSummary}</div></div>}
          </section>

          {order.status === 'pending_payment' ? (
            <div className="card"><Empty icon="lock" title="Chat to‘lovdan keyin ochiladi" text="Bu ikki tomonni ham himoya qiladi: barcha kelishuvlar platformada qoladi." /></div>
          ) : <Thread order={order} meId={me!.id} isLawyer={isLawyer} onChange={reload} />}
        </div>

        <aside className="stack sticky">
          <div className="card">
            <div className="row" style={{ gap: 12 }}><Avatar name={other.name} size={48} /><div className="grow"><b>{other.name}</b><div className="xs muted">{isLawyer ? 'Mijoz' : order.lawyer.type === 'advocate' ? 'Advokat' : 'Yuridik maslahatchi'}</div></div>
              {!isLawyer && <Link to={`/lawyers/${order.lawyer.id}`} className="icon-btn" title="Profil"><Icon name="eye" size={17} /></Link>}</div>
            <hr className="divider" />
            {order.consultation && <Row k="Vaqt" v={`${dateTime(order.consultation.start)}–${time(order.consultation.end)}`} />}
            {order.consultation && <Row k="Format" v={FORMAT[order.consultation.format]} />}
            {order.consultation?.officeAddress && <Row k="Manzil" v={order.consultation.officeAddress} />}
            {order.deliveryDueAt && ['in_progress', 'revision_requested'].includes(order.status) && <Row k="Topshirish muddati" v={`${dateTime(order.deliveryDueAt)} (${until(order.deliveryDueAt)})`} />}
            <Row k={isLawyer ? 'Mijoz to‘laydi' : 'Narx'} v={money(order.price.amount)} />
            {isLawyer && order.price.platformFee != null && <Row k="Platforma komissiyasi" v={`−${money(order.price.platformFee)}`} />}
            {isLawyer && <Row k="Sizga tushadi" v={<b style={{ color: 'var(--success)' }}>{money(order.price.lawyerPayout)}</b>} />}
            {order.payment && <Row k="To‘lov" v={order.payment.status === 'paid' ? 'Platformada saqlanmoqda' : order.payment.status} />}
            {order.type !== 'consultation' && <Row k="Qayta ishlash" v={`${order.revisionCount}/${order.maxRevisions}`} />}
          </div>

          {(order.shared.conversation || order.shared.documents.length > 0) && (
            <div className="card">
              <h3 className="h3" style={{ marginBottom: 10 }}>Ulashilgan materiallar</h3>
              {order.shared.conversation && <button className="list-item" style={{ width: '100%', border: 0, background: 'none', cursor: 'pointer', textAlign: 'left' }} onClick={() => setModal('shared')}><Icon name="sparkles" size={18} style={{ color: 'var(--lapis)' }} /><div className="grow small strong">AI suhbati: {order.shared.conversation.title}</div><Icon name="chevronRight" size={16} /></button>}
              {order.shared.documents.map((d) => (
                <div key={d.id} className="list-item"><Icon name="file" size={18} className="faint" /><div className="grow small">{d.name}</div>
                  {isLawyer ? <Link to={`/chat?doc=${d.id}`} className="btn btn-sm btn-soft" title="Hujjatni AI bilan tahlil qilish">AI</Link> : <Link to={`/documents/${d.id}`} className="icon-btn" style={{ width: 32, height: 32 }}><Icon name="eye" size={15} /></Link>}
                </div>
              ))}
              <p className="xs faint" style={{ marginTop: 6 }}>{isLawyer ? 'Faqat siz ko‘rasiz. Har bir kirish auditda qayd etiladi.' : 'Faqat shu yurist ko‘radi.'}</p>
            </div>
          )}

          <div className="card">
            <h3 className="h3" style={{ marginBottom: 12 }}>Tarix</h3>
            <div className="timeline">{(ev.data ?? []).map((e: OrderEvent) => <div key={e.id} className="t"><div className="strong">{e.text}</div><div className="xs faint">{ago(e.createdAt)}</div></div>)}</div>
          </div>

          <div className="row wrap" style={{ gap: 8 }}>
            {can('cancel') && <button className="btn btn-sm btn-ghost" onClick={() => setModal('cancel')}>Bekor qilish</button>}
            {can('dispute') && <button className="btn btn-sm btn-danger" onClick={() => setModal('dispute')}><Icon name="alert" size={15} />Nizo ochish</button>}
          </div>
          {order.dispute && <div className="banner danger small"><Icon name="alert" size={18} /><div>Nizo ochilgan ({order.dispute.openedBy === 'client' ? 'mijoz' : 'yurist'}). Moderator ko‘rib chiqmoqda, pul platformada saqlanadi.</div></div>}
        </aside>
      </div>

      <ActionModals order={order} kind={modal} onClose={() => setModal(null)} onDone={(r) => { if (r) o.setData(r); ev.reload(true); setModal(null) }} />
    </div>
  )
}

const Row = ({ k, v }: { k: string; v: React.ReactNode }) => <div className="row between small" style={{ padding: '5px 0', gap: 12 }}><span className="muted">{k}</span><span style={{ textAlign: 'right' }}>{v}</span></div>

function StatusHint({ order, isLawyer }: { order: Order; isLawyer: boolean }) {
  const h: Partial<Record<Order['status'], [string, string]>> = isLawyer ? {
    awaiting_acceptance: ['info', `Mijoz to‘lagan. ${order.acceptDueAt ? until(order.acceptDueAt) : ''} ichida qabul qiling yoki rad eting, aks holda pul mijozga qaytadi.`],
    scheduled: ['info', 'Konsultatsiyadan 10 daqiqa oldin qo‘ng‘iroq xonasi ochiladi.'],
    in_progress: ['info', 'Ishni bajarib, natijani «Ishni topshirish» orqali yuboring.'],
    revision_requested: ['warn', 'Mijoz qayta ishlashni so‘radi. Izohni chatda ko‘ring.'],
    delivered: ['gold', `Mijoz tasdig‘i kutilmoqda. ${order.autoCompleteAt ? `${until(order.autoCompleteAt)} ichida avtomatik yopiladi.` : ''}`],
    completed: ['success', 'Buyurtma yakunlandi. Pul hamyoningizga o‘tkazildi.'],
  } : {
    pending_payment: ['warn', 'Buyurtma to‘lovni kutmoqda. 30 daqiqada to‘lanmasa, bekor bo‘ladi.'],
    awaiting_acceptance: ['info', `To‘lov qabul qilindi. Yurist ${order.acceptDueAt ? until(order.acceptDueAt) : '24 soat'} ichida javob beradi, aks holda pul to‘liq qaytariladi.`],
    scheduled: ['info', 'Yurist tasdiqladi. Konsultatsiyadan 10 daqiqa oldin «Qo‘ng‘iroqqa qo‘shilish» tugmasi chiqadi.'],
    in_progress: ['info', 'Yurist ishlamoqda. Savollaringizni chatda yozing.'],
    delivered: ['gold', `Natijani tekshiring. Hammasi to‘g‘ri bo‘lsa «Qabul qilaman» bosing. ${order.autoCompleteAt ? `${until(order.autoCompleteAt)} ichida e’tiroz bo‘lmasa, avtomatik tasdiqlanadi.` : ''}`],
    completed: ['success', 'Buyurtma yakunlandi. Yurist ishini baholang.'],
    refunded: ['info', 'Pul kartangizga qaytarildi (1–3 ish kuni).'],
  }
  const x = h[order.status]
  if (!x) return null
  return <div className={`banner ${x[0]} small`} style={{ marginTop: 16 }}><Icon name="info" size={17} /><div>{x[1]}</div></div>
}

function Thread({ order, meId, isLawyer, onChange }: { order: Order; meId: string; isLawyer: boolean; onChange: () => void }) {
  const [msgs, setMsgs] = useState<OrderMessage[]>([])
  const [text, setText] = useState('')
  const [files, setFiles] = useState<FileRef[]>([])
  const { busy, run } = useAction()
  const box = useRef<HTMLDivElement>(null)
  const last = useRef<string | undefined>(undefined)
  const toast = useToast()
  const closed = ['cancelled', 'declined', 'expired', 'refunded'].includes(order.status)

  useEffect(() => {
    let alive = true
    last.current = undefined
    setMsgs([])
    const poll = async () => {
      const fresh = await api.orders.messages(order.id, last.current).catch(() => [])
      if (!alive || !fresh.length) return
      last.current = fresh[fresh.length - 1].id
      setMsgs((m) => [...m, ...fresh])
      api.orders.read(order.id, last.current)
      if (fresh.some((x) => x.kind === 'system' || x.kind === 'delivery')) onChange()
    }
    poll()
    const t = setInterval(poll, 5000) // realtime fallback (§16.2)
    return () => { alive = false; clearInterval(t) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order.id])
  useEffect(() => { box.current?.scrollTo({ top: box.current.scrollHeight }) }, [msgs.length])

  const send = async () => {
    if (!text.trim() && !files.length) return
    const m = await run(() => api.orders.send(order.id, { text: text.trim(), fileIds: files.map((f) => f.id) }))
    if (m) { setMsgs((x) => [...x, m]); last.current = m.id; setText(''); setFiles([]) }
  }
  const aiDraft = async () => {
    const d = await run(() => api.lawyer.aiDraft(order.id))
    if (d) { setText(d.text); toast('AI qoralama tayyor. Tekshirib, tahrirlab yuboring.') }
  }

  return (
    <section className="card">
      <div className="card-head"><h2 className="h3">Yozishma</h2><span className="xs faint">Barcha xabarlar nizo holatida dalil sifatida saqlanadi</span></div>
      <div className="thread" ref={box}>
        {msgs.map((m) => m.kind === 'system'
          ? <div key={m.id} className="msg system">{m.text} · {ago(m.createdAt)}</div>
          : (
            <div key={m.id} className={`msg ${m.sender?.id === meId ? 'me' : ''} ${m.kind === 'delivery' ? 'delivery' : ''}`}>
              {m.kind === 'delivery' && <div className="xs strong" style={{ color: 'var(--gold)', marginBottom: 4 }}><Icon name="checkCircle" size={13} style={{ display: 'inline', verticalAlign: -2 }} /> Natija topshirildi</div>}
              {m.text}
              {m.files.length > 0 && <div className="row wrap" style={{ gap: 6, marginTop: 8 }}>{m.files.map((f) => <a key={f.id} href={f.url} target="_blank" rel="noreferrer" className="file-chip"><Icon name="file" size={14} />{f.name} <span className="faint">{fileSize(f.size)}</span></a>)}</div>}
              <div className="meta">{m.sender?.name} · {ago(m.createdAt)}</div>
            </div>
          ))}
        {msgs.length === 0 && <p className="muted small" style={{ textAlign: 'center', padding: 20 }}>Xabarlar yo‘q</p>}
      </div>
      {!closed && (
        <div style={{ marginTop: 14 }}>
          {files.length > 0 && <div className="row wrap" style={{ gap: 6, marginBottom: 8 }}>{files.map((f) => <span key={f.id} className="file-chip"><Icon name="paperclip" size={13} />{f.name}<button style={{ border: 0, background: 'none', cursor: 'pointer' }} onClick={() => setFiles(files.filter((x) => x.id !== f.id))}><Icon name="x" size={13} /></button></span>)}</div>}
          <textarea className="textarea" rows={3} placeholder="Xabar yozing…" value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) send() }} />
          <div className="row between" style={{ marginTop: 8 }}>
            <div className="row" style={{ gap: 6 }}>
              <FilePick className="btn btn-sm btn-ghost" onFile={async (f) => { const r = await run(() => api.files.upload(f, 'order_message')); if (r) setFiles((x) => [...x, r]) }}><Icon name="paperclip" size={15} />Fayl</FilePick>
              {isLawyer && <button className="btn btn-sm btn-soft" disabled={busy} onClick={aiDraft}><Icon name="sparkles" size={15} />AI qoralama</button>}
            </div>
            <button className="btn btn-sm btn-primary" disabled={busy || (!text.trim() && !files.length)} onClick={send}><Icon name="send" size={15} />Yuborish</button>
          </div>
        </div>
      )}
    </section>
  )
}

function ActionModals({ order, kind, onClose, onDone }: { order: Order; kind: string | null; onClose: () => void; onDone: (o?: Order) => void }) {
  const [text, setText] = useState('')
  const [files, setFiles] = useState<FileRef[]>([])
  const [reason, setReason] = useState<DisputeReason>('poor_quality')
  const [rating, setRating] = useState(5)
  const [policy, setPolicy] = useState<{ refundAmount: number; policy: string } | null>(null)
  const [shared, setShared] = useState<Message[] | null>(null)
  const { busy, run } = useAction()
  const { isLawyer } = useAuth()
  useEffect(() => {
    setText(''); setFiles([])
    if (kind === 'cancel') api.orders.cancelPreview(order.id).then(setPolicy)
    if (kind === 'shared') api.orders.sharedConversation(order.id).then(setShared)
  }, [kind, order.id])
  if (!kind) return null
  const go = async (f: () => Promise<Order | undefined | { order: Order }>, ok: string) => { const r = await run(f as () => Promise<Order | { order: Order }>, ok); if (r) onDone('order' in r ? r.order : r) }

  if (kind === 'shared') return (
    <Modal open wide onClose={onClose} title="Mijozning AI suhbati" sub="Faqat o‘qish uchun">
      <div className="stack">{(shared ?? []).map((m) => <div key={m.id} className={m.role === 'user' ? 'bubble-user' : 'sunken small'}>{m.content}</div>)}{shared?.length === 0 && <p className="muted">Bo‘sh</p>}</div>
    </Modal>
  )
  const cfg: Record<string, { title: string; sub?: string; body: React.ReactNode; btn: string; tone?: string; disabled?: boolean; submit: () => void }> = {
    decline: { title: 'Buyurtmani rad etish', sub: 'Pul mijozga to‘liq qaytariladi.', btn: 'Rad etish', tone: 'btn-danger', body: <textarea className="textarea" placeholder="Sabab (mijozga ko‘rinadi)" value={text} onChange={(e) => setText(e.target.value)} />, submit: () => go(() => api.orders.action(order.id, 'decline', { reason: text }), 'Rad etildi') },
    deliver: { title: order.type === 'consultation' ? 'Konsultatsiya o‘tkazildi' : 'Ishni topshirish', sub: 'Mijoz natijani tekshiradi. 72 soatda e’tiroz bo‘lmasa, pul sizga o‘tadi.', btn: 'Topshirish', tone: 'btn-gold',
      body: <div className="stack"><textarea className="textarea" rows={5} placeholder={order.type === 'consultation' ? 'Qisqa xulosa va tavsiyalar (ixtiyoriy)' : 'Natija tavsifi, nimalar qilindi'} value={text} onChange={(e) => setText(e.target.value)} />
        <div className="row wrap" style={{ gap: 6 }}>{files.map((f) => <span key={f.id} className="file-chip"><Icon name="file" size={13} />{f.name}</span>)}<FilePick className="btn btn-sm btn-ghost" onFile={async (f) => { const r = await api.files.upload(f, 'delivery'); setFiles((x) => [...x, r]) }}><Icon name="paperclip" size={15} />Fayl biriktirish</FilePick></div></div>,
      submit: () => go(() => api.orders.action(order.id, 'deliver', { message: text, fileIds: files.map((f) => f.id) }), 'Topshirildi') },
    revision: { title: 'Qayta ishlashni so‘rash', sub: `Bepul qayta ishlash: ${order.maxRevisions - order.revisionCount} marta qoldi.`, btn: 'Yuborish', disabled: text.trim().length < 5, body: <textarea className="textarea" rows={4} placeholder="Nimani to‘g‘rilash kerak?" value={text} onChange={(e) => setText(e.target.value)} />, submit: () => go(() => api.orders.action(order.id, 'request-revision', { message: text }), 'So‘rov yuborildi') },
    dispute: { title: 'Nizo ochish', sub: 'Moderator 2 ish kuni ichida yozishmalarni ko‘rib, qaror qiladi. Pul shu vaqtgacha platformada qoladi.', btn: 'Nizo ochish', tone: 'btn-danger', disabled: text.trim().length < 10,
      body: <div className="stack"><Seg value={reason} onChange={setReason} options={[['not_delivered', 'Bajarilmadi'], ['poor_quality', 'Sifatsiz'], ['no_show', 'Kelmadi'], ['unprofessional', 'Odobsizlik'], ['other', 'Boshqa']]} /><textarea className="textarea" rows={4} placeholder="Vaziyatni batafsil yozing" value={text} onChange={(e) => setText(e.target.value)} /></div>,
      submit: () => go(() => api.orders.action(order.id, 'dispute', { reason, description: text }), 'Nizo ochildi') },
    cancel: { title: 'Buyurtmani bekor qilish', btn: 'Bekor qilish', tone: 'btn-danger',
      body: <div className="stack">{isLawyer ? <div className="banner warn small">Pul mijozga to‘liq qaytariladi va bu reytingingizga ta’sir qiladi.</div> : policy ? <div className="banner info small"><div><b>Qaytariladi: {money(policy.refundAmount)}</b><br />{policy.policy}</div></div> : <div className="skel" style={{ height: 50 }} />}<textarea className="textarea" placeholder="Sabab" value={text} onChange={(e) => setText(e.target.value)} /></div>,
      submit: () => go(() => api.orders.cancel(order.id, text), 'Bekor qilindi') },
    review: { title: 'Yuristni baholang', sub: 'Sharhingiz boshqa mijozlarga yurist tanlashda yordam beradi.', btn: 'Yuborish', tone: 'btn-gold',
      body: <div className="stack"><div className="row" style={{ gap: 6 }}>{[1, 2, 3, 4, 5].map((i) => <button key={i} onClick={() => setRating(i)} style={{ border: 0, background: 'none', cursor: 'pointer', color: 'var(--gold-bright)' }}><svg width="34" height="34" viewBox="0 0 24 24" fill={i <= rating ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.5"><path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" /></svg></button>)}</div><textarea className="textarea" rows={4} placeholder="Nima yoqdi, nima yoqmadi?" value={text} onChange={(e) => setText(e.target.value)} /></div>,
      submit: async () => { const r = await run(() => api.orders.review(order.id, { rating, text }), 'Rahmat!'); if (r) onDone() } },
  }
  const c = cfg[kind]
  return (
    <Modal open onClose={onClose} title={c.title} sub={c.sub} footer={<><button className="btn btn-ghost" onClick={onClose}>Yopish</button><button className={`btn ${c.tone ?? 'btn-primary'}`} disabled={busy || c.disabled} onClick={c.submit}>{busy ? <span className="spinner" /> : c.btn}</button></>}>
      {c.body}
    </Modal>
  )
}
