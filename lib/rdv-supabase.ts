import type { RdvBooking, RdvStatus, RdvCat } from './rdv-types'

export function toRdvRow(b: RdvBooking): Record<string, unknown> {
  return {
    id:               b.id,
    created_at:       b.createdAt,
    nom:              b.nom,
    email:            b.email,
    telephone:        b.telephone,
    categorie:        b.categorie,
    prestation:       b.prestation,
    prestation_label: b.prestationLabel,
    degrade:          b.degrade       ?? null,
    degrade_label:    b.degradeLabel  ?? null,
    options:          b.options,
    options_labels:   b.optionsLabels,
    total_price:      b.totalPrice,
    total_duration:   b.totalDuration,
    date:             b.date,
    slot:             b.slot,
    status:           b.status,
    notes:            b.notes        ?? null,
    group_id:         b.groupId      ?? null,
    person_label:     b.personLabel  ?? null,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fromRdvRow(row: any): RdvBooking {
  return {
    id:             row.id,
    createdAt:      row.created_at,
    nom:            row.nom,
    email:          row.email,
    telephone:      row.telephone,
    categorie:      row.categorie       as RdvCat,
    prestation:     row.prestation,
    prestationLabel:row.prestation_label,
    degrade:        row.degrade         ?? undefined,
    degradeLabel:   row.degrade_label   ?? undefined,
    options:        (row.options        as string[]) ?? [],
    optionsLabels:  (row.options_labels as string[]) ?? [],
    totalPrice:     Number(row.total_price),
    totalDuration:  Number(row.total_duration),
    date:           row.date,
    slot:           row.slot,
    status:         row.status as RdvStatus,
    notes:          row.notes        ?? undefined,
    groupId:        row.group_id     ?? undefined,
    personLabel:    row.person_label ?? undefined,
  }
}
