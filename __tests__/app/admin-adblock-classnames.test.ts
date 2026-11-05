import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const dashboardFiles = [
  'app/admin/admin-dashboard.css',
  'components/AdminDashboard.tsx',
  'components/ConfirmDialog.tsx',
  'components/ScheduleManager.tsx',
]

describe('admin dashboard class names', () => {
  it.each(dashboardFiles)('%s does not expose an ad- prefixed token', file => {
    const source = readFileSync(resolve(file), 'utf8')

    expect(source).not.toMatch(/\bad-[\w-]+/)
  })

  it('uses the blocker-safe dashboard-content class in CSS and JSX', () => {
    const stylesheet = readFileSync(
      resolve('app/admin/admin-dashboard.css'),
      'utf8',
    )
    const dashboard = readFileSync(
      resolve('components/AdminDashboard.tsx'),
      'utf8',
    )

    expect(stylesheet).toContain('.dashboard-content')
    expect(dashboard).toContain('className="dashboard-content"')
  })
})
