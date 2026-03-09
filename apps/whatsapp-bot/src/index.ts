import makeWASocket, { DisconnectReason, useMultiFileAuthState } from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
const qrcode = require('qrcode-terminal');
import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const BOT_PHONE = process.env.BOT_PHONE_NUMBER || '2348067117651';

// ============================================================
// USER SESSION MANAGEMENT
// ============================================================
interface UserSession {
  phone: string;
  userId?: string;
  balance: number;
  state: 'idle' | 'browsing_markets' | 'placing_bet' | 'confirming_bet' | 'asking_oracle';
  currentCategory?: string;
  currentMarkets?: any[];
  selectedMarket?: any;
  selectedOutcome?: 'yes' | 'no';
  selectedShares?: number;
  lastActivity: number;
}

const sessions: Map<string, UserSession> = new Map();

function getSession(phone: string): UserSession {
  let session = sessions.get(phone);
  if (!session) {
    session = {
      phone,
      balance: 50000,
      state: 'idle',
      lastActivity: Date.now(),
    };
    sessions.set(phone, session);
  }
  session.lastActivity = Date.now();
  return session;
}

// Clean stale sessions every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [phone, session] of sessions) {
    if (now - session.lastActivity > 30 * 60 * 1000) {
      sessions.delete(phone);
    }
  }
}, 30 * 60 * 1000);

// ============================================================
// CATEGORY CONFIG
// ============================================================
const CATEGORIES: Record<string, { name: string; icon: string }> = {
  all: { name: 'All Markets', icon: '🌐' },
  court_cases: { name: 'Court Cases', icon: '⚖️' },
  legal_reform: { name: 'Legal Reform', icon: '📜' },
  supreme_court: { name: 'Supreme Court', icon: '🏛️' },
  elections: { name: 'Elections', icon: '🗳️' },
  corporate: { name: 'Corporate', icon: '🏢' },
  criminal: { name: 'Criminal', icon: '🚨' },
  regulatory: { name: 'Regulatory', icon: '📋' },
  crypto: { name: 'Crypto', icon: '₿' },
  technology: { name: 'Technology', icon: '💻' },
  world_politics: { name: 'World Politics', icon: '🌍' },
  sports: { name: 'Sports', icon: '⚽' },
  entertainment: { name: 'Entertainment', icon: '🎬' },
};

// ============================================================
// API HELPERS
// ============================================================
async function fetchMarkets(category?: string): Promise<any[]> {
  try {
    const params = category && category !== 'all' ? `?category=${category}` : '';
    const res = await axios.get(`${API_BASE_URL}/api/predictions${params}`);
    return res.data.markets || [];
  } catch (err) {
    console.error('Failed to fetch markets:', err);
    return [];
  }
}

async function fetchOracleAnalysis(marketId: string): Promise<any> {
  try {
    const res = await axios.get(`${API_BASE_URL}/api/predictions/oracle?marketId=${marketId}`);
    return res.data.analyses?.[0] || null;
  } catch (err) {
    console.error('Oracle fetch failed:', err);
    return null;
  }
}

async function askOracle(marketId: string, question: string): Promise<string> {
  try {
    const res = await axios.post(`${API_BASE_URL}/api/predictions/oracle`, {
      marketId,
      question,
    });
    return res.data.answer || 'Oracle could not answer right now.';
  } catch (err) {
    return 'Oracle is temporarily unavailable.';
  }
}

// ============================================================
// MESSAGE FORMATTING
// ============================================================
function formatMarketList(markets: any[], startIndex: number = 1): string {
  if (markets.length === 0) return '📭 No markets found in this category.';

  return markets.map((m, i) => {
    const yesOdds = Math.round((m.yes_price || 0.5) * 100);
    const noOdds = Math.round((m.no_price || 0.5) * 100);
    const pool = m.total_pool >= 1000 ? `₦${(m.total_pool / 1000).toFixed(0)}K` : `₦${m.total_pool || 0}`;
    const cat = CATEGORIES[m.category]?.icon || '📊';
    return `*${startIndex + i}.* ${cat} ${m.title}\n   ✅ YES: ${yesOdds}¢  |  ❌ NO: ${noOdds}¢  |  💰 ${pool}`;
  }).join('\n\n');
}

