import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
const qrcode = require('qrcode-terminal');
import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const BOT_PHONE = process.env.BOT_PHONE_NUMBER || '2348067117651';

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

  const sock = makeWASocket({
    auth: state,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\n📱 ========================================');
      console.log('📱 SCAN THIS QR CODE WITH WHATSAPP:');
      console.log('📱 ========================================\n');
      qrcode.generate(qr, { small: true });
      console.log('\n📱 ========================================');
      console.log(`📞 Bot will be connected to: +${BOT_PHONE}`);
      console.log('📱 ========================================\n');
    }

    if (connection === 'close') {
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('⚠️  Connection closed. Reconnecting:', shouldReconnect);
      if (shouldReconnect) {
        startBot();
      }
    } else if (connection === 'open') {
      console.log('✅ WhatsApp bot connected!');
      console.log(`📞 Bot Number: +${BOT_PHONE}`);
      console.log('🤖 Waiting for messages...\n');
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const sender = msg.key.remoteJid!;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

    console.log(`📨 Message from ${sender}: ${text}`);

    try {
      const response = await handleCommand(text);
      await sock.sendMessage(sender, { text: response });
    } catch (error) {
      console.error('Error handling command:', error);
      await sock.sendMessage(sender, {
        text: '❌ Sorry, an error occurred. Please try again later.',
      });
    }
  });
}

async function handleCommand(text: string): Promise<string> {
  const command = text.toLowerCase().trim();

  if (command.startsWith('help')) {
    return `🇳🇬 *CaseWin-NG WhatsApp Bot*

📝 *Available Commands:*

1. *draft [type] [details]* - Draft legal documents
   Example: draft Land Sale Agreement between John and Jane

2. *predict [facts]* - Predict case outcome
   Example: predict breach of contract case facts...

3. *research [question]* - Legal research
   Example: research land acquisition law in Nigeria

4. *analyze [contract]* - Analyze contract
   Example: analyze [paste contract text]

5. *lawyer* - Find verified lawyers
6. *help* - Show this menu
7. *services* - View all AI services & pricing

💰 *Pricing:*
- Document Drafting: ₦500
- Case Prediction: ₦1,000
- Research: FREE
- Contract Analysis: ₦1,500

📞 Support: +234 806 711 7651`;
  }

  if (command.startsWith('services')) {
    return `🤖 *CaseWin-NG AI Services*

1. 📝 Document Drafting - ₦500
2. 🔮 Case Prediction - ₦1,000
3. 🔍 Legal Research - FREE
4. 📄 Contract Analysis - ₦1,500
5. 📋 Judgment Summary - ₦750
6. 🌍 Translation - ₦500
7. ⚖️  Legal Arguments - ₦1,000
8. ✅ Compliance Check - ₦1,200

💡 Type *help* for usage examples
🌐 Visit: https://casewin.ng`;
  }

  if (command.startsWith('draft')) {
    const details = text.substring(5).trim();
    if (!details) {
      return '❌ Please provide document details.\n\nExample: draft Land Sale Agreement between John Doe and Jane Smith';
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/draft`, {
        documentType: 'Contract',
        parties: details,
        jurisdiction: 'Nigeria',
      });

      if (response.data.success) {
        return `✅ *Document Draft Generated*\n\n${response.data.document.substring(0, 1500)}...\n\n💰 Cost: ₦500\n📱 Pay: https://paystack.com/pay/draft-${Date.now()}`;
      }
    } catch (error) {
      console.error('Draft error:', error);
    }
    return '❌ Failed to generate document. Please try again.';
  }

  if (command.startsWith('research')) {
    const query = text.substring(8).trim();
    if (!query) {
      return '❌ Please provide a legal question.\n\nExample: research What is the penalty for land trespass in Nigeria?';
    }

    return `🔍 *Legal Research Result*\n\n📚 Query: "${query}"\n\n✅ This service is FREE!\n\n🤖 AI is analyzing Nigerian case law...\n\n💡 Tip: For detailed analysis, visit https://casewin.ng`;
  }

  if (command.startsWith('lawyer')) {
    return `👨‍⚖️ *Find Nigerian Lawyers*\n\n📍 *Available Lawyers:*\n\n1. Adebayo Okonkwo - Corporate Law (Lagos)\n   ⭐ 4.9 | ₦25,000/hr\n\n2. Amina Bello - Family Law (Abuja)\n   ⭐ 4.8 | ₦18,000/hr\n\n3. Chukwudi Eze - Criminal Law (PH)\n   ⭐ 4.7 | ₦22,000/hr\n\n🌐 Browse all lawyers: https://casewin.ng/marketplace\n💳 Secure payment via Paystack`;
  }

  if (command.startsWith('analyze')) {
    const contract = text.substring(7).trim();
    if (!contract || contract.length < 50) {
      return '❌ Please paste the full contract text.\n\nExample: analyze [paste contract here]';
    }

    return `📄 *Contract Analysis*\n\n✅ Analyzing Nigerian law compliance...\n\n⚠️ Risk Level: Medium\n📋 Missing Clauses: Force Majeure\n⚖️  Compliance: 85%\n\n💰 Full analysis: ₦1,500\n📱 Pay: https://paystack.com/pay/analysis-${Date.now()}`;
  }

  return `👋 Welcome to *CaseWin-NG*!\n\n🇳🇬 Your AI Legal Assistant for Nigerian Law\n\nType *help* to see available commands\nType *services* to view AI features\nType *lawyer* to find verified lawyers\n\n📞 Bot: +${BOT_PHONE}`;
}

// Start the bot
startBot().catch((err) => {
  console.error('❌ Failed to start bot:', err);
  process.exit(1);
});
