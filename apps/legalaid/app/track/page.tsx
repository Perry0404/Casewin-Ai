import type { Metadata } from 'next'
import { PublicPage } from '@/components/site'
import TrackForm from './TrackForm'

export const metadata: Metadata = { title: 'Track a request' }

export default function TrackPage() {
  return (
    <PublicPage>
      <h1 className="font-display text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">Track a request</h1>
      <p className="mt-3 max-w-xl text-lg text-ink-500">Enter the reference and PIN you were given. You will see what the volunteer has done so far.</p>
      <div className="mt-10">
        <TrackForm />
      </div>
    </PublicPage>
  )
}
