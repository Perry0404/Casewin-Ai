<a href="https://orynth.dev/projects/casewinai" target="_blank" rel="noopener">
  <img src="https://orynth.dev/api/badge/casewinai?theme=light&style=default" alt="Featured on Orynth" width="260" height="80" />
</a>

# ðŸ‡³ðŸ‡¬ CaseWin-NG: Nigerian Legal AI Platform

## Complete Legal AI Assistant for Nigerian Lawyers

CaseWin-NG provides **8 comprehensive AI-powered legal capabilities** trained on Nigerian law:

### ðŸ¤– AI Features
1. **Legal Document Drafting** (â‚¦500) - Writs, Affidavits, Motions, Defence
2. **Case Outcome Prediction** (â‚¦1,000) - AI analysis with 8,427 Nigerian cases
3. **Legal Research Assistant** (FREE) - Answer questions with case citations
4. **Contract Analysis** (â‚¦1,500) - Risk assessment & compliance checking
5. **Case Summarization** (â‚¦750) - Condense lengthy judgments
6. **Legal Translation** (FREE) - English/Yoruba/Hausa/Igbo
7. **Argument Generator** (â‚¦800) - For/against any legal position
8. **Compliance Checker** (â‚¦1,200) - CAMA, Labour, Tax, Data Protection

### âš–ï¸ Marketplace
- Browse verified Nigerian lawyers
- Filter by specialization, location, hourly rate
- Book consultations with instant payment
- Review and rating system

### ðŸ’¬ WhatsApp Bot
- 24/7 access to all AI features
- No app download required
- Pay via Paystack (cards, bank transfer, USSD)

---

## ðŸš€ Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- Supabase account (free tier)
- Paystack account

### 1. Clone & Install
\`\`\`bash
git clone https://github.com/Perry0404/Casewin-Ai.git
cd Casewin-Ai
npm install
cd apps/web && npm install
cd ../whatsapp-bot && npm install
\`\`\`

### 2. Start Services
\`\`\`bash
# Start Ollama + Qdrant
docker-compose up -d

# Pull AI models (takes 5-10 min)
docker exec -it casewin-ollama ollama pull llama3.2:3b
docker exec -it casewin-ollama ollama pull nomic-embed-text
\`\`\`

### 3. Configure Environment
\`\`\`bash
cp .env.example .env
# Edit .env with your Supabase & Paystack keys
\`\`\`

### 4. Setup Database
\`\`\`bash
# Run Supabase migrations
cd supabase
supabase db push
\`\`\`

### 5. Run Development Server
\`\`\`bash
npm run dev
# Visit http://localhost:3000
\`\`\`

---

## ðŸ“Š Tech Stack

- **Frontend**: Next.js 15 (App Router), React 18, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **AI**: Ollama (Llama 3.2 3B), Qdrant (vector database)
- **Payments**: Paystack (Nigerian gateway)
- **WhatsApp**: Baileys (no official API needed)
- **Blockchain**: Solana + Anchor (escrow contracts)

---

## ðŸ“ Project Structure

\`\`\`
Casewin-Ai/
â”œâ”€â”€ apps/
â”‚   â”œâ”€â”€ web/              # Next.js web application
â”‚   â”‚   â”œâ”€â”€ app/
â”‚   â”‚   â”‚   â”œâ”€â”€ api/     # 11 API endpoints
â”‚   â”‚   â”‚   â”œâ”€â”€ marketplace/  # Lawyer marketplace
â”‚   â”‚   â”‚   â””â”€â”€ page.tsx
â”‚   â””â”€â”€ whatsapp-bot/     # Baileys WhatsApp integration
â”œâ”€â”€ programs/
â”‚   â””â”€â”€ casewin-escrow/   # Solana Anchor program
â”œâ”€â”€ supabase/
â”‚   â””â”€â”€ migrations/       # Database schema (4 migrations)
â”œâ”€â”€ data/
â”‚   â””â”€â”€ nigerian_cases_2025/  # Sample Nigerian cases
â”œâ”€â”€ scripts/
â”‚   â””â”€â”€ index-cases.ts    # Qdrant indexing script
â””â”€â”€ docker-compose.yml
\`\`\`

---

## ðŸ“– Documentation

See [AI_CAPABILITIES.md](./AI_CAPABILITIES.md) for detailed documentation of all 8 AI features with examples.

---

## ðŸŒ Deployment

Deploy to Contabo/Hetzner VPS (â‚¬4.99-â‚¬5.83/month):

\`\`\`bash
chmod +x deploy-vps.sh
./deploy-vps.sh
\`\`\`

---

## ðŸ“ License

MIT License - See LICENSE file

---

**Built with â¤ï¸ for Nigerian lawyers** ðŸ‡³ðŸ‡¬âš–ï¸ðŸ¤–



