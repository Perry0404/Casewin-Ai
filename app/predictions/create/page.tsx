'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const CATEGORIES = [
  { id: 'court_cases', name: 'Court Cases', icon: '⚖️', description: 'Pending judgments and appeals' },
  { id: 'legal_reform', name: 'Legal Reform', icon: '📜', description: 'Bills and legislative changes' },
  { id: 'supreme_court', name: 'Supreme Court', icon: '🏛️', description: 'Supreme Court decisions' },
  { id: 'elections', name: 'Elections', icon: '🗳️', description: 'Election outcomes and petitions' },
  { id: 'corporate', name: 'Corporate', icon: '🏢', description: 'Business disputes and mergers' },
  { id: 'criminal', name: 'Criminal', icon: '🚨', description: 'Criminal cases and convictions' },
  { id: 'international', name: 'International', icon: '🌍', description: 'International law matters' },
  { id: 'regulatory', name: 'Regulatory', icon: '📋', description: 'Regulatory decisions and policies' },
  { id: 'sports', name: 'Sports', icon: '⚽', description: 'Sports events and outcomes' },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', description: 'Entertainment industry events' },
];

const MARKET_TYPES = [
  { 
    id: 'binary', 
    name: 'Yes/No', 
    icon: '✅', 
    description: 'Simple binary outcome - Will something happen or not?' 
  },
  { 
    id: 'multiple_choice', 
    name: 'Multiple Choice', 
    icon: '🔢', 
    description: 'Multiple possible outcomes - Who will win? Which option?' 
  },
  { 
    id: 'scalar', 
    name: 'Numeric Range', 
    icon: '📊', 
    description: 'Predict a number within a range - How many? What percentage?' 
  },
];