function formatMarketDetails(market: any): string {
  const yesOdds = Math.round((market.yes_price || 0.5) * 100);
  const noOdds = Math.round((market.no_price || 0.5) * 100);
  const pool = market.total_pool >= 1000 ? `₦${(market.total_pool / 1000).toFixed(0)}K` : `₦${market.total_pool || 0}`;
  const deadline = market.deadline ? new Date(market.deadline).toLocaleDateString('en-NG', { 
    month: 'short', day: 'numeric', year: 'numeric' 
  }) : 'TBD';

  return `📊 *${market.title}*

${market.description || ''}

${CATEGORIES[market.category]?.icon || '📊'} Category: *${CATEGORIES[market.category]?.name || market.category}*
📅 Closes: ${deadline}
💰 Pool: ${pool}

┌─────────────────┐
│  ✅ YES: *${yesOdds}¢*  │  ❌ NO: *${noOdds}¢*  │
└─────────────────┘

*How to bet:*
• Type *yes [amount]* — e.g. _yes 100_
• Type *no [amount]* — e.g. _no 200_
• Type *oracle* — Get AI analysis
• Type *back* — Return to markets`;
}

function formatBetConfirmation(market: any, outcome: string, shares: number, price: number): string {
  const cost = (shares * price).toFixed(2);
  const potentialWin = (shares * (1 - price)).toFixed(2);
  
  return `🎯 *Confirm Your Bet*

📊 Market: ${market.title}
🎲 Position: *${outcome.toUpperCase()}*
📈 Shares: *${shares}*
💰 Cost: *₦${cost}*
🏆 Potential Profit: *₦${potentialWin}*

Type *confirm* to place bet
Type *cancel* to cancel`;
}

