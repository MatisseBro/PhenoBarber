import { createHash, timingSafeEqual } from 'crypto'
import { NextResponse } from 'next/server'
import { getInactiveClients } from '@/lib/clients'
import { sendRdvReminder, sendRelance } from '@/lib/email'
import { deliverClaimed, type ClaimedDeliveryState } from '@/lib/notification-delivery'
import { dayOfWeekInParis, monthInParis, tomorrowInParis } from '@/lib/paris-time'
import { sendRdvReminderSms } from '@/lib/sms'
import { getSupabase } from '@/lib/supabase'

interface DeliveryCounters {
  sent: number
  failed: number
  uncertain: number
  skipped: number
}

function countDelivery(counters: DeliveryCounters, state: ClaimedDeliveryState) {
  counters[state] += 1
}

// Appelé chaque jour à 18 h, heure de Paris, par un ordonnanceur externe.
// L'ordonnanceur doit envoyer : Authorization: Bearer <CRON_SECRET>.
export async function POST(req: Request) {
  const expectedSecret = process.env.CRON_SECRET
  const authorization = req.headers.get('authorization')
  const suppliedSecret = authorization?.startsWith('Bearer ') ? authorization.slice(7) : ''
  const expectedHash = createHash('sha256').update(expectedSecret ?? '').digest()
  const suppliedHash = createHash('sha256').update(suppliedSecret).digest()
  if (!expectedSecret || expectedSecret.length < 24 || !timingSafeEqual(expectedHash, suppliedHash)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const now = new Date()
  const tomorrow = tomorrowInParis(now)
  const counters: DeliveryCounters = { sent: 0, failed: 0, uncertain: 0, skipped: 0 }
  const sb = getSupabase()

  const { data: rdvs, error: rdvError } = await sb
    .from('rdv_bookings')
    .select('id, nom, email, telephone, date, slot, prestation_label, degrade_label, options_labels, total_price, total_duration, categorie, group_id, person_label')
    .eq('date', tomorrow)
    .neq('status', 'cancelled')

  if (rdvError) {
    console.error('[cron] Échec de lecture des rendez-vous à rappeler')
    return NextResponse.json({ error: 'Reminder lookup failed' }, { status: 503 })
  }

  const groupedRows = new Map<string, typeof rdvs>()
  for (const row of rdvs ?? []) {
    const key = row.group_id ? `group:${row.group_id}` : `booking:${row.id}`
    groupedRows.set(key, [...(groupedRows.get(key) ?? []), row])
  }

  for (const [reminderId, unsortedRows] of groupedRows) {
    const rows = [...(unsortedRows ?? [])].sort((a, b) => String(a.slot).localeCompare(String(b.slot)))
    const row = rows[0]
    if (!row) continue
    const isGroup = Boolean(row.group_id)
    const data = {
      nom: row.nom as string,
      email: row.email as string,
      telephone: row.telephone as string,
      date: row.date as string,
      slot: row.slot as string,
      prestationLabel: isGroup
        ? rows.map(item => `${item.person_label ?? 'Personne'} : ${item.prestation_label}`).join(' | ')
        : row.prestation_label as string,
      degradeLabel: isGroup ? undefined : row.degrade_label as string | undefined,
      optionsLabels: isGroup ? [] : (row.options_labels ?? []) as string[],
      totalPrice: rows.reduce((sum, item) => sum + Number(item.total_price), 0),
      totalDuration: rows.reduce((sum, item) => sum + Number(item.total_duration), 0),
      categorie: row.categorie as string,
    }

    countDelivery(
      counters,
      await deliverClaimed(`rdv-reminder:${reminderId}:email`, 'email', key => sendRdvReminder(data, key)),
    )
    countDelivery(
      counters,
      await deliverClaimed(
        `rdv-reminder:${reminderId}:sms`,
        'sms',
        () => sendRdvReminderSms({
          ...data,
          prestationLabel: isGroup ? `Groupe de ${rows.length} personnes` : data.prestationLabel,
        }),
      ),
    )
  }

  // Relances marketing le mardi, avec une seule clé par client et mois parisien.
  if (dayOfWeekInParis(now) === 2) {
    try {
      const inactive = await getInactiveClients(30)
      const campaignMonth = monthInParis(now)
      for (const client of inactive) {
        if (!client.email) continue
        countDelivery(
          counters,
          await deliverClaimed(
            `marketing-reactivation:${client.id}:${campaignMonth}:email`,
            'email',
            key => sendRelance(
              { nom: client.nom, email: client.email!, lastRdvAt: client.lastRdvAt ?? undefined },
              key,
            ),
          ),
        )
      }
    } catch {
      console.error('[cron] Échec de lecture des clients éligibles à la relance')
      return NextResponse.json({ error: 'Marketing lookup failed' }, { status: 503 })
    }
  }

  return NextResponse.json({ ok: true, date: tomorrow, deliveries: counters })
}
