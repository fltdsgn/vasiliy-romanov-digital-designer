(() => {
  const names = ['bullet-tracer','sword-slash','hit-spark','hit-flash','emp-blast','energy-core','hologram','laser-grid','heart-lost','glitch-wipe','pixel-dissolve'];
  const assets = Object.create(null);
  for (const name of names) {
    const image = new Image();
    const asset = assets[name] = { image, frames: [], meta: null, ready: false };
    image.src = `assets/pixelfx/${name}/${name}.png`;
    Promise.all([fetch(`assets/pixelfx/${name}/${name}.json`).then(r => r.json()), new Promise(resolve => { image.onload = resolve; image.onerror = resolve; })])
      .then(([data]) => { asset.frames = data.frames.map(item => item.frame); asset.meta = data.meta.pixelfx; asset.ready = image.complete && image.naturalWidth > 0; });
  }
  window.PixelFXAssets = {
    ready(name) { return !!assets[name]?.ready; },
    draw(name, ctx, time, x, y, w, h, options = {}) {
      const asset = assets[name];
      if (!asset?.ready || !asset.frames.length) return false;
      const frames = asset.frames, fps = asset.meta?.fps || 24;
      let i = options.frame ?? Math.floor(Math.max(0,time) * fps);
      i = options.loop ?? asset.meta?.loop ? i % frames.length : Math.min(frames.length - 1, i);
      const f = frames[i]; ctx.save(); ctx.globalAlpha *= options.alpha ?? 1;
      if (options.mirror) { ctx.translate(x+w,y); ctx.scale(-1,1); x=0; y=0; }
      ctx.imageSmoothingEnabled = false; ctx.drawImage(asset.image,f.x,f.y,f.w,f.h,x,y,w,h); ctx.restore(); return true;
    }
  };
})();
