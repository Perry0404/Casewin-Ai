import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  spring,
  Sequence,
} from 'remotion';

const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const scale = spring({
    frame,
    fps,
    config: { damping: 80, stiffness: 250 },
  });
  
  const shake = Math.sin(frame * 0.5) * 3;
  
  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          transform: `scale(${scale}) rotate(${shake}deg)`,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontWeight: 'bold',
            color: '#ffffff',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Tired of losing cases?
        </div>
      </div>
    </AbsoluteFill>
  );
};

const SolutionScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const flipIn = spring({
    frame,
    fps,
    config: { damping: 100, stiffness: 200 },
  });
  
  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          transform: `scale(${flipIn})`,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 100 }}>⚖️</div>
        <div
          style={{
            fontSize: 80,
            fontWeight: 'bold',
            color: '#ffffff',
            marginTop: 20,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          CaseWin AI
        </div>
        <div
          style={{
            fontSize: 36,
            color: '#dcfce7',
            marginTop: 20,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          AI-Powered Legal Victory
        </div>
      </div>
    </AbsoluteFill>
  );
};

const FeaturesFlashScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  
  const features = [
    { text: '8 AI Tools', icon: '🤖' },
    { text: 'Case Prediction', icon: '🎯' },
    { text: 'Legal Research', icon: '🔍' },
  ];
  
  const currentFeature = Math.floor(frame / 30) % features.length;
  const localFrame = frame % 30;
  
  const opacity = interpolate(localFrame, [0, 5, 25, 30], [0, 1, 1, 0], {
    extrapolateRight: 'clamp',
  });
  
  const scale = spring({
    frame: localFrame,
    fps,
    config: { damping: 80, stiffness: 300 },
  });
  
  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          opacity,
          transform: `scale(${scale})`,
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 120 }}>{features[currentFeature].icon}</div>
        <div
          style={{
            fontSize: 64,
            fontWeight: 'bold',
            color: '#ffffff',
            marginTop: 30,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {features[currentFeature].text}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const CTAScene: React.FC = () => {
  const frame = useCurrentFrame();
  
  const pulse = Math.sin(frame / 5) * 10 + 100;
  
  const arrowMove = interpolate(frame, [0, 30], [0, 20], {
    extrapolateRight: 'extend',
  }) % 20;
  
  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
            padding: '40px 80px',
            borderRadius: 24,
            transform: `scale(${pulse / 100})`,
            display: 'inline-block',
          }}
        >
          <div
            style={{
              fontSize: 56,
              fontWeight: 'bold',
              color: '#ffffff',
              fontFamily: 'Inter, sans-serif',
            }}
          >
            casewinai.com
          </div>
        </div>
        <div
          style={{
            fontSize: 60,
            color: '#22c55e',
            marginTop: 30,
            transform: `translateY(${arrowMove}px)`,
          }}
        >
          👇
        </div>
        <div
          style={{
            fontSize: 32,
            color: '#9ca3af',
            marginTop: 20,
            fontFamily: 'Inter, sans-serif',
          }}
        >
          Start winning today!
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const SocialAd: React.FC = () => {
  return (
    <AbsoluteFill>
      {/* Hook - 0 to 3 seconds */}
      <Sequence from={0} durationInFrames={3 * 30}>
        <HookScene />
      </Sequence>
      
      {/* Solution - 3 to 6 seconds */}
      <Sequence from={3 * 30} durationInFrames={3 * 30}>
        <SolutionScene />
      </Sequence>
      
      {/* Features Flash - 6 to 12 seconds */}
      <Sequence from={6 * 30} durationInFrames={6 * 30}>
        <FeaturesFlashScene />
      </Sequence>
      
      {/* CTA - 12 to 15 seconds */}
      <Sequence from={12 * 30} durationInFrames={3 * 30}>
        <CTAScene />
      </Sequence>
    </AbsoluteFill>
  );
};
