# WhatsApp Integration via Twilio

CaseWin Predictions uses **Twilio WhatsApp API** for the WhatsApp betting bot.

## Why Twilio?

| Feature | Twilio | Direct Meta Cloud API | Baileys (Unofficial) |
|---|---|---|---|
| Test immediately | ✅ Sandbox | ❌ Needs Meta Business verification | ✅ But bannable |
| Serverless (Vercel) | ✅ | ✅ | ❌ Needs always-on server |
| Production ready | ✅ | ✅ If verified | ❌ Against TOS |
| SDK quality | ✅ Excellent | ⚠️ Raw API | ✅ Unofficial |
| Setup time | 5 minutes | Days/weeks | 10 minutes |

## Quick Setup (5 minutes)

### 1. Create Twilio Account

1. Go to [twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Sign up (free trial includes $15 credit)
3. Note your **Account SID** and **Auth Token** from the console

### 2. Enable WhatsApp Sandbox

1. Go to **Messaging → Try it Out → Send a WhatsApp message**
2. Twilio gives you a sandbox number (e.g., `+14155238886`)
3. Send the join code to the sandbox number from your WhatsApp (e.g., "join hungry-tiger")
4. Your number is now connected to the sandbox

### 3. Configure Webhook

1. In Twilio Console → Messaging → Settings → WhatsApp Sandbox
2. Set **"When a message comes in"** webhook URL to:
   ```
   https://your-domain.com/api/whatsapp
   ```
   For Vercel: `https://casewin-ai-web.vercel.app/api/whatsapp`
3. Method: **POST**

### 4. Set Environment Variables

Add to your `.env.local` (development) or Vercel Environment Variables (production):

```env
# Twilio WhatsApp Config
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
```

### 5. Test It!

1. Send **"hi"** to the Twilio sandbox WhatsApp number
2. You should get the CaseWin Predictions welcome message
3. Try **"sports"** to browse sports markets
4. Try **"crypto"** for crypto predictions

## Environment Variables Reference

| Variable | Required | Example | Description |
|---|---|---|---|
| `TWILIO_ACCOUNT_SID` | ✅ | `ACxxxx...` | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | ✅ | `abc123...` | Twilio Auth Token |
| `TWILIO_WHATSAPP_NUMBER` | ✅ | `whatsapp:+14155238886` | Your Twilio WhatsApp number |
| `NEXT_PUBLIC_APP_URL` | ✅ | `https://casewin.ng` | Your app URL (for API calls) |

## Architecture

```
User's WhatsApp
      ↓ (sends message)
Twilio Cloud
      ↓ (webhook POST, form-urlencoded)
/api/whatsapp (Next.js API route on Vercel)
      ↓ (processes message)
      ↓ → /api/predictions (fetch markets)
      ↓ → /api/predictions/oracle (AI analysis via Grok 4)
      ↓ → /api/predictions/trade (execute bets)
      ↓ (returns TwiML response)
Twilio Cloud
      ↓ (sends reply)
User's WhatsApp
```

## Bot Commands

| Command | Description |
|---|---|
| `help` / `hi` | Show main menu |
| `sports` | Browse sports markets |
| `crypto` | Browse crypto markets |
| `tech` | Tech predictions |
| `politics` | World politics |
| `elections` | Election predictions |
| `legal` | Court cases |
| `markets` | All open markets |
| `balance` | Check wallet balance |
| `deposit 5000` | Add ₦5,000 to wallet |
| `oracle 3` | AI Oracle analysis on market #3 |
| `ask [question]` | Ask Oracle about selected market |
| `yes 100` | Bet 100 shares YES |
| `no 200` | Bet 200 shares NO |
| `confirm` | Confirm pending bet |
| `cancel` / `back` | Go back |

## Going to Production

When ready for production (beyond sandbox):

1. **Apply for Twilio WhatsApp Business Profile**
   - Twilio Console → Messaging → Senders → WhatsApp Senders
   - Submit business details and use case
   - Twilio handles Meta approval (usually 1-2 weeks)

2. **Get a dedicated WhatsApp number**
   - Buy a Twilio phone number or port your existing number
   - Update `TWILIO_WHATSAPP_NUMBER` env var

3. **Update webhook URL** to your production domain

4. **Template messages** (optional)
   - For proactive messages (not replies), you need approved templates
   - Submit via Twilio Console → Messaging → Content Template Builder

## Pricing

- **Twilio Free Trial**: $15 credit, sufficient for testing
- **Per-conversation pricing** (Nigeria):
  - Utility conversations: ~$0.0080
  - Marketing conversations: ~$0.0532
  - Service conversations: Free (first 1,000/month)
- A "conversation" = 24-hour window of messages with one user

## Development (Baileys Bot)

For local development/testing without Twilio, the Baileys bot is still available:

```bash
cd apps/whatsapp-bot
npm install
npm run dev
# Scan QR code with WhatsApp
```

⚠️ Baileys is unofficial and should NOT be used in production. Use Twilio for production deployments.

## Troubleshooting

| Issue | Solution |
|---|---|
| No reply from bot | Check webhook URL is correct in Twilio Console |
| "Forbidden" errors | Verify `TWILIO_AUTH_TOKEN` is correct |
| Oracle timeout | Increase `maxDuration` in route.ts or upgrade Vercel plan |
| Sandbox expired | Re-send the "join" code to the sandbox number |
| Message not delivered | Check Twilio Console → Monitor → Logs for errors |
