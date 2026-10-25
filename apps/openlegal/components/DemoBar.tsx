/** Shown on every page of the demo sites, which run on a separate copy of the database holding sample data only. */
export default function DemoBar() {
  if (process.env.NEXT_PUBLIC_DEMO !== '1') return null
  const guide = (process.env.NEXT_PUBLIC_COURT_URL || 'https://court-demo.casewinai.com') + '/demo'
  return (
    <div className="bg-[#FDF5E6] px-4 py-2 text-center text-[13px] text-[#93370D]">
      <b>Demo.</b> Everything here is sample data on a separate test database — nothing is real and nothing reaches the live service.{' '}
      <a href={guide} className="font-semibold underline underline-offset-2">
        Demo logins and what to try
      </a>
    </div>
  )
}
