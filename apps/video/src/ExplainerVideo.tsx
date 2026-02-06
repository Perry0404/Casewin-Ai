import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
  Sequence,
} from 'remotion';

const TitleScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const scale = spring({
    frame,
    fps,
    config: { damping: 100, stiffness: 200 },
  });
  
  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 100 }}>📈</div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 'bold',
            color: '#ffffff',
            marginTop: 30,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          How Prediction Markets Work
        </div>
        <div
          style={{
            fontSize: 36,
            color: '#22c55e',
            marginTop: 20,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          CaseWin AI
        </div>
      </div>
    </AbsoluteFill>
  );
};

const WhatIsScene: React.FC = () => {
  const frame = useCurrentFrame();
  
  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });
  
  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 100,
      }}
    >
      <div style={{ opacity, maxWidth: 1400 }}>
        <div
          style={{
            fontSize: 64,
            fontWeight: 'bold',
            color: '#22c55e',
            marginBottom: 40,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          What are Prediction Markets?
        </div>
        <div
          style={{
            fontSize: 40,
            color: '#e2e8f0',
            lineHeight: 1.6,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Prediction markets let you <span style={{ color: '#fbbf24', fontWeight: 'bold' }}>bet on the outcomes</span> of 
          real Nigerian Supreme Court cases using your legal knowledge and intuition.
        </div>
        <div
          style={{
            fontSize: 32,
            color: '#94a3b8',
            marginTop: 40,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          ✓ Real cases &nbsp;&nbsp; ✓ Real outcomes &nbsp;&nbsp; ✓ Real rewards
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Step1Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const slideIn = spring({
    frame,
    fps,
    config: { damping: 80, stiffness: 150 },
  });
  
  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #0f172a 100%)',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 100,
      }}
    >
      <div
        style={{
          flex: 1,
          transform: `translateX(${interpolate(slideIn, [0, 1], [-50, 0])}px)`,
          opacity: slideIn,
        }}
      >
        <div
          style={{
            fontSize: 120,
            fontWeight: 'bold',
            color: '#22c55e',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Step 1
        </div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 'bold',
            color: '#ffffff',
            marginTop: 20,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Browse Active Cases
        </div>
        <div
          style={{
            fontSize: 32,
            color: '#94a3b8',
            marginTop: 30,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Explore pending Supreme Court cases
          <br />
          with detailed case summaries
        </div>
      </div>
      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 24,
            padding: 40,
            border: '2px solid #22c55e',
            transform: `scale(${slideIn})`,
          }}
        >
          <div style={{ fontSize: 48, marginBottom: 20 }}>⚖️</div>
          <div
            style={{
              fontSize: 28,
              color: '#ffffff',
              fontWeight: 600,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            PDP vs APC (Kogi)
          </div>
          <div
            style={{
              fontSize: 24,
              color: '#94a3b8',
              marginTop: 10,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Pool: ₦2,450,000
          </div>
          <div
            style={{
              display: 'flex',
              gap: 20,
              marginTop: 20,
            }}
          >
            <div
              style={{
                background: '#22c55e',
                color: '#ffffff',
                padding: '10px 30px',
                borderRadius: 10,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              For: 65%
            </div>
            <div
              style={{
                background: '#ef4444',
                color: '#ffffff',
                padding: '10px 30px',
                borderRadius: 10,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Against: 35%
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Step2Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const scale = spring({
    frame,
    fps,
    config: { damping: 80, stiffness: 150 },
  });
  
  const moneyMove = interpolate(frame, [30, 60], [100, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  
  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 100,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontSize: 120,
            fontWeight: 'bold',
            color: '#3b82f6',
            fontFamily: 'Inter, sans-serif',
            transform: `scale(${scale})`,
          }}
        >
          Step 2
        </div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 'bold',
            color: '#ffffff',
            marginTop: 20,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Place Your Bet
        </div>
        <div
          style={{
            marginTop: 60,
            display: 'flex',
            justifyContent: 'center',
            gap: 40,
          }}
        >
          <div
            style={{
              background: 'rgba(34, 197, 94, 0.2)',
              border: '3px solid #22c55e',
              borderRadius: 20,
              padding: '40px 60px',
              transform: `translateY(${moneyMove}px)`,
              opacity: interpolate(frame, [30, 60], [0, 1]),
            }}
          >
            <div style={{ fontSize: 64 }}>✅</div>
            <div
              style={{
                fontSize: 32,
                color: '#22c55e',
                fontWeight: 'bold',
                marginTop: 20,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Bet FOR
            </div>
            <div
              style={{
                fontSize: 24,
                color: '#94a3b8',
                marginTop: 10,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Case will succeed
            </div>
          </div>
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.2)',
              border: '3px solid #ef4444',
              borderRadius: 20,
              padding: '40px 60px',
              transform: `translateY(${moneyMove}px)`,
              opacity: interpolate(frame, [30, 60], [0, 1]),
            }}
          >
            <div style={{ fontSize: 64 }}>❌</div>
            <div
              style={{
                fontSize: 32,
                color: '#ef4444',
                fontWeight: 'bold',
                marginTop: 20,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Bet AGAINST
            </div>
            <div
              style={{
                fontSize: 24,
                color: '#94a3b8',
                marginTop: 10,
                fontFamily: 'Inter, sans-serif',
              }}
            >
              Case will fail
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const Step3Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const celebrateScale = spring({
    frame: Math.max(0, frame - 40),
    fps,
    config: { damping: 50, stiffness: 200 },
  });
  
  const winAmount = Math.floor(interpolate(frame, [40, 90], [0, 175000], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  }));
  
  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #4c1d95 0%, #0f172a 100%)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 100,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontSize: 120,
            fontWeight: 'bold',
            color: '#a855f7',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Step 3
        </div>
        <div
          style={{
            fontSize: 56,
            fontWeight: 'bold',
            color: '#ffffff',
            marginTop: 20,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Win When Judgment Is Given
        </div>
        <div
          style={{
            marginTop: 60,
            transform: `scale(${celebrateScale})`,
          }}
        >
          <div style={{ fontSize: 100 }}>🎉</div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 'bold',
              color: '#22c55e',
              marginTop: 20,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            +₦{winAmount.toLocaleString()}
          </div>
          <div
            style={{
              fontSize: 28,
              color: '#94a3b8',
              marginTop: 20,
              fontFamily: 'Inter, sans-serif',
            }}
          >
            Your winnings are automatically credited!
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const StartNowScene: React.FC = () => {
  const frame = useCurrentFrame();
  
  const pulse = Math.sin(frame / 8) * 8 + 100;
  
  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontSize: 72,
            fontWeight: 'bold',
            color: '#ffffff',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Start Predicting Today!
        </div>
        <div
          style={{
            marginTop: 50,
            background: '#ffffff',
            color: '#16a34a',
            fontSize: 48,
            fontWeight: 'bold',
            padding: '30px 80px',
            borderRadius: 20,
            display: 'inline-block',
            transform: `scale(${pulse / 100})`,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          casewinai.com/predictions
        </div>
        <div
          style={{
            fontSize: 32,
            color: '#dcfce7',
            marginTop: 40,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          5 Active Markets • ₦8.1M+ Pool
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const ExplainerVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      {/* Title - 0 to 10 seconds */}
      <Sequence from={0} durationInFrames={10 * 30}>
        <TitleScene />
      </Sequence>
      
      {/* What Is - 10 to 25 seconds */}
      <Sequence from={10 * 30} durationInFrames={15 * 30}>
        <WhatIsScene />
      </Sequence>
      
      {/* Step 1 - 25 to 40 seconds */}
      <Sequence from={25 * 30} durationInFrames={15 * 30}>
        <Step1Scene />
      </Sequence>
      
      {/* Step 2 - 40 to 55 seconds */}
      <Sequence from={40 * 30} durationInFrames={15 * 30}>
        <Step2Scene />
      </Sequence>
      
      {/* Step 3 - 55 to 75 seconds */}
      <Sequence from={55 * 30} durationInFrames={20 * 30}>
        <Step3Scene />
      </Sequence>
      
      {/* Start Now - 75 to 90 seconds */}
      <Sequence from={75 * 30} durationInFrames={15 * 30}>
        <StartNowScene />
      </Sequence>
    </AbsoluteFill>
  );
};
