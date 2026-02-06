import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import path from 'path';

const start = async () => {
  const compositionId = process.argv[2] || 'PromoVideo';
  
  console.log(`🎬 Rendering ${compositionId}...`);
  
  const bundleLocation = await bundle({
    entryPoint: path.resolve('./src/Root.tsx'),
    webpackOverride: (config) => config,
  });

  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: compositionId,
  });

  const outputLocation = `out/${compositionId}.mp4`;
  
  await renderMedia({
    composition,
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation,
    onProgress: ({ progress }) => {
      console.log(`Progress: ${Math.round(progress * 100)}%`);
    },
  });

  console.log(`✅ Video rendered to ${outputLocation}`);
};

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
