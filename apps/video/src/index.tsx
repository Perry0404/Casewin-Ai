import { Composition } from 'remotion';
import { PromoVideo } from './PromoVideo';
import { ExplainerVideo } from './ExplainerVideo';
import { SocialAd } from './SocialAd';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Main Promo Video - 60 seconds */}
      <Composition
        id="PromoVideo"
        component={PromoVideo}
        durationInFrames={60 * 30}
        fps={30}
        width={1920}
        height={1080}
      />
      
      {/* Explainer Video - 90 seconds */}
      <Composition
        id="ExplainerVideo"
        component={ExplainerVideo}
        durationInFrames={90 * 30}
        fps={30}
        width={1920}
        height={1080}
      />
      
      {/* Social Media Ad - 15 seconds */}
      <Composition
        id="SocialAd"
        component={SocialAd}
        durationInFrames={15 * 30}
        fps={30}
        width={1080}
        height={1080}
      />
      
      {/* Twitter/X Ad - 15 seconds */}
      <Composition
        id="TwitterAd"
        component={SocialAd}
        durationInFrames={15 * 30}
        fps={30}
        width={1200}
        height={675}
      />
    </>
  );
};
