import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Analytics | Unique Shuffle',
  description: 'View detailed analytics of your shuffling patterns',
}

export default function AnalyticsPage() {
  // Redirect to the dashboard page which contains the analytics implementation
  redirect('/dashboard')
}