// ============================================================
// COMMAND HANDLER — THE AI AGENT
// ============================================================
async function handleMessage(text: string, sender: string): Promise<string> {
  const session = getSession(sender);
  const command = text.toLowerCase().trim();

  // ---- GLOBAL COMMANDS (work in any state) ----
  if (command === 'help' || command === 'menu' || command === 'start') {
    session.state = 'idle';
    return `🎯 *CaseWin Predictions Bot*
🧠 AI Oracle Powered by Grok 4

📊 *PREDICTION MARKETS:*
• *markets* — Browse all open markets
• *sports* — Sports predictions
• *crypto* — Crypto predictions
• *tech* — Technology predictions
• *politics* — World politics
• *legal* — Legal/court cases
• *elections* — Election predictions

💼 *ACCOUNT:*
• *balance* — Check your wallet
• *portfolio* — Your active bets
• *deposit [amount]* — Fund wallet

🤖 *AI ORACLE:*
• *oracle* — AI analysis of selected market
• *ask [question]* — Ask about any market

📝 *LEGAL TOOLS:*
• *draft [details]* — Draft documents
• *research [query]* — Legal research
• *lawyer* — Find lawyers

💡 Type a category name to start!`;
  }

  if (command === 'balance') {
    return `💰 *Your Wallet*\n\n💳 Balance: *₦${session.balance.toLocaleString()}*\n\nType *deposit [amount]* to add funds\nType *markets* to start betting`;
  }

  if (command.startsWith('deposit')) {
    const amount = parseInt(command.replace('deposit', '').trim()) || 0;
    if (amount < 100) return '❌ Minimum deposit is ₦100. \n\nExample: *deposit 5000*';
    session.balance += amount;
    return `✅ *Deposit Successful!*\n\n💳 Added: ₦${amount.toLocaleString()}\n💰 New Balance: *₦${session.balance.toLocaleString()}*`;
  }

  if (command === 'portfolio') {
    return `📂 *Your Portfolio*\n\n📭 No active positions yet.\n\n💡 Start by typing *markets* to browse and place your first bet!`;
  }

  if (command === 'cancel' || command === 'back') {
    if (session.state === 'confirming_bet') {
      session.state = session.selectedMarket ? 'placing_bet' : 'idle';
      return '❌ Bet cancelled.\n\nType *back* to browse markets or pick a new bet.';
    }
    if (session.state === 'placing_bet') {
      session.state = 'browsing_markets';
      if (session.currentMarkets && session.currentMarkets.length > 0) {
        return `📊 *Markets — ${CATEGORIES[session.currentCategory || 'all']?.name || 'All'}*\n\n${formatMarketList(session.currentMarkets)}\n\n📌 Reply with a *number* to select a market`;
      }
    }
    session.state = 'idle';
    return '🏠 Back to main menu. Type *help* for options.';
  }

  // ---- CATEGORY SHORTCUTS ----
  const categoryMap: Record<string, string> = {
    markets: 'all', all: 'all',
    sports: 'sports', sport: 'sports', football: 'sports',
    crypto: 'crypto', bitcoin: 'crypto', btc: 'crypto',
    tech: 'technology', technology: 'technology', ai: 'technology',
    politics: 'world_politics', 'world politics': 'world_politics',
    legal: 'court_cases', court: 'court_cases', cases: 'court_cases',
    elections: 'elections', election: 'elections', vote: 'elections',
    corporate: 'corporate', business: 'corporate',
    criminal: 'criminal', crime: 'criminal',
    entertainment: 'entertainment', movies: 'entertainment',
    regulatory: 'regulatory', regulation: 'regulatory',
    reform: 'legal_reform', 'legal reform': 'legal_reform',
    'supreme court': 'supreme_court', supreme: 'supreme_court',
  };

  const matchedCategory = categoryMap[command];
  if (matchedCategory) {
    session.state = 'browsing_markets';
    session.currentCategory = matchedCategory;

    const markets = await fetchMarkets(matchedCategory);
    session.currentMarkets = markets.slice(0, 10); // limit to 10

    if (markets.length === 0) {
      session.state = 'idle';
      return `📭 No open markets in *${CATEGORIES[matchedCategory]?.name || matchedCategory}*.\n\nTry another category or type *markets* for all.`;
    }

    return `${CATEGORIES[matchedCategory]?.icon || '📊'} *${CATEGORIES[matchedCategory]?.name || 'Markets'}*\n\n${formatMarketList(session.currentMarkets)}\n\n📌 Reply with a *number* (1-${session.currentMarkets.length}) to view & bet\n🔮 Or type *oracle [number]* for AI analysis`;
  }

  // ---- BROWSING STATE: Select a market by number ----
  if (session.state === 'browsing_markets' && session.currentMarkets) {
    // Oracle shortcut: "oracle 3"
    if (command.startsWith('oracle')) {
      const num = parseInt(command.replace('oracle', '').trim());
      if (num >= 1 && num <= session.currentMarkets.length) {
        const market = session.currentMarkets[num - 1];
        session.selectedMarket = market;
        session.state = 'asking_oracle';
        
        const analysis = await fetchOracleAnalysis(market.id);
        if (analysis) {
          const riskEmoji = analysis.risk_level === 'low' ? '🟢' : analysis.risk_level === 'high' ? '🔴' : '🟡';
          return `🧠 *AI Oracle Analysis*
          
📊 ${market.title}

🎯 AI Probability: *${Math.round(analysis.ai_probability * 100)}% YES*
📈 Confidence: *${Math.round(analysis.ai_confidence * 100)}%*
${riskEmoji} Risk: *${analysis.risk_level.toUpperCase()}*

💡 ${analysis.reasoning}

🔑 *Key Factors:*
${analysis.key_factors.map((f: string) => `• ${f}`).join('\n')}

📋 *Recommendation:*
${analysis.recommendation}

Type *yes [amount]* or *no [amount]* to bet
Type *ask [question]* for more insight
Type *back* to return`;
        }
        session.state = 'placing_bet';
        return `${formatMarketDetails(market)}\n\n🧠 _Oracle analysis unavailable right now_`;
      }
    }

    const num = parseInt(command);
    if (num >= 1 && num <= session.currentMarkets.length) {
      const market = session.currentMarkets[num - 1];
      session.selectedMarket = market;
      session.state = 'placing_bet';
      return formatMarketDetails(market);
    }

    return `📌 Please reply with a number between *1* and *${session.currentMarkets.length}*\n\nOr type:\n• *oracle [number]* for AI analysis\n• *back* to return to menu`;
  }

  // ---- PLACING BET STATE ----
  if (session.state === 'placing_bet' && session.selectedMarket) {
    const market = session.selectedMarket;

    // Oracle on current market
    if (command === 'oracle') {
      const analysis = await fetchOracleAnalysis(market.id);
      if (analysis) {
        const riskEmoji = analysis.risk_level === 'low' ? '🟢' : analysis.risk_level === 'high' ? '🔴' : '🟡';
        return `🧠 *AI Oracle on:*\n${market.title}\n\n🎯 Probability: *${Math.round(analysis.ai_probability * 100)}% YES*\n📈 Confidence: *${Math.round(analysis.ai_confidence * 100)}%*\n${riskEmoji} Risk: *${analysis.risk_level.toUpperCase()}*\n\n💡 ${analysis.reasoning}\n\n📋 ${analysis.recommendation}\n\nType *yes [amount]* or *no [amount]* to bet`;
      }
      return '🧠 Oracle is thinking... Please try again in a moment.';
    }

    // Ask oracle a question
    if (command.startsWith('ask ')) {
      const question = text.substring(4).trim();
      const answer = await askOracle(market.id, question);
      return `🧠 *Oracle says:*\n\n${answer}\n\nType *yes [amount]* or *no [amount]* to bet`;
    }

    // YES/NO bet placement
    if (command.startsWith('yes') || command.startsWith('no')) {
      const outcome = command.startsWith('yes') ? 'yes' : 'no';
      const sharesStr = command.replace(outcome, '').trim();
      const shares = parseInt(sharesStr) || 50;

      if (shares < 10) return '❌ Minimum bet is 10 shares.\n\nExample: *yes 100*';
      if (shares > 5000) return '❌ Maximum bet is 5,000 shares.\n\nExample: *yes 1000*';

      const price = outcome === 'yes' ? market.yes_price : market.no_price;
      const cost = shares * price;

      if (cost > session.balance) {
        return `❌ *Insufficient Balance*\n\n💰 Cost: ₦${cost.toFixed(2)}\n💳 Your Balance: ₦${session.balance.toLocaleString()}\n\nType *deposit ${Math.ceil(cost - session.balance + 1000)}* to add funds`;
      }

      session.selectedOutcome = outcome;
      session.selectedShares = shares;
      session.state = 'confirming_bet';

      return formatBetConfirmation(market, outcome, shares, price);
    }

    return `📊 *${market.title}*\n\nType:\n• *yes [amount]* — bet YES (e.g. _yes 100_)\n• *no [amount]* — bet NO (e.g. _no 200_)\n• *oracle* — AI analysis\n• *ask [question]* — ask the oracle\n• *back* — return to markets`;
  }

  // ---- CONFIRMING BET STATE ----
  if (session.state === 'confirming_bet' && session.selectedMarket && session.selectedOutcome && session.selectedShares) {
    if (command === 'confirm' || command === 'yes' || command === 'y') {
      const market = session.selectedMarket;
      const outcome = session.selectedOutcome;
      const shares = session.selectedShares;
      const price = outcome === 'yes' ? market.yes_price : market.no_price;
      const cost = shares * price;

      if (cost > session.balance) {
        session.state = 'placing_bet';
        return `❌ Insufficient balance. You need ₦${cost.toFixed(2)} but have ₦${session.balance.toLocaleString()}.\n\nType *deposit ${Math.ceil(cost)}* to add funds.`;
      }

      // Execute trade via API
      try {
        const res = await axios.post(`${API_BASE_URL}/api/predictions/trade`, {
          marketId: market.id,
          action: 'buy',
          outcome,
          shares,
        });

        if (res.data.error) {
          session.state = 'placing_bet';
          return `❌ Trade failed: ${res.data.error}\n\nType *yes [amount]* or *no [amount]* to try again.`;
        }

        // Deduct from local balance
        session.balance -= cost;
        const potentialWin = shares * (1 - price);

        session.state = 'idle';
        session.selectedMarket = null;
        session.selectedOutcome = undefined;
        session.selectedShares = undefined;

        return `✅ *Bet Placed Successfully!*

📊 ${market.title}
🎲 Position: *${outcome.toUpperCase()}*
📈 Shares: *${shares}*
💰 Cost: *₦${cost.toFixed(2)}*
🏆 Potential Profit: *₦${potentialWin.toFixed(2)}*

💳 Remaining Balance: *₦${session.balance.toLocaleString()}*

Type *markets* to bet on more
Type *portfolio* to view your bets`;
      } catch (err: any) {
        session.state = 'placing_bet';
        const errMsg = err?.response?.data?.error || 'Network error';
        return `❌ Trade failed: ${errMsg}\n\nTry again or type *back* to browse markets.`;
      }
    }

    if (command === 'no' || command === 'n' || command === 'cancel') {
      session.state = 'placing_bet';
      return '❌ Bet cancelled.\n\nType *yes [amount]* or *no [amount]* to place a new bet.';
    }

    return 'Type *confirm* to place the bet or *cancel* to go back.';
  }

  // ---- ASKING ORACLE STATE ----
  if (session.state === 'asking_oracle' && session.selectedMarket) {
    if (command.startsWith('ask ')) {
      const question = text.substring(4).trim();
      const answer = await askOracle(session.selectedMarket.id, question);
      return `🧠 *Oracle:*\n\n${answer}\n\nType *yes [amount]* or *no [amount]* to bet\nType *back* to return`;
    }
    // Fall through to placing_bet if they type yes/no
    session.state = 'placing_bet';
    return await handleMessage(text, sender);
  }

  // ---- LEGACY LEGAL COMMANDS ----
  if (command.startsWith('draft')) {
    const details = text.substring(5).trim();
    if (!details) {
      return '❌ Please provide document details.\n\nExample: *draft Land Sale Agreement between John Doe and Jane Smith*';
    }
    try {
      const response = await axios.post(`${API_BASE_URL}/api/draft`, {
        documentType: 'Contract',
        parties: details,
        jurisdiction: 'Nigeria',
      });
      if (response.data.success) {
        return `✅ *Document Draft Generated*\n\n${response.data.document.substring(0, 1500)}...\n\n💰 Cost: ₦500`;
      }
    } catch (error) {
      console.error('Draft error:', error);
    }
    return '❌ Failed to generate document. Please try again.';
  }

  if (command.startsWith('research')) {
    const query = text.substring(8).trim();
    if (!query) {
      return '❌ Please provide a legal question.\n\nExample: *research What is the penalty for land trespass in Nigeria?*';
    }
    try {
      const response = await axios.post(`${API_BASE_URL}/api/research`, { query });
      if (response.data.result) {
        return `🔍 *Legal Research*\n\n${response.data.result.substring(0, 2000)}`;
      }
    } catch (err) {
      console.error('Research error:', err);
    }
    return `🔍 *Legal Research*\n\n📚 Query: "${query}"\n\n✅ Visit https://casewin.ng for full AI-powered research.`;
  }

  if (command === 'lawyer' || command === 'lawyers') {
    return `👨‍⚖️ *Find Nigerian Lawyers*\n\n📍 *Browse verified lawyers at:*\n🌐 https://casewin.ng/marketplace\n\n💡 Coming soon: Book lawyers directly on WhatsApp!`;
  }

  // ---- DEFAULT: Unrecognized message ----
  return `👋 Welcome to *CaseWin Predictions*!\n\n🎯 Bet on outcomes with AI oracle insights\n🧠 Powered by Grok 4\n\nQuick start:\n• *markets* — Browse all markets\n• *sports* — Sports predictions\n• *crypto* — Crypto markets\n• *tech* — Tech predictions\n• *help* — Full menu\n\n📞 Bot: +${BOT_PHONE}`;
}

// ============================================================
// WHATSAPP CONNECTION
// ============================================================
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
      console.log('✅ WhatsApp Prediction Bot connected!');
      console.log(`📞 Bot Number: +${BOT_PHONE}`);
      console.log('🎯 Prediction markets ready');
      console.log('🧠 AI Oracle powered by Grok 4');
      console.log('🤖 Waiting for messages...\n');
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const sender = msg.key.remoteJid!;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text || '';

    if (!text.trim()) return;

    console.log(`📨 [${new Date().toLocaleTimeString()}] ${sender}: ${text}`);

    try {
      const response = await handleMessage(text, sender);
      await sock.sendMessage(sender, { text: response });
    } catch (error) {
      console.error('Error handling message:', error);
      await sock.sendMessage(sender, {
        text: '❌ Something went wrong. Type *help* to see available commands.',
      });
    }
  });
}

// Start the bot
startBot().catch((err) => {
  console.error('❌ Failed to start bot:', err);
  process.exit(1);
});
