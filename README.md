# 🇳🇬 CaseWin-NG: Nigerian Legal AI Platform

## Complete Legal AI Assistant for Nigerian Lawyers

CaseWin-NG provides **8 comprehensive AI-powered legal capabilities** trained on Nigerian law:

### 🤖 AI Features
1. **Legal Document Drafting** (₦500) - Writs, Affidavits, Motions, Defence
2. **Case Outcome Prediction** (₦1,000) - AI analysis with 8,427 Nigerian cases
3. **Legal Research Assistant** (FREE) - Answer questions with case citations
4. **Contract Analysis** (₦1,500) - Risk assessment & compliance checking
5. **Case Summarization** (₦750) - Condense lengthy judgments
6. **Legal Translation** (FREE) - English/Yoruba/Hausa/Igbo
7. **Argument Generator** (₦800) - For/against any legal position
8. **Compliance Checker** (₦1,200) - CAMA, Labour, Tax, Data Protection

### ⚖️ Marketplace
- Browse verified Nigerian lawyers
- Filter by specialization, location, hourly rate
- Book consultations with instant payment
- Review and rating system

### 💬 WhatsApp Bot
- 24/7 access to all AI features
- No app download required
- Pay via Paystack (cards, bank transfer, USSD)

---

## 🚀 Quick Start

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

## 📊 Tech Stack

- **Frontend**: Next.js 15 (App Router), React 18, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **AI**: Ollama (Llama 3.2 3B), Qdrant (vector database)
- **Payments**: Paystack (Nigerian gateway)
- **WhatsApp**: Baileys (no official API needed)
- **Blockchain**: Solana + Anchor (escrow contracts)

---

## 📁 Project Structure

\`\`\`
Casewin-Ai/
├── apps/
│   ├── web/              # Next.js web application
│   │   ├── app/
│   │   │   ├── api/     # 11 API endpoints
│   │   │   ├── marketplace/  # Lawyer marketplace
│   │   │   └── page.tsx
│   └── whatsapp-bot/     # Baileys WhatsApp integration
├── programs/
│   └── casewin-escrow/   # Solana Anchor program
├── supabase/
│   └── migrations/       # Database schema (4 migrations)
├── data/
│   └── nigerian_cases_2025/  # Sample Nigerian cases
├── scripts/
│   └── index-cases.ts    # Qdrant indexing script
└── docker-compose.yml
\`\`\`

---

## 📖 Documentation

See [AI_CAPABILITIES.md](./AI_CAPABILITIES.md) for detailed documentation of all 8 AI features with examples.

---

## 🌍 Deployment

Deploy to Contabo/Hetzner VPS (€4.99-€5.83/month):

\`\`\`bash
chmod +x deploy-vps.sh
./deploy-vps.sh
\`\`\`

---

## 📝 License

MIT License - See LICENSE file

---

**Built with ❤️ for Nigerian lawyers** 🇳🇬⚖️🤖
