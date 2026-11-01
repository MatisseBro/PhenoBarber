export interface ScheduleConfig {
  openDays: number[]   // 0=Dim, 1=Lun, 2=Mar, 3=Mer, 4=Jeu, 5=Ven, 6=Sam
  slots: string[]      // ex: ['10:00', '10:30', ...]
  updatedAt: string
}

export interface ScheduleClosure {
  date: string         // YYYY-MM-DD
  reason: string
}

export interface ScheduleBlock {
  id: string
  date: string         // YYYY-MM-DD
  slot: string         // HH:mm
  reason: string
}

export interface FullSchedule {
  config: ScheduleConfig
  closures: ScheduleClosure[]
  blocks: ScheduleBlock[]
}

export const ALL_SLOTS = [
  '09:00','09:30','10:00','10:30','11:00','11:30',
  '12:00','12:30','13:00','13:30','14:00','14:30',
  '15:00','15:30','16:00','16:30','17:00','17:30',
  '18:00','18:30','19:00','19:30',
]

export const DAY_LABELS = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam']
