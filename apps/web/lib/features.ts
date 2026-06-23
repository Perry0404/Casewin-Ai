// Feature flags.
//
// Prediction market is intentionally disabled for now. To re-activate it later,
// set the env var NEXT_PUBLIC_PREDICTIONS_ENABLED=true (in Vercel / .env) and
// redeploy. No code changes needed — the nav link, all /predictions/* pages,
// and the prediction API routes read this flag.
export const PREDICTIONS_ENABLED =
  process.env.NEXT_PUBLIC_PREDICTIONS_ENABLED === 'true'
