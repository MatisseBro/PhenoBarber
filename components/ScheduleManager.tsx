'use client'

import { useState, useEffect, useCallback } from 'react'
import type { FullSchedule, ScheduleClosure, ScheduleBlock } from '@/lib/schedule-types'
import { ALL_SLOTS, DAY_LABELS } from '@/lib/schedule-types'
import ConfirmDialog from '@/components/ConfirmDialog'

type ScheduleConfirmation =
  | { kind: 'schedule' }
  | { kind: 'closures'; dates: string[]; label: string }
  | { kind: 'block'; id: string; label: string }

export default function ScheduleManager() {
  const [schedule, setSchedule] = useState<FullSchedule | null>(null)
  const [loadError, setLoadError] = useState(false)
  const [saving, setSaving] = useState(false)
  const [confirmation, setConfirmation] = useState<ScheduleConfirmation | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  // Local edits (before save)
  const [openDays, setOpenDays] = useState<number[]>([])
  const [slots, setSlots] = useState<string[]>([])

  // New closure form
  const [closDate, setClosDate] = useState('')
  const [closDateEnd, setClosDateEnd] = useState('')
  const [closReason, setClosReason] = useState('')

  // New block form
  const [blkDate, setBlkDate] = useState('')
  const [blkSlots, setBlkSlots] = useState<string[]>([])
  const [blkReason, setBlkReason] = useState('')

  // Blocks pagination
  const [blkPage, setBlkPage] = useState(0)
  const BLK_PER_PAGE = 8

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/schedule')
      if (!res.ok) throw new Error('Schedule request failed')
      const data: FullSchedule = await res.json()
      setSchedule(data)
      setOpenDays(data.config.openDays)
      setSlots(data.config.slots)
      setLoadError(false)
    } catch { setLoadError(true) }
  }, [])

  useEffect(() => { load() }, [load])

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  async function saveConfig() {
    setSaving(true)
    try {
      const res = await fetch('/api/schedule', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ openDays, slots }),
      })
      if (!res.ok) throw new Error('Schedule save failed')
      await load()
      showToast('Horaires enregistrés pour les prochaines réservations')
    } finally {
      setSaving(false)
    }
  }
  async function addClosure() {
    if (!closDate) return
    const dates: string[] = []
    if (closDateEnd && closDateEnd > closDate) {
      const cur = new Date(`${closDate}T00:00:00Z`)
      const end = new Date(`${closDateEnd}T00:00:00Z`)
      while (cur <= end) {
        dates.push(cur.toISOString().slice(0, 10))
        cur.setUTCDate(cur.getUTCDate() + 1)
      }
    } else {
      dates.push(closDate)
    }
    try {
      const responses = await Promise.all(dates.map(date =>
      fetch('/api/schedule/closures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, reason: closReason }),
      })
      ))
      if (responses.some(response => !response.ok)) throw new Error('Closure save failed')
    } catch { showToast('Impossible d’ajouter cette fermeture'); return }
    setClosDate(''); setClosDateEnd(''); setClosReason(''); load()
    showToast(dates.length > 1
      ? `${dates.length} jours fermés · visibles par les utilisateurs`
      : 'Fermeture ajoutée · visible par les utilisateurs'
    )
  }

  async function deleteClosure(date: string) {
    const res = await fetch(`/api/schedule/closures/${date}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Closure could not be deleted')
  }

  async function addBlock() {
    if (!blkDate || blkSlots.length === 0) return
    const count = blkSlots.length
    try {
      const responses = await Promise.all(blkSlots.map(slot =>
        fetch('/api/schedule/blocks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ date: blkDate, slot, reason: blkReason }),
        })
      ))
      if (responses.some(response => !response.ok)) throw new Error('Block save failed')
    } catch { showToast('Impossible de bloquer ces créneaux'); return }
    setBlkDate(''); setBlkSlots([]); setBlkReason(''); load()
    showToast(`${count} ${count === 1 ? "créneau bloqué" : "créneaux bloqués"} · visibles pour la réservation`)
  }

  function toggleBlkSlot(s: string) {
    setBlkSlots(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])
  }

  async function deleteBlock(id: string) {
    const res = await fetch(`/api/schedule/blocks/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error('Block could not be deleted')
    await load()
  }

  async function applyConfirmation() {
    if (!confirmation || confirming) return
    setConfirming(true)
    try {
      if (confirmation.kind === 'schedule') {
        await saveConfig()
        setConfirmation(null)
      } else if (confirmation.kind === 'closures') {
        await Promise.all(confirmation.dates.map(deleteClosure))
        await load()
        showToast('Fermeture supprimée')
        setConfirmation(null)
      } else {
        await deleteBlock(confirmation.id)
        showToast('Créneau débloqué')
        setConfirmation(null)
      }
    } catch {
      setSaving(false)
      showToast('La modification n’a pas pu être enregistrée')
    } finally {
      setConfirming(false)
    }
  }

  function toggleDay(d: number) {
    setOpenDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d].sort())
  }

  function toggleSlot(s: string) {
    setSlots(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s].sort())
  }

  const fmtDate = (d: string) => d.split('-').reverse().join('/')

  function groupClosures(closures: ScheduleClosure[]) {
    const sorted = [...closures].sort((a, b) => a.date.localeCompare(b.date))
    const groups: { dates: string[]; reason: string }[] = []
    for (const c of sorted) {
      const last = groups[groups.length - 1]
      const prevDate = last?.dates[last.dates.length - 1]
      const isNextDay = prevDate
        ? new Date(c.date).getTime() - new Date(prevDate).getTime() === 86400000
        : false
      if (last && isNextDay && last.reason === (c.reason ?? '')) {
        last.dates.push(c.date)
      } else {
        groups.push({ dates: [c.date], reason: c.reason ?? '' })
      }
    }
    return groups
  }

  if (!schedule && loadError) return (
    <div className="res-card" role="alert">
      <p>Impossible de charger le planning.</p>
      <button className="btn btn-primary btn-sm" onClick={load}>Réessayer</button>
    </div>
  )

  if (!schedule) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
      <span className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} />
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

      {confirmation && (
        <ConfirmDialog
          title={confirmation.kind === 'schedule' ? 'Appliquer ce planning ?' : confirmation.kind === 'closures' ? 'Supprimer cette fermeture ?' : 'Débloquer ce créneau ?'}
          description={confirmation.kind === 'schedule'
            ? 'Cette grille hebdomadaire s’appliquera aux nouveaux créneaux proposés pour toutes les dates futures, jusqu’à une prochaine modification. Les rendez-vous déjà enregistrés restent inchangés dans l’agenda.'
            : confirmation.kind === 'closures'
              ? `La fermeture du ${confirmation.label} sera retirée. Les clients pourront à nouveau réserver ces dates.`
              : `Le blocage du ${confirmation.label} sera retiré. Ce créneau pourra à nouveau être réservé.`}
          confirmLabel={confirmation.kind === 'schedule' ? 'Appliquer le planning' : 'Confirmer'}
          destructive={confirmation.kind !== 'schedule'}
          onConfirm={applyConfirmation}
          onCancel={() => setConfirmation(null)}
        />
      )}

      {toast && (
        <div style={{
          position: 'fixed', top: '1.25rem', right: '1.25rem', zIndex: 9999,
          background: 'rgba(22,163,74,.14)', border: '1px solid rgba(22,163,74,.28)',
          borderRadius: 99, padding: '.35rem .85rem',
          fontSize: '.78rem', fontWeight: 600, color: '#4ade80',
          display: 'flex', alignItems: 'center', gap: '.35rem',
          backdropFilter: 'blur(10px)', boxShadow: '0 2px 16px rgba(0,0,0,.35)',
          animation: 'fadeInDown .18s ease',
          letterSpacing: '.01em',
        }}>
          <span style={{ fontSize: '.82rem', lineHeight: 1 }}>✓</span>
          {toast}
        </div>
      )}

      {/* ── JOURS D'OUVERTURE ── */}
      <div className="res-card">
        <div className="res-head" style={{ marginBottom: '1rem' }}>
          <div className="res-name">Jours d&apos;ouverture</div>
        </div>
        <div className="dashboard-schedule-period">
          <strong>Planning hebdomadaire permanent</strong>
          <span>Les jours et horaires cochés définissent les nouveaux créneaux proposés à la réservation pour toutes les dates futures, jusqu’à leur prochaine modification. Les rendez-vous déjà enregistrés restent inchangés dans l’agenda. Utilisez les fermetures et blocages ci-dessous pour une date précise.</span>
        </div>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
          {DAY_LABELS.map((label, i) => {
            const open = openDays.includes(i)
            return (
              <button
                key={i}
                onClick={() => toggleDay(i)}
                style={{
                  padding: '.5rem .9rem',
                  borderRadius: 8,
                  border: `1.5px solid ${open ? 'var(--yellow)' : 'rgba(255,255,255,.12)'}`,
                  background: open ? 'rgba(253,224,71,.12)' : 'transparent',
                  color: open ? 'var(--yellow)' : 'rgba(255,255,255,.4)',
                  fontWeight: open ? 700 : 400,
                  cursor: 'pointer',
                  fontSize: '.85rem',
                  transition: 'all .15s',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>
        <p style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.3)', margin: '0 0 1.25rem' }}>
          Les jours non cochés seront grisés dans le calendrier de réservation.
        </p>

        {/* ── CRÉNEAUX HORAIRES ── */}
        <div className="res-detail-label" style={{ marginBottom: '.6rem' }}>Créneaux disponibles</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(72px, 1fr))', gap: '.4rem', marginBottom: '1.25rem' }}>
          {ALL_SLOTS.map(s => {
            const active = slots.includes(s)
            return (
              <button
                key={s}
                onClick={() => toggleSlot(s)}
                style={{
                  padding: '.4rem .3rem',
                  borderRadius: 7,
                  border: `1.5px solid ${active ? 'var(--yellow)' : 'rgba(255,255,255,.1)'}`,
                  background: active ? 'rgba(253,224,71,.1)' : 'transparent',
                  color: active ? 'var(--yellow)' : 'rgba(255,255,255,.3)',
                  fontWeight: active ? 700 : 400,
                  cursor: 'pointer',
                  fontSize: '.8rem',
                  transition: 'all .15s',
                }}
              >
                {s}
              </button>
            )
          })}
        </div>

        <button
          className="btn btn-success btn-sm"
          onClick={() => setConfirmation({ kind: 'schedule' })}
          disabled={saving}
          style={{ alignSelf: 'flex-start' }}
        >
          {saving ? 'Sauvegarde…' : '✓ Sauvegarder les horaires'}
        </button>
      </div>

      {/* ── FERMETURES EXCEPTIONNELLES ── */}
      <div className="res-card">
        <div className="res-head" style={{ marginBottom: '1rem' }}>
          <div className="res-name">Fermetures exceptionnelles</div>
        </div>
        <p style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.3)', margin: '0 0 1rem' }}>
          Vacances, jours fériés, congés… Le jour entier sera marqué indisponible.
        </p>

        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '1rem', alignItems: 'flex-end' }}>
          <div>
            <div className="res-detail-label" style={{ marginBottom: '.3rem' }}>Du</div>
            <input
              type="date"
              className="form-input"
              style={{ width: 152 }}
              value={closDate}
              onChange={e => setClosDate(e.target.value)}
            />
          </div>
          <div>
            <div className="res-detail-label" style={{ marginBottom: '.3rem' }}>Au <span style={{ opacity: .45, fontWeight: 400 }}>(optionnel)</span></div>
            <input
              type="date"
              className="form-input"
              style={{ width: 152 }}
              value={closDateEnd}
              min={closDate || undefined}
              onChange={e => setClosDateEnd(e.target.value)}
            />
          </div>
          <div style={{ flex: 1, minWidth: 130 }}>
            <div className="res-detail-label" style={{ marginBottom: '.3rem' }}>Motif (optionnel)</div>
            <input
              type="text"
              className="form-input"
              placeholder="Ex : Vacances"
              value={closReason}
              onChange={e => setClosReason(e.target.value)}
            />
          </div>
          <button className="btn btn-primary btn-sm" onClick={addClosure} disabled={!closDate}>+ Ajouter</button>
        </div>

        {schedule.closures.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,.25)', fontSize: '.83rem' }}>Aucune fermeture prévue.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
            {groupClosures(schedule.closures).map(g => {
              const isRange = g.dates.length > 1
              const label = isRange
                ? `${fmtDate(g.dates[0])} → ${fmtDate(g.dates[g.dates.length - 1])}`
                : fmtDate(g.dates[0])
              return (
                <div key={g.dates[0]} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '.5rem .75rem', borderRadius: 8,
                  background: 'rgba(255,100,100,.06)', border: '1px solid rgba(255,100,100,.15)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 600, color: '#fff', fontSize: '.85rem' }}>{label}</span>
                    {isRange && (
                      <span style={{
                        fontSize: '.68rem', color: 'rgba(255,130,130,.7)',
                        background: 'rgba(255,100,100,.1)', border: '1px solid rgba(255,100,100,.2)',
                        borderRadius: 99, padding: '.1rem .45rem', fontWeight: 600,
                      }}>
                        {g.dates.length}j
                      </span>
                    )}
                    {g.reason && <span style={{ color: 'rgba(255,255,255,.4)', fontSize: '.78rem' }}>- {g.reason}</span>}
                  </div>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => setConfirmation({ kind: 'closures', dates: g.dates, label })}
                    style={{ padding: '.25rem .6rem', fontSize: '.75rem', flexShrink: 0 }}
                  >
                    ✕
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── BLOQUER UN CRÉNEAU PRÉCIS ── */}
      <div className="res-card">
        <div className="res-head" style={{ marginBottom: '1rem' }}>
          <div className="res-name">Bloquer un créneau précis</div>
        </div>
        <p style={{ fontSize: '.78rem', color: 'rgba(255,255,255,.3)', margin: '0 0 1rem' }}>
          Bloquer un seul horaire sur une date (rendez-vous perso, livraison…).
        </p>

        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap', marginBottom: '.75rem', alignItems: 'flex-end' }}>
          <div>
            <div className="res-detail-label" style={{ marginBottom: '.3rem' }}>Date</div>
            <input
              type="date"
              className="form-input"
              style={{ width: 160 }}
              value={blkDate}
              onChange={e => setBlkDate(e.target.value)}
            />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <div className="res-detail-label" style={{ marginBottom: '.3rem' }}>Motif (optionnel)</div>
            <input
              type="text"
              className="form-input"
              placeholder="Ex : RDV perso"
              value={blkReason}
              onChange={e => setBlkReason(e.target.value)}
            />
          </div>
        </div>

        <div className="res-detail-label" style={{ marginBottom: '.5rem' }}>
          Créneaux à bloquer
          {blkSlots.length > 0 && (
            <span style={{ marginLeft: '.5rem', color: 'var(--yellow)', fontWeight: 700 }}>
              {blkSlots.length} sélectionné{blkSlots.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(70px, 1fr))', gap: '.35rem', marginBottom: '1rem' }}>
          {ALL_SLOTS.map(s => {
            const sel = blkSlots.includes(s)
            return (
              <button
                key={s}
                onClick={() => toggleBlkSlot(s)}
                style={{
                  padding: '.35rem .25rem',
                  borderRadius: 7,
                  border: `1.5px solid ${sel ? 'var(--error)' : 'rgba(255,255,255,.1)'}`,
                  background: sel ? 'rgba(239,68,68,.12)' : 'transparent',
                  color: sel ? '#f87171' : 'rgba(255,255,255,.3)',
                  fontWeight: sel ? 700 : 400,
                  cursor: 'pointer',
                  fontSize: '.78rem',
                  transition: 'all .12s',
                }}
              >
                {s}
              </button>
            )
          })}
        </div>

        <button
          className="btn btn-danger btn-sm"
          onClick={addBlock}
          disabled={!blkDate || blkSlots.length === 0}
          style={{ alignSelf: 'flex-start' }}
        >
          ✕ Bloquer {blkSlots.length > 0 ? `${blkSlots.length} créneau${blkSlots.length > 1 ? 'x' : ''}` : 'les créneaux'}
        </button>

        {schedule.blocks.length === 0 ? (
          <p style={{ color: 'rgba(255,255,255,.25)', fontSize: '.83rem', marginTop: '1rem' }}>Aucun créneau bloqué manuellement.</p>
        ) : (() => {
          const pageCount = Math.ceil(schedule.blocks.length / BLK_PER_PAGE)
          const safePage = Math.min(blkPage, pageCount - 1)
          const visible = schedule.blocks.slice(safePage * BLK_PER_PAGE, (safePage + 1) * BLK_PER_PAGE)
          return (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', margin: '1rem 0 .5rem' }}>
                <span style={{ fontSize: '.75rem', color: 'rgba(255,255,255,.3)' }}>
                  {schedule.blocks.length} créneau{schedule.blocks.length > 1 ? 'x' : ''} bloqué{schedule.blocks.length > 1 ? 's' : ''}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                {visible.map((b: ScheduleBlock) => (
                  <div key={b.id} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '.5rem .75rem', borderRadius: 8,
                    background: 'rgba(253,224,71,.04)', border: '1px solid rgba(253,224,71,.12)',
                  }}>
                    <div>
                      <span style={{ fontWeight: 600, color: '#fff', fontSize: '.85rem' }}>{fmtDate(b.date)}</span>
                      <span style={{ color: 'var(--yellow)', fontSize: '.85rem', margin: '0 .4rem' }}>à {b.slot}</span>
                      {b.reason && <span style={{ color: 'rgba(255,255,255,.4)', fontSize: '.78rem' }}>- {b.reason}</span>}
                    </div>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => setConfirmation({ kind: 'block', id: b.id, label: `${fmtDate(b.date)} à ${b.slot}` })}
                      style={{ padding: '.25rem .6rem', fontSize: '.75rem' }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              {pageCount > 1 && (
                <div className="pagination" style={{ marginTop: '.75rem' }}>
                  <button className="btn btn-ghost btn-sm" disabled={safePage === 0} onClick={() => setBlkPage(p => p - 1)}>← Précédent</button>
                  <span className="page-info">{safePage + 1} / {pageCount}</span>
                  <button className="btn btn-ghost btn-sm" disabled={safePage >= pageCount - 1} onClick={() => setBlkPage(p => p + 1)}>Suivant →</button>
                </div>
              )}
            </>
          )
        })()}
      </div>

    </div>
  )
}
