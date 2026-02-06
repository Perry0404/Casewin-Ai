import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
  Sequence,
} from 'remotion';

// Scene Components
const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const scale = spring({
    frame,
    fps,
    config: { damping: 100, stiffness: 200 },
  });
  
  const opacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: 'clamp',
  });
  
  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          opacity,
          textAlign: 'center',
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
          ⚖️ CaseWin AI
        </div>
        <div
          style={{
            fontSize: 48,
            color: '#ffffff',
            marginTop: 20,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Nigeria's Premier Legal AI Platform
        </div>
      </div>
    </AbsoluteFill>
  );
};

const AIToolsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const tools = [
    { name: 'Case Prediction', icon: '🎯', color: '#22c55e' },
    { name: 'Legal Drafting', icon: '📝', color: '#3b82f6' },
    { name: 'Research Assistant', icon: '🔍', color: '#f59e0b' },
    { name: 'Document Analysis', icon: '📊', color: '#8b5cf6' },
  ];
  
  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #0f3460 0%, #1a1a2e 100%)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 80,
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 60 }}>
        <div
          style={{
            fontSize: 72,
            fontWeight: 'bold',
            color: '#ffffff',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          8 Powerful AI Tools
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          gap: 40,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {tools.map((tool, index) => {
          const delay = index * 8;
          const opacity = interpolate(frame - delay, [0, 15], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          const translateY = interpolate(frame - delay, [0, 15], [50, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          
          return (
            <div
              key={tool.name}
              style={{
                opacity,
                transform: `translateY(${translateY}px)`,
                background: 'rgba(255,255,255,0.1)',
                borderRadius: 24,
                padding: 40,
                width: 350,
                textAlign: 'center',
                border: `3px solid ${tool.color}`,
              }}
            >
              <div style={{ fontSize: 80 }}>{tool.icon}</div>
              <div
                style={{
                  fontSize: 32,
                  color: '#ffffff',
                  marginTop: 20,
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 600,
                }}
              >
                {tool.name}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const PredictionMarketsScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const slideIn = spring({
    frame,
    fps,
    config: { damping: 80, stiffness: 150 },
  });
  
  const poolAmount = Math.floor(interpolate(frame, [0, 60], [0, 8100000], {
    extrapolateRight: 'clamp',
  }));
  
  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #064e3b 0%, #0f3460 100%)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 80,
      }}
    >
      <div
        style={{
          transform: `translateX(${interpolate(slideIn, [0, 1], [-100, 0])}%)`,
          opacity: slideIn,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 'bold',
            color: '#22c55e',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          📈 Prediction Markets
        </div>
        <div
          style={{
            fontSize: 36,
            color: '#ffffff',
            marginTop: 30,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Bet on Nigerian Supreme Court Cases
        </div>
        <div
          style={{
            fontSize: 96,
            fontWeight: 'bold',
            color: '#fbbf24',
            marginTop: 60,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          ₦{poolAmount.toLocaleString()}+
        </div>
        <div
          style={{
            fontSize: 32,
            color: '#9ca3af',
            marginTop: 20,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Total Pool Value
        </div>
      </div>
    </AbsoluteFill>
  );
};

const LawyerMarketplaceScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const scale = spring({
    frame,
    fps,
    config: { damping: 100, stiffness: 180 },
  });
  
  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #1a1a2e 100%)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 80,
      }}
    >
      <div
        style={{
          transform: `scale(${scale})`,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 100 }}>👨‍⚖️👩‍⚖️</div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 'bold',
            color: '#ffffff',
            marginTop: 40,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Lawyer Marketplace
        </div>
        <div
          style={{
            fontSize: 36,
            color: '#9ca3af',
            marginTop: 30,
            fontFamily: 'Inter, sans-serif',
            maxWidth: 900,
          }}
        >
          Connect with verified Nigerian lawyers specializing in
          <br />
          <span style={{ color: '#22c55e', fontWeight: 600 }}>
            Criminal Law • Civil Rights • Corporate Law • Family Law
          </span>
        </div>
      </div>
    </AbsoluteFill>
  );
};

const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const pulse = Math.sin(frame / 10) * 5 + 100;
  
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
            fontSize: 84,
            fontWeight: 'bold',
            color: '#ffffff',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Start Winning Your Cases Today
        </div>
        <div
          style={{
            marginTop: 60,
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
          casewinai.com
        </div>
        <div
          style={{
            fontSize: 32,
            color: '#dcfce7',
            marginTop: 40,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          🇳🇬 Made for Nigerian Legal Professionals
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const PromoVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      {/* Intro - 0 to 8 seconds */}
      <Sequence from={0} durationInFrames={8 * 30}>
        <IntroScene />
      </Sequence>
      
      {/* AI Tools - 8 to 22 seconds */}
      <Sequence from={8 * 30} durationInFrames={14 * 30}>
        <AIToolsScene />
      </Sequence>
      
      {/* Prediction Markets - 22 to 36 seconds */}
      <Sequence from={22 * 30} durationInFrames={14 * 30}>
        <PredictionMarketsScene />
      </Sequence>
      
      {/* Lawyer Marketplace - 36 to 48 seconds */}
      <Sequence from={36 * 30} durationInFrames={12 * 30}>
        <LawyerMarketplaceScene />
      </Sequence>
      
      {/* CTA - 48 to 60 seconds */}
      <Sequence from={48 * 30} durationInFrames={12 * 30}>
        <CTAScene />
      </Sequence>
    </AbsoluteFill>
  );
};
