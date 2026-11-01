'use client'

import dynamic from 'next/dynamic'

const AdminDashboard = dynamic(() => import('@/components/AdminDashboard'), {
  ssr: false,
  loading: () => (
    <div className="admin-login" aria-label="Chargement de l’administration">
      <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
    </div>
  ),
})

export default function AdminDashboardClient() {
  return <AdminDashboard />
}