export default function CreateMarketPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form state
  const [marketType, setMarketType] = useState('binary');
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [resolutionSource, setResolutionSource] = useState('');
  const [resolutionDate, setResolutionDate] = useState('');
  const [initialLiquidity, setInitialLiquidity] = useState(10000);
  const [choices, setChoices] = useState<string[]>(['', '']);
  const [scalarMin, setScalarMin] = useState(0);
  const [scalarMax, setScalarMax] = useState(100);
  const [scalarUnit, setScalarUnit] = useState('%');
  
  const addChoice = () => {
    if (choices.length < 10) {
      setChoices([...choices, '']);
    }
  };
  
  const updateChoice = (index: number, value: string) => {
    const newChoices = [...choices];
    newChoices[index] = value;
    setChoices(newChoices);
  };
  
  const removeChoice = (index: number) => {
    if (choices.length > 2) {
      setChoices(choices.filter((_, i) => i !== index));
    }
  };
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    router.push('/predictions');
  };
  
  const canProceed = () => {
    if (step === 1) return marketType !== '';
    if (step === 2) return category !== '';
    if (step === 3) return title.length >= 20 && description.length >= 50;
    if (step === 4) {
      if (marketType === 'multiple_choice') {
        return choices.filter(c => c.trim()).length >= 2;
      }
      if (marketType === 'scalar') {
        return scalarMin < scalarMax;
      }
      return true;
    }
    if (step === 5) return resolutionDate !== '' && resolutionSource.length >= 10;
    if (step === 6) return initialLiquidity >= 1000;
    return false;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700/50 backdrop-blur-xl bg-slate-900/80 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/predictions" className="flex items-center gap-3">
              <Image src="/favicon.png" alt="CaseWin AI" width={40} height={40} className="rounded-xl" />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  Create Market
                </h1>
                <p className="text-xs text-slate-400">Step {step} of 6</p>
              </div>
            </Link>
            
            <Link 
              href="/predictions" 
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </Link>
          </div>
        </div>
      </header>
      
      {/* Progress Bar */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5, 6].map(s => (
            <div 
              key={s} 
              className={`h-2 flex-1 rounded-full transition-all ${
                s <= step ? 'bg-purple-600' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>
      
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Step 1: Market Type */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Choose Market Type</h2>
              <p className="text-slate-400">What kind of prediction do you want to create?</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-4">
              {MARKET_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => setMarketType(type.id)}
                  className={`p-6 rounded-2xl border text-left transition-all ${
                    marketType === type.id
                      ? 'bg-purple-600/20 border-purple-500'
                      : 'bg-slate-800/60 border-slate-700/50 hover:border-slate-600'
                  }`}
                >
                  <div className="text-4xl mb-4">{type.icon}</div>
                  <h3 className="text-lg font-semibold text-white mb-2">{type.name}</h3>
                  <p className="text-sm text-slate-400">{type.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Step 2: Category */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Select Category</h2>
              <p className="text-slate-400">What area does your market relate to?</p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`p-4 rounded-xl border text-center transition-all ${
                    category === cat.id
                      ? 'bg-purple-600/20 border-purple-500'
                      : 'bg-slate-800/60 border-slate-700/50 hover:border-slate-600'
                  }`}
                >
                  <div className="text-3xl mb-2">{cat.icon}</div>
                  <h3 className="text-sm font-medium text-white">{cat.name}</h3>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Step 3: Title & Description */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Market Details</h2>
              <p className="text-slate-400">Write a clear, specific question</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Market Question <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Will [specific event] happen by [specific date]?"
                  className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20"
                />
                <p className="mt-2 text-xs text-slate-400">
                  {title.length}/200 characters (minimum 20)
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Provide context about the market, relevant background information, and clarify any edge cases..."
                  className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 resize-none"
                />
                <p className="mt-2 text-xs text-slate-400">
                  {description.length}/1000 characters (minimum 50)
                </p>
              </div>
              
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4">
                <h4 className="text-sm font-medium text-blue-400 mb-2">💡 Tips for a good market</h4>
                <ul className="text-sm text-slate-400 space-y-1">
                  <li>• Be specific about dates and conditions</li>
                  <li>• Avoid ambiguous language</li>
                  <li>• Define clear resolution criteria</li>
                  <li>• Consider edge cases in your description</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        {/* Step 4: Outcomes (for multiple choice/scalar) */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">
                {marketType === 'binary' ? 'Confirm Outcomes' : 
                 marketType === 'multiple_choice' ? 'Add Choices' : 
                 'Set Range'}
              </h2>
              <p className="text-slate-400">
                {marketType === 'binary' ? 'Binary markets have YES and NO outcomes' :
                 marketType === 'multiple_choice' ? 'Add all possible outcomes (2-10 choices)' :
                 'Set the minimum and maximum values for the prediction'}
              </p>
            </div>
            
            {marketType === 'binary' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-6 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                  <div className="text-4xl mb-2">✅</div>
                  <h3 className="text-lg font-semibold text-emerald-400">YES</h3>
                  <p className="text-sm text-slate-400">The event will happen</p>
                </div>
                <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
                  <div className="text-4xl mb-2">❌</div>
                  <h3 className="text-lg font-semibold text-red-400">NO</h3>
                  <p className="text-sm text-slate-400">The event will not happen</p>
                </div>
              </div>
            )}
            
            {marketType === 'multiple_choice' && (
              <div className="space-y-4">
                {choices.map((choice, index) => (
                  <div key={index} className="flex gap-3">
                    <input
                      type="text"
                      value={choice}
                      onChange={(e) => updateChoice(index, e.target.value)}
                      placeholder={`Choice ${index + 1}`}
                      className="flex-1 px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500/50"
                    />
                    {choices.length > 2 && (
                      <button
                        onClick={() => removeChoice(index)}
                        className="px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl text-red-400"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                
                {choices.length < 10 && (
                  <button
                    onClick={addChoice}
                    className="w-full px-4 py-3 bg-slate-800/60 hover:bg-slate-700/60 border border-dashed border-slate-600 rounded-xl text-slate-400 hover:text-white transition-all"
                  >
                    + Add Choice
                  </button>
                )}
              </div>
            )}
            
            {marketType === 'scalar' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Minimum Value</label>
                    <input
                      type="number"
                      value={scalarMin}
                      onChange={(e) => setScalarMin(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">Maximum Value</label>
                    <input
                      type="number"
                      value={scalarMax}
                      onChange={(e) => setScalarMax(Number(e.target.value))}
                      className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Unit</label>
                  <input
                    type="text"
                    value={scalarUnit}
                    onChange={(e) => setScalarUnit(e.target.value)}
                    placeholder="%, ₦, years, etc."
                    className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500/50"
                  />
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Step 5: Resolution */}
        {step === 5 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Resolution Details</h2>
              <p className="text-slate-400">When and how will this market be resolved?</p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Resolution Date <span className="text-red-400">*</span>
                </label>
                <input
                  type="date"
                  value={resolutionDate}
                  onChange={(e) => setResolutionDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-purple-500/50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Resolution Source <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={resolutionSource}
                  onChange={(e) => setResolutionSource(e.target.value)}
                  rows={3}
                  placeholder="Describe the official source that will be used to determine the outcome (e.g., 'Official Supreme Court ruling published on supremecourt.gov.ng')"
                  className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-purple-500/50 resize-none"
                />
              </div>
              
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                <h4 className="text-sm font-medium text-yellow-400 mb-2">⚠️ Important</h4>
                <p className="text-sm text-slate-400">
                  Markets are resolved based on the source you specify. Make sure it&apos;s an official, 
                  publicly verifiable source. Disputed resolutions may be reviewed by our team.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Step 6: Liquidity */}
        {step === 6 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2">Initial Liquidity</h2>
              <p className="text-slate-400">Provide liquidity to enable trading</p>
            </div>
            
            <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50">
              <label className="block text-sm font-medium text-slate-300 mb-4">
                Liquidity Amount (₦)
              </label>
              
              <div className="space-y-4">
                <input
                  type="range"
                  min="1000"
                  max="100000"
                  step="1000"
                  value={initialLiquidity}
                  onChange={(e) => setInitialLiquidity(Number(e.target.value))}
                  className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer"
                />
                
                <div className="flex justify-between text-sm text-slate-400">
                  <span>₦1,000</span>
                  <span className="text-2xl font-bold text-purple-400">₦{initialLiquidity.toLocaleString()}</span>
                  <span>₦100,000</span>
                </div>
                
                <div className="grid grid-cols-4 gap-2 mt-4">
                  {[5000, 10000, 25000, 50000].map(amount => (
                    <button
                      key={amount}
                      onClick={() => setInitialLiquidity(amount)}
                      className={`py-2 rounded-lg text-sm font-medium transition-all ${
                        initialLiquidity === amount
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      ₦{(amount / 1000)}K
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700/50">
              <h4 className="text-lg font-semibold text-white mb-4">Market Summary</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Type:</span>
                  <span className="text-white capitalize">{marketType.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Category:</span>
                  <span className="text-white">{CATEGORIES.find(c => c.id === category)?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Resolution Date:</span>
                  <span className="text-white">{resolutionDate || 'Not set'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Initial Liquidity:</span>
                  <span className="text-white">₦{initialLiquidity.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Creator Fee (2%):</span>
                  <span className="text-emerald-400">You earn from every trade</span>
                </div>
              </div>
            </div>
            
            <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
              <h4 className="text-sm font-medium text-purple-400 mb-2">💰 Earn Fees</h4>
              <p className="text-sm text-slate-400">
                As the market creator, you&apos;ll earn 2% of all trading fees. Higher liquidity 
                attracts more traders and generates more fees!
              </p>
            </div>
          </div>
        )}
        
        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-slate-700/50">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className={`px-6 py-3 rounded-xl font-medium transition-all ${
              step === 1 
                ? 'bg-slate-800/40 text-slate-600 cursor-not-allowed' 
                : 'bg-slate-800/60 text-white hover:bg-slate-700/60'
            }`}
          >
            ← Back
          </button>
          
          {step < 6 ? (
            <button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className={`px-8 py-3 rounded-xl font-medium transition-all ${
                canProceed()
                  ? 'bg-purple-600 hover:bg-purple-500 text-white'
                  : 'bg-slate-800/40 text-slate-600 cursor-not-allowed'
              }`}
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed() || isSubmitting}
              className={`px-8 py-3 rounded-xl font-semibold transition-all ${
                canProceed() && !isSubmitting
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white'
                  : 'bg-slate-800/40 text-slate-600 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Creating...
                </span>
              ) : (
                '🚀 Create Market'
              )}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
