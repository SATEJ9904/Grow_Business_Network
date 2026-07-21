module.exports = `
<!DOCTYPE html>
<html data-theme="{{theme}}" lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{{company}}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    :root {
      --primary: {{primaryColor}};
      --secondary: {{secondaryColor}};
      --bg: #04040E;
      --surface: #0A0A1A;
      --surface2: #0F0F22;
      --border: rgba(255,255,255,0.07);
      --text: #F0F0FF;
      --muted: #7A8299;
      --muted2: #4A5068;
    }

    html { scroll-behavior: smooth; }

    body {
      font-family: 'Inter', sans-serif;
      background: var(--bg);
      color: var(--text);
      overflow-x: hidden;
      line-height: 1.6;
    }

    ::-webkit-scrollbar { width: 3px; }
    ::-webkit-scrollbar-track { background: var(--bg); }
    ::-webkit-scrollbar-thumb { background: var(--primary); border-radius: 3px; }

    /* ── CANVAS ── */
    #particleCanvas {
      position: fixed; inset: 0;
      z-index: 0; pointer-events: none; opacity: 0.32;
    }

    /* ══════════════════════════════════════
       NAV
    ══════════════════════════════════════ */
    .navbar {
      position: fixed; top: 0; left: 0; width: 100%;
      z-index: 900; height: 70px;
      display: flex; align-items: center;
      padding: 0 6%; gap: 24px;
      transition: background 0.4s, border-color 0.4s;
    }
    .navbar.scrolled {
      background: rgba(4,4,14,0.92);
      backdrop-filter: blur(24px);
      border-bottom: 1px solid var(--border);
    }
    .logo {
      display: flex; align-items: center; gap: 12px;
      text-decoration: none; flex-shrink: 0;
    }
    .logo img.logo-img {
      max-height: 44px; max-width: 140px;
      object-fit: contain; display: block;
    }
    .logo-name {
      font-family: 'Syne', sans-serif; font-size: 19px; font-weight: 800;
      letter-spacing: -0.02em;
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    .nav-links {
      display: flex; gap: 0; margin-left: auto;
      background: rgba(255,255,255,0.04);
      border: 1px solid var(--border);
      border-radius: 60px; padding: 5px 6px;
    }
    .nav-links a {
      color: var(--muted); text-decoration: none;
      font-size: 0.87rem; font-weight: 500;
      padding: 7px 18px; border-radius: 60px;
      transition: color 0.25s, background 0.25s; letter-spacing: 0.01em;
    }
    .nav-links a:hover { color: var(--text); background: rgba(255,255,255,0.07); }
    .nav-cta {
      display: inline-flex; align-items: center; gap: 8px;
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      color: white; text-decoration: none;
      font-size: 0.87rem; font-weight: 600;
      padding: 10px 22px; border-radius: 60px;
      box-shadow: 0 0 24px rgba(124,58,237,0.28);
      transition: transform 0.25s, box-shadow 0.25s; flex-shrink: 0;
    }
    .nav-cta:hover { transform: translateY(-3px); box-shadow: 0 8px 28px rgba(124,58,237,0.48); }

    /* ══════════════════════════════════════
       HERO
    ══════════════════════════════════════ */
    .hero {
      min-height: 100vh; position: relative; z-index: 1;
      display: flex; align-items: center;
      padding: 110px 6% 80px;
      overflow: visible;
    }
    .hero-inner {
      width: 100%; display: grid;
      grid-template-columns: 1fr 1.55fr;
      gap: 56px; align-items: center;
    }
    .hero-kicker {
      display: inline-flex; align-items: center; gap: 10px;
      font-size: 0.76rem; font-weight: 600; letter-spacing: 0.14em;
      text-transform: uppercase; color: var(--primary); margin-bottom: 22px;
    }
    .hero-kicker::before { content:''; width:28px; height:1px; background:var(--primary); display:block; }
    .hero-industry {
      display: inline-block;
      background: rgba(255,255,255,0.06); border: 1px solid var(--border);
      padding: 4px 14px; border-radius: 60px;
      font-size: 0.78rem; color: var(--muted); margin-left: 10px;
    }
    .hero-title {
      font-family: 'Syne', sans-serif;
      font-size: clamp(2.4rem, 4.2vw, 4.6rem);
      font-weight: 800; line-height: 1.0; letter-spacing: -0.04em;
      margin-bottom: 10px;
      color: var(--text);
      display: block;
    }
    .hero-highlight {
      font-family: 'Syne', sans-serif;
      font-size: clamp(2.4rem, 4.2vw, 4.6rem);
      font-weight: 800; line-height: 1.0; letter-spacing: -0.04em;
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 55%, #F472B6 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
      display: block; margin-bottom: 16px;
    }
    .hero-subtitle {
      font-family: 'Syne', sans-serif;
      font-size: 1.05rem; font-weight: 600; color: rgba(240,240,255,0.55);
      margin-bottom: 14px; letter-spacing: -0.01em;
      display: block;
    }
    .hero-tagline {
      font-size: 0.88rem; font-style: italic;
      color: var(--primary); opacity: 0.85;
      margin-bottom: 24px; display: flex; align-items: center; gap: 6px;
    }
    .hero-tagline::before { content:'\\201C'; font-size:1.3rem; font-style:normal; opacity:0.5; }
    .hero-tagline::after  { content:'\\201D'; font-size:1.3rem; font-style:normal; opacity:0.5; }
    .hero-desc {
      font-size: 1rem; color: var(--muted);
      line-height: 1.75; max-width: 440px; margin-bottom: 32px;
    }
    .hero-actions { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 36px; }
    .btn-primary {
      display: inline-flex; align-items: center; gap: 8px;
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      color: white; text-decoration: none;
      padding: 14px 30px; border-radius: 60px;
      font-weight: 600; font-size: 0.92rem;
      box-shadow: 0 8px 28px rgba(124,58,237,0.3);
      transition: transform 0.3s, box-shadow 0.3s;
      border: none; cursor: pointer;
    }
    .btn-primary:hover { transform: translateY(-4px); box-shadow: 0 14px 32px rgba(124,58,237,0.48); }
    .btn-ghost {
      display: inline-flex; align-items: center; gap: 8px;
      background: transparent; border: 1px solid rgba(255,255,255,0.12);
      color: var(--text); text-decoration: none;
      padding: 14px 30px; border-radius: 60px;
      font-weight: 600; font-size: 0.92rem;
      transition: transform 0.3s, border-color 0.3s, background 0.3s;
      cursor: pointer;
    }
    .btn-ghost:hover { border-color: var(--primary); background: rgba(124,58,237,0.08); transform: translateY(-4px); }
    .hero-meta {
      display: flex; gap: 24px; flex-wrap: wrap;
      border-top: 1px solid var(--border); padding-top: 24px;
    }
    .hero-meta-item { display: flex; align-items: center; gap: 7px; }
    .hero-meta-item i { color: var(--primary); font-size: 13px; }
    .hero-meta-item span,
    .hero-meta-item a { font-size: 0.84rem; color: var(--muted); text-decoration: none; }

    /* Hero visual */
    .hero-visual { position: relative; }
    .hero-media-wrap {
      border-radius: 28px; overflow: hidden;
      border: 1px solid var(--border);
      background: var(--surface);
      box-shadow:
        0 0 0 1px rgba(124,58,237,0.12),
        0 50px 120px rgba(0,0,0,0.65),
        0 0 100px rgba(124,58,237,0.1);
      aspect-ratio: 16/9;
      width: 100%;
      position: relative;
    }
    .hero-media-wrap img,
    .hero-media-wrap video,
    .hero-media-wrap iframe {
      width: 100%; height: 100%; object-fit: cover; display: block; border: none;
      position: absolute; inset: 0;
    }
    .live-pill {
      display: inline-flex; align-items: center; gap: 6px;
      background: rgba(4,4,14,0.78); backdrop-filter: blur(10px);
      border: 1px solid var(--border); border-radius: 60px;
      padding: 5px 12px; font-size: 0.72rem; font-weight: 600;
      position: absolute; top: 14px; right: 14px; color: var(--text);
      z-index: 2;
    }
    .live-dot { width:6px; height:6px; border-radius:50%; background:#22C55E; animation: blink 1.8s infinite; }
    @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

    .hero-glow {
      position: absolute; inset: -40px;
      border-radius: 40px;
      background: radial-gradient(ellipse at center, rgba(124,58,237,0.14) 0%, transparent 65%);
      z-index: -1; pointer-events: none;
    }

    /* ══════════════════════════════════════
       MARQUEE
    ══════════════════════════════════════ */
    .marquee-wrap {
      position: relative; z-index: 1;
      padding: 24px 0; overflow: hidden;
      border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
      background: linear-gradient(90deg, var(--bg) 0%, transparent 8%, transparent 92%, var(--bg) 100%);
    }
    .marquee-track {
      display: flex; gap: 52px; width: max-content;
      animation: marquee 26s linear infinite;
    }
    .marquee-item {
      display: flex; align-items: center; gap: 9px;
      font-size: 0.8rem; font-weight: 600;
      color: var(--muted); letter-spacing: 0.09em; text-transform: uppercase;
      white-space: nowrap; flex-shrink: 0;
    }
    .marquee-item i { color: var(--primary); font-size: 11px; }
    @keyframes marquee { from{transform:translateX(0)} to{transform:translateX(-50%)} }
    @media(prefers-reduced-motion:reduce){ .marquee-track{ animation:none; } }

    /* ══════════════════════════════════════
       SHARED SECTION PRIMITIVES
    ══════════════════════════════════════ */
    section { position: relative; z-index: 1; }
    .section-wrap { padding: 110px 6%; }
    .section-label {
      display: inline-flex; align-items: center; gap: 7px;
      font-size: 0.72rem; font-weight: 600; letter-spacing: 0.13em;
      text-transform: uppercase; color: var(--primary); margin-bottom: 14px;
    }
    .section-heading {
      font-family: 'Syne', sans-serif;
      font-size: clamp(2rem, 3.2vw, 3.2rem);
      font-weight: 800; letter-spacing: -0.03em; line-height: 1.1;
      margin-bottom: 16px;
    }
    .grad {
      background: linear-gradient(135deg, var(--primary) 0%, var(--secondary) 55%, #F472B6 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }
    .section-sub {
      font-size: 1rem; color: var(--muted);
      max-width: 500px; line-height: 1.74;
    }
    .section-hdr { margin-bottom: 60px; }
    .section-hdr.center { text-align: center; }
    .section-hdr.center .section-label { justify-content: center; }
    .section-hdr.center .section-sub { margin: 0 auto; }
    .divider {
      height: 1px; position: relative; z-index: 1;
      background: linear-gradient(90deg, transparent, var(--border) 20%, var(--border) 80%, transparent);
    }

    /* ══════════════════════════════════════
       VIDEO SECTION
    ══════════════════════════════════════ */
    #videos { position: relative; z-index: 1; }
    .video-section-shell { padding: 90px 6% 100px; }
    .video-section-title {
      font-family: 'Syne', sans-serif;
      font-size: clamp(2rem, 3.2vw, 3.2rem);
      font-weight: 800; letter-spacing: -0.03em;
      text-align: center; margin-bottom: 12px;
    }
    .video-section-label {
      display: flex; justify-content: center; align-items: center; gap: 7px;
      font-size: 0.72rem; font-weight: 600; letter-spacing: 0.13em;
      text-transform: uppercase; color: var(--primary); margin-bottom: 14px;
    }
    .video-section-sub {
      text-align: center; font-size: 0.96rem; color: var(--muted);
      max-width: 460px; margin: 0 auto 56px; line-height: 1.7;
    }
    .videos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 18px;
    }
    .video-card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 18px; overflow: hidden;
      transition: transform 0.35s, border-color 0.35s, box-shadow 0.35s;
    }
    .video-card:hover {
      transform: translateY(-7px);
      border-color: rgba(124,58,237,0.28);
      box-shadow: 0 20px 48px rgba(0,0,0,0.45), 0 0 32px rgba(124,58,237,0.06);
    }
    .video-thumb-wrap {
      position: relative; overflow: hidden;
      aspect-ratio: 16/9; background: var(--surface2);
    }
    .video-thumb-wrap img {
      width: 100%; height: 100%; object-fit: cover; display: block;
      transition: transform 0.55s, filter 0.4s;
      filter: brightness(0.85);
    }
    .video-card:hover .video-thumb-wrap img { transform: scale(1.06); filter: brightness(1); }
    .video-thumb-wrap video.card-video {
      width: 100%; height: 100%; object-fit: cover;
      position: absolute; inset: 0;
      display: none;
    }
    .video-thumb-wrap.playing img { display: none; }
    .video-thumb-wrap.playing video.card-video { display: block; }
    .play-overlay {
      position: absolute; inset: 0;
      display: flex; align-items: center; justify-content: center;
      background: rgba(4,4,14,0.25);
      transition: background 0.3s;
      cursor: pointer;
    }
    .video-card:hover .play-overlay { background: rgba(4,4,14,0.1); }
    .play-circle {
      width: 42px; height: 42px; border-radius: 50%;
      background: rgba(10,10,26,0.72); backdrop-filter: blur(8px);
      border: 1px solid rgba(255,255,255,0.18);
      display: flex; align-items: center; justify-content: center;
      transition: transform 0.3s, background 0.3s;
    }
    .play-circle i { font-size: 14px; color: white; margin-left: 2px; }
    .video-card:hover .play-circle { transform: scale(1.14); background: rgba(124,58,237,0.65); }
    .video-playing-ind {
      display: none; position: absolute; bottom: 8px; left: 8px;
      background: rgba(4,4,14,0.78); backdrop-filter: blur(6px);
      border: 1px solid rgba(124,58,237,0.4); border-radius: 60px;
      padding: 3px 10px; font-size: 0.68rem; font-weight: 600; color: var(--primary);
      align-items: center; gap: 5px;
    }
    .video-thumb-wrap.playing .video-playing-ind { display: flex; }
    .video-playing-ind::before {
      content: ''; width: 5px; height: 5px; border-radius: 50%;
      background: var(--primary); animation: blink 1.2s infinite;
    }
    .video-info { padding: 14px 16px 18px; }
    .video-info h3 {
      font-family: 'Syne', sans-serif; font-size: 0.92rem; font-weight: 700;
      margin-bottom: 5px; line-height: 1.3;
    }
    .video-info p { font-size: 0.82rem; color: var(--muted); margin-bottom: 10px; line-height: 1.5; }
    .video-link {
      font-size: 0.78rem; font-weight: 600; color: var(--primary);
      text-decoration: none; display: inline-flex; align-items: center; gap: 4px;
      transition: gap 0.2s;
    }
    .video-link:hover { gap: 8px; }

    /* ══════════════════════════════════════
       ABOUT
    ══════════════════════════════════════ */
    .about-grid {
      display: grid; grid-template-columns: 1fr 1fr;
      gap: 80px; align-items: start;
    }
    .about-image-wrap {
      border-radius: 24px; overflow: hidden;
      border: 1px solid var(--border);
      background: var(--surface); aspect-ratio: 4/3;
      box-shadow: 0 30px 70px rgba(0,0,0,0.4);
      transition: transform 0.5s;
    }
    .about-image-wrap:hover { transform: scale(1.02); }
    .about-image-wrap img { width:100%; height:100%; object-fit:cover; display:block; }
    .about-image-placeholder {
      width:100%; height:100%;
      display:flex; align-items:center; justify-content:center;
      color: var(--muted2); font-size:0.85rem; letter-spacing:0.06em;
      background: var(--surface2);
    }
    .about-text .section-sub { max-width: none; margin-bottom: 26px; }
    .about-pills { display: flex; flex-wrap: wrap; gap: 9px; margin-top: 24px; }
    .about-pill {
      display: inline-flex; align-items: center; gap: 6px;
      background: rgba(255,255,255,0.04); border: 1px solid var(--border);
      padding: 7px 15px; border-radius: 60px;
      font-size: 0.82rem; font-weight: 500; color: var(--muted);
      transition: border-color 0.3s, color 0.3s;
    }
    .about-pill:hover { border-color: var(--primary); color: var(--text); }
    .about-pill i { color: var(--primary); font-size: 11px; }
    .about-unique {
      margin-top: 24px; padding: 20px 22px;
      background: var(--surface); border: 1px solid var(--border);
      border-left: 3px solid var(--primary);
      border-radius: 0 16px 16px 0;
    }
    .about-unique-label {
      font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em;
      color: var(--primary); margin-bottom: 8px;
      display: flex; align-items: center; gap: 6px;
    }
    .about-unique p { font-size: 0.93rem; color: var(--muted); line-height: 1.62; }
    .about-growth {
      margin-top: 18px; padding: 20px 22px;
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 16px;
    }
    .about-growth-label {
      font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em;
      color: var(--secondary); margin-bottom: 8px;
      display: flex; align-items: center; gap: 6px;
    }
    .about-growth p { font-size: 0.93rem; color: var(--muted); line-height: 1.62; }

    /* ══════════════════════════════════════
       SERVICES
    ══════════════════════════════════════ */
    .services-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
    }
    .service-card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 22px; overflow: hidden;
      transition: transform 0.4s, border-color 0.4s, box-shadow 0.4s;
      position: relative;
    }
    .service-card::after {
      content:''; position:absolute; top:0; left:0; right:0; height:2px;
      background: linear-gradient(90deg, transparent, var(--primary), transparent);
      opacity:0; transition: opacity 0.4s;
    }
    .service-card:hover {
      transform: translateY(-10px);
      border-color: rgba(124,58,237,0.22);
      box-shadow: 0 24px 56px rgba(0,0,0,0.4), 0 0 36px rgba(124,58,237,0.06);
    }
    .service-card:hover::after { opacity:1; }
    .service-img-wrap { overflow: hidden; }
    .service-image {
      width:100%; height:200px; object-fit:cover; display:block;
      background: var(--surface2); filter: brightness(0.86) saturate(0.9);
      transition: filter 0.4s, transform 0.6s;
    }
    .service-card:hover .service-image { filter: brightness(1) saturate(1.1); transform: scale(1.05); }
    .service-content { padding: 24px 24px 28px; }
    .service-content h3 {
      font-family: 'Syne', sans-serif; font-size: 1.18rem; font-weight: 700;
      letter-spacing: -0.02em; margin-bottom: 9px;
    }
    .service-content p { font-size: 0.92rem; color: var(--muted); line-height: 1.65; }

    /* ══════════════════════════════════════
       TESTIMONIALS
    ══════════════════════════════════════ */
    .testimonials-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: 20px;
    }
    .testimonial-card {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 22px; padding: 28px 26px;
      transition: transform 0.4s, border-color 0.4s, box-shadow 0.4s;
      position: relative; overflow: hidden;
    }
    .testimonial-card::before {
      content: '\\201C';
      position: absolute; top: 14px; right: 20px;
      font-family: 'Syne', sans-serif; font-size: 4.5rem; font-weight: 800;
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
      line-height: 1; opacity: 0.18; pointer-events: none;
    }
    .testimonial-card:hover {
      transform: translateY(-8px);
      border-color: rgba(124,58,237,0.22);
      box-shadow: 0 20px 48px rgba(0,0,0,0.38), 0 0 28px rgba(124,58,237,0.05);
    }
    .testimonial-top { display: flex; align-items: center; gap: 14px; margin-bottom: 16px; }
    .t-avatar {
      width: 52px; height: 52px; border-radius: 50%; object-fit: cover; flex-shrink: 0;
      border: 2px solid var(--border); background: var(--surface2); display: block;
    }
    .t-avatar-fb {
      width: 52px; height: 52px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      display: flex; align-items: center; justify-content: center;
      font-family: 'Syne', sans-serif; font-size: 18px; font-weight: 700; color: white;
    }
    .t-name { font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 700; margin-bottom: 2px; }
    .t-role { font-size: 0.78rem; color: var(--primary); font-weight: 500; }
    .stars { display: flex; gap: 3px; margin-bottom: 12px; }
    .stars i { color: #F59E0B; font-size: 12px; }
    .testimonial-text { font-size: 0.91rem; color: var(--muted); line-height: 1.7; }

    /* ══════════════════════════════════════
       CONTACT
    ══════════════════════════════════════ */
    .contact-grid {
      display: grid; grid-template-columns: 1fr 1fr; gap: 52px; align-items: start;
    }
    .contact-cards { display: flex; flex-direction: column; gap: 14px; }
    .contact-card {
      display: flex; align-items: flex-start; gap: 16px;
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 18px; padding: 20px 22px;
      transition: border-color 0.3s, transform 0.3s;
    }
    .contact-card:hover { border-color: rgba(124,58,237,0.26); transform: translateX(6px); }
    .contact-icon {
      width: 42px; height: 42px; flex-shrink: 0; border-radius: 12px;
      background: linear-gradient(135deg, rgba(124,58,237,0.14), rgba(6,182,212,0.07));
      border: 1px solid rgba(124,58,237,0.18);
      display: flex; align-items: center; justify-content: center;
    }
    .contact-icon i {
      background: linear-gradient(135deg, var(--primary), var(--secondary));
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
      font-size: 17px;
    }
    .contact-lbl {
      font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.09em;
      color: var(--muted); margin-bottom: 4px;
    }
    .contact-val { font-size: 0.97rem; font-weight: 500; }
    .contact-cta {
      background: var(--surface); border: 1px solid var(--border);
      border-radius: 24px; padding: 40px 36px; position: relative; overflow: hidden;
    }
    .contact-cta::before {
      content:''; position:absolute; inset:0;
      background: radial-gradient(ellipse at top right, rgba(124,58,237,0.09), transparent 65%);
      pointer-events: none;
    }
    .contact-cta h3 {
      font-family: 'Syne', sans-serif; font-size: 1.8rem; font-weight: 800;
      letter-spacing: -0.03em; margin-bottom: 12px;
    }
    .contact-cta p { font-size: 0.96rem; color: var(--muted); line-height: 1.7; margin-bottom: 30px; }
    .contact-cta-socials { display: flex; gap: 10px; margin-top: 22px; }
    .social-btn {
      width: 40px; height: 40px; border-radius: 11px;
      background: rgba(255,255,255,0.05); border: 1px solid var(--border);
      display: flex; align-items: center; justify-content: center;
      color: var(--muted); text-decoration: none;
      transition: color 0.3s, border-color 0.3s, transform 0.3s;
    }
    .social-btn:hover { color: var(--primary); border-color: var(--primary); transform: translateY(-4px); }

    /* ══════════════════════════════════════
       FOOTER
    ══════════════════════════════════════ */
    .footer {
      position: relative; z-index: 1;
      padding: 40px 6% 30px;
      border-top: 1px solid var(--border);
      display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 18px;
    }
    .footer-brand { display: flex; align-items: center; gap: 12px; }
    .footer-tagline { font-size: 0.8rem; color: var(--muted); margin-top: 4px; }
    .footer-copy { font-size: 0.82rem; color: var(--muted); text-align: center; line-height: 1.7; }
    .footer-copy span { color: var(--primary); }
    .footer-links { display: flex; gap: 9px; }

    /* ══════════════════════════════════════
       REVEAL
    ══════════════════════════════════════ */
    .reveal { opacity:0; transform:translateY(34px); transition: opacity 0.72s ease, transform 0.72s ease; }
    .reveal.visible { opacity:1; transform:translateY(0); }
    .d1{transition-delay:0.08s} .d2{transition-delay:0.16s} .d3{transition-delay:0.24s}
    .d4{transition-delay:0.32s} .d5{transition-delay:0.4s}

    /* ══════════════════════════════════════
       RESPONSIVE
    ══════════════════════════════════════ */
    @media(max-width:1100px){
      .hero-inner{ grid-template-columns:1fr 1.3fr; gap:40px; }
      .services-grid{ grid-template-columns:1fr 1fr; }
    }
    @media(max-width:820px){
      .hero-inner,.about-grid,.contact-grid{ grid-template-columns:1fr; }
      .hero{ text-align:center; padding: 100px 5% 60px; }
      .hero-kicker,.hero-tagline{ justify-content:center; }
      .hero-desc,.about-text .section-sub{ margin-left:auto; margin-right:auto; }
      .hero-actions{ justify-content:center; }
      .hero-meta{ justify-content:center; }
      .services-grid{ grid-template-columns:1fr; }
      .nav-links{ display:none; }
      .footer{ flex-direction:column; text-align:center; }
      .contact-cta-socials{ justify-content:center; }
      .videos-grid{ grid-template-columns:repeat(auto-fill,minmax(180px,1fr)); }
    }
    @media(max-width:540px){
      .section-wrap{ padding:80px 5%; }
      .hero-title,.hero-highlight{ font-size:2.4rem; }
      .contact-cta{ padding:28px 22px; }
      .videos-grid{ grid-template-columns:1fr 1fr; gap:12px; }
    }
  </style>
</head>
<body>

  <canvas id="particleCanvas"></canvas>

  <!-- ═══ NAV ═══ -->
  <nav class="navbar" id="navbar">
    <a href="#" class="logo">
      {{logoImageTag}}
      <span class="logo-name">{{company}}</span>
    </a>
    <div class="nav-links">
      <a href="#about">About</a>
      <a href="#services">Services</a>
      <a href="#videos">Videos</a>
      <a href="#testimonials">Reviews</a>
      <a href="#contact">Contact</a>
    </div>
    <a href="#contact" class="nav-cta">
      <i class="fas fa-paper-plane"></i> Connect
    </a>
  </nav>

  <!-- ═══ HERO ═══ -->
  <section class="hero">
    <div class="hero-inner">
      <div class="hero-content">
        <div class="hero-kicker reveal">
          {{businessCategory}}<span class="hero-industry">{{industry}}</span>
        </div>
        <span class="hero-title reveal d1">{{heroTitle}}</span>
        <span class="hero-highlight reveal d2">{{heroHighlight}}</span>
        <span class="hero-subtitle reveal d2">{{heroSubtitle}}</span>
        <p class="hero-tagline reveal d3">{{tagline}}</p>
        <p class="hero-desc reveal d3">{{heroDescription}}</p>
        <div class="hero-actions reveal d4">
          <a href="#contact" class="btn-primary"><i class="fas fa-paper-plane"></i> Get in Touch</a>
          <a href="#services" class="btn-ghost"><i class="fas fa-compass"></i> Our Services</a>
        </div>
        <div class="hero-meta reveal d5">
          <div class="hero-meta-item">
            <i class="fas fa-tag"></i>
            <span>{{expertise}}</span>
          </div>
          <div class="hero-meta-item">
            <i class="fas fa-map-marker-alt"></i>
            <span>{{city}}</span>
          </div>
          <div class="hero-meta-item">
            <i class="fas fa-globe"></i>
            <a href="{{website}}" target="_blank" rel="noopener noreferrer">Visit Website</a>
          </div>
        </div>
      </div>
      <div class="hero-visual reveal d2">
        <div class="hero-glow"></div>
        <div class="hero-media-wrap" id="heroMediaWrap">
          {{heroVideo}}
          <img src="{{heroImage}}" alt="{{company}}" id="heroImg" />
          <div class="live-pill"><span class="live-dot"></span> Live</div>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══ MARQUEE ═══ -->
  <div class="marquee-wrap">
    <div class="marquee-track">
      <span class="marquee-item"><i class="fas fa-diamond"></i>{{businessCategory}}</span>
      <span class="marquee-item"><i class="fas fa-diamond"></i>{{industry}}</span>
      <span class="marquee-item"><i class="fas fa-diamond"></i>{{expertise}}</span>
      <span class="marquee-item"><i class="fas fa-diamond"></i>{{city}}</span>
      <span class="marquee-item"><i class="fas fa-diamond"></i>{{company}}</span>
      <span class="marquee-item"><i class="fas fa-diamond"></i>{{tagline}}</span>
      <span class="marquee-item"><i class="fas fa-diamond"></i>{{businessCategory}}</span>
      <span class="marquee-item"><i class="fas fa-diamond"></i>{{industry}}</span>
      <span class="marquee-item"><i class="fas fa-diamond"></i>{{expertise}}</span>
      <span class="marquee-item"><i class="fas fa-diamond"></i>{{city}}</span>
      <span class="marquee-item"><i class="fas fa-diamond"></i>{{company}}</span>
      <span class="marquee-item"><i class="fas fa-diamond"></i>{{tagline}}</span>
    </div>
  </div>


  <!-- ═══ ABOUT ═══ -->
  <section id="about">
    <div class="section-wrap">
      <div class="about-grid">
        <div class="about-image-side reveal">
          <div class="about-image-wrap">
            <img src="{{aboutImage}}" alt="About {{company}}"
              onerror="this.parentElement.innerHTML='<div class=about-image-placeholder>{{company}}</div>'"
              style="width:100%;height:100%;object-fit:cover;display:block;" />
          </div>
        </div>
        <div class="about-text">
          <div class="section-label reveal"><i class="fas fa-address-card"></i> About Us</div>
          <h2 class="section-heading reveal d1">About <span class="grad">{{company}}</span></h2>
          <p class="section-sub reveal d2">{{about}}</p>
          <div class="about-pills reveal d3">
            <span class="about-pill"><i class="fas fa-briefcase"></i>{{businessCategory}}</span>
            <span class="about-pill"><i class="fas fa-industry"></i>{{industry}}</span>
            <span class="about-pill"><i class="fas fa-star"></i>{{expertise}}</span>
            <span class="about-pill"><i class="fas fa-map-pin"></i>{{city}}</span>
          </div>
          <div class="about-unique reveal d3">
            <div class="about-unique-label"><i class="fas fa-fingerprint"></i> What Makes Us Unique</div>
            <p>{{uniqueBusiness}}</p>
          </div>
          <div class="about-growth reveal d4">
            <div class="about-growth-label"><i class="fas fa-chart-line"></i> Growth Opportunities</div>
            <p>{{growthOpportunities}}</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <div class="divider"></div>

  <!-- ═══ SERVICES ═══ -->
  <section id="services">
    <div class="section-wrap">
      <div class="section-hdr center reveal">
        <div class="section-label"><i class="fas fa-bolt"></i> What We Offer</div>
        <h2 class="section-heading">Our <span class="grad">Services</span></h2>
      </div>
      <div class="services-grid">
        {{services}}
      </div>
    </div>
  </section>

  <div class="divider"></div>

  <!-- ═══ CONTACT ═══ -->
  <section id="contact">
    <div class="section-wrap">
      <div class="section-hdr reveal">
        <div class="section-label"><i class="fas fa-headset"></i> Reach Out</div>
        <h2 class="section-heading">Let's <span class="grad">Connect</span></h2>
        <p class="section-sub">Have a project or question? We're ready to help you move forward.</p>
      </div>
      <div class="contact-grid">
        <div class="contact-cards">
          <div class="contact-card reveal d1">
            <div class="contact-icon"><i class="fas fa-envelope"></i></div>
            <div><div class="contact-lbl">Email</div><div class="contact-val">{{email}}</div></div>
          </div>
          <div class="contact-card reveal d2">
            <div class="contact-icon"><i class="fas fa-phone-alt"></i></div>
            <div><div class="contact-lbl">Phone</div><div class="contact-val">{{phone}}</div></div>
          </div>
          <div class="contact-card reveal d3">
            <div class="contact-icon"><i class="fas fa-location-dot"></i></div>
            <div><div class="contact-lbl">Address</div><div class="contact-val">{{address}}</div></div>
          </div>
        </div>
        <div class="contact-cta reveal d2">
          <h3>Start a Conversation</h3>
          <p>Whether you have a project in mind or simply want to explore what's possible — reach out. Our team at <strong>{{company}}</strong> is ready to help you grow.</p>
          <a href="mailto:{{email}}" class="btn-primary" style="display:inline-flex;align-items:center;gap:9px;">
            <i class="fas fa-arrow-right"></i> Send a Message
          </a>
          <div class="contact-cta-socials">
            <a href="{{website}}" target="_blank" rel="noopener noreferrer" class="social-btn" title="Website"><i class="fas fa-globe"></i></a>
            <a href="{{linkedin}}" target="_blank" rel="noopener noreferrer" class="social-btn" title="LinkedIn"><i class="fab fa-linkedin-in"></i></a>
            <a href="{{instagram}}" target="_blank" rel="noopener noreferrer" class="social-btn" title="Instagram"><i class="fab fa-instagram"></i></a>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- ═══ FOOTER ═══ -->
  <footer class="footer">
    <div class="footer-brand">
      {{logoImageTag}}
      <div>
        <div class="logo-name">{{company}}</div>
        <div class="footer-tagline">{{tagline}}</div>
      </div>
    </div>
    <div class="footer-copy">
      &copy; {{company}} &middot; {{footerInfo}} &middot; {{city}}<br/>
      <span>{{industry}}</span> &middot; {{businessCategory}}
    </div>
    <div class="footer-links">
      <a href="{{website}}" target="_blank" rel="noopener noreferrer" class="social-btn"><i class="fas fa-globe"></i></a>
      <a href="{{linkedin}}" target="_blank" rel="noopener noreferrer" class="social-btn"><i class="fab fa-linkedin-in"></i></a>
      <a href="{{instagram}}" target="_blank" rel="noopener noreferrer" class="social-btn"><i class="fab fa-instagram"></i></a>
    </div>
  </footer>

  <script>
    /* ════════════════════════════════
       NAV SCROLL
    ════════════════════════════════ */
    const nav = document.getElementById('navbar');
    window.addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 40));

    /* ════════════════════════════════
       HERO IMAGE FALLBACK
       Hide img if src is empty / placeholder
    ════════════════════════════════ */
    (function(){
      const heroImg = document.getElementById('heroImg');
      if (!heroImg) return;
      const src = heroImg.getAttribute('src') || '';
      if (!src || src === '{{heroImage}}' || src.trim() === '') {
        heroImg.style.display = 'none';
      } else {
        heroImg.onerror = function(){ this.style.display = 'none'; };
      }
    })();

    /* ════════════════════════════════
       PARTICLE CANVAS
    ════════════════════════════════ */
    (function(){
      const canvas = document.getElementById('particleCanvas');
      const ctx = canvas.getContext('2d');
      let W, H, pts = [];
      const N = 80, D = 130;
      const resize = () => { W = canvas.width = innerWidth; H = canvas.height = innerHeight; };
      resize(); window.addEventListener('resize', resize);
      function Pt(){
        this.x = Math.random()*W; this.y = Math.random()*H;
        this.vx = (Math.random()-.5)*.45; this.vy = (Math.random()-.5)*.45;
        this.r = Math.random()*1.4+0.5; this.a = Math.random()*.5+0.2;
      }
      for(let i=0;i<N;i++) pts.push(new Pt());
      function draw(){
        ctx.clearRect(0,0,W,H);
        pts.forEach((p,i)=>{
          p.x+=p.vx; p.y+=p.vy;
          if(p.x<0||p.x>W) p.vx*=-1;
          if(p.y<0||p.y>H) p.vy*=-1;
          ctx.beginPath(); ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
          ctx.fillStyle='rgba(124,58,237,'+p.a+')'; ctx.fill();
          for(let j=i+1;j<pts.length;j++){
            const q=pts[j], dx=p.x-q.x, dy=p.y-q.y, dist=Math.sqrt(dx*dx+dy*dy);
            if(dist<D){
              ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y);
              ctx.strokeStyle='rgba(124,58,237,'+(0.1*(1-dist/D))+')';
              ctx.lineWidth=0.5; ctx.stroke();
            }
          }
        });
        requestAnimationFrame(draw);
      }
      draw();
    })();

    /* ════════════════════════════════
       SCROLL REVEAL
    ════════════════════════════════ */
    const revObs = new IntersectionObserver(entries=>{
      entries.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('visible'); });
    },{threshold:0.1});
    document.querySelectorAll('.reveal').forEach(el=>revObs.observe(el));
    // Hero elements reveal immediately on load
    setTimeout(()=>{
      document.querySelectorAll('.hero .reveal').forEach(el=>el.classList.add('visible'));
    }, 80);

    /* ════════════════════════════════
       VIDEO SECTION — hide if empty
    ════════════════════════════════ */
    (function(){
      const grid = document.getElementById('videosGrid');
      const outer = document.getElementById('videosOuter');
      if (!grid || !outer) return;
      // Check if there are actual video cards
      const cards = grid.querySelectorAll('.video-card');
      if (!cards.length) {
        outer.style.display = 'none';
        return;
      }

      // Wire up video cards: autoplay direct video files on scroll
      cards.forEach(card => {
        const tw = card.querySelector('.video-thumb-wrap');
        const vid = card.querySelector('video.card-video');
        const ov = card.querySelector('.play-overlay');
        if (!tw) return;

        if (vid) {
          const vpObs = new IntersectionObserver(entries=>{
            entries.forEach(entry=>{
              if(entry.isIntersecting){
                vid.play().catch(()=>{});
                tw.classList.add('playing');
              } else {
                vid.pause();
                tw.classList.remove('playing');
              }
            });
          },{threshold:0.6});
          vpObs.observe(card);

          if (ov) {
            ov.addEventListener('click', ()=>{
              if(vid.paused){ vid.play().catch(()=>{}); tw.classList.add('playing'); }
              else { vid.pause(); tw.classList.remove('playing'); }
            });
          }
        } else if (ov) {
          // External link — get href from the watch link
          const lnk = card.querySelector('a.video-link');
          if (lnk) {
            ov.style.cursor = 'pointer';
            ov.addEventListener('click', ()=> window.open(lnk.href,'_blank','noopener,noreferrer'));
          }
        }
      });
    })();

    /* ════════════════════════════════
       SERVICE CARDS — wrap img in overflow div
    ════════════════════════════════ */
    document.querySelectorAll('.service-card').forEach(card=>{
      const img = card.querySelector('img.service-image');
      if(!img) return;
      if(img.parentElement.classList.contains('service-img-wrap')) return;
      const wrap = document.createElement('div');
      wrap.className = 'service-img-wrap';
      img.parentNode.insertBefore(wrap, img);
      wrap.appendChild(img);
    });

    /* ════════════════════════════════
       TESTIMONIALS — restructure cards
    ════════════════════════════════ */
    document.querySelectorAll('#testimonialsGrid .testimonial-card').forEach(card=>{
      // Skip if already structured (has .testimonial-top)
      if(card.querySelector('.testimonial-top')) return;

      const img  = card.querySelector('img.testimonial-avatar');
      const h3   = card.querySelector('h3');
      const role = card.querySelector('span.t-role, .role, span');
      const p    = card.querySelector('p');
      if(!h3) return;

      const savedHTML = card.innerHTML;
      card.innerHTML = '';

      // top row
      const top = document.createElement('div');
      top.className = 'testimonial-top';

      if(img && img.src && img.src !== window.location.href && !img.src.endsWith('/')){
        const av = document.createElement('img');
        av.src = img.src; av.alt = h3.textContent; av.className = 't-avatar';
        av.onerror = function(){
          const fb = document.createElement('div');
          fb.className = 't-avatar-fb';
          fb.textContent = (h3.textContent||'?')[0].toUpperCase();
          this.parentNode.replaceChild(fb, this);
        };
        top.appendChild(av);
      } else {
        const fb = document.createElement('div');
        fb.className = 't-avatar-fb';
        fb.textContent = (h3.textContent||'?')[0].toUpperCase();
        top.appendChild(fb);
      }

      const nameWrap = document.createElement('div');
      const nm = document.createElement('div'); nm.className='t-name'; nm.textContent=h3.textContent;
      const rl = document.createElement('div'); rl.className='t-role'; rl.textContent=role?role.textContent:'';
      nameWrap.appendChild(nm); nameWrap.appendChild(rl);
      top.appendChild(nameWrap);
      card.appendChild(top);

      // stars
      const stars = document.createElement('div'); stars.className='stars';
      stars.innerHTML='<i class="fas fa-star"></i>'.repeat(5);
      card.appendChild(stars);

      // review text
      if(p){
        const rev=document.createElement('p');
        rev.className='testimonial-text';
        rev.textContent=p.textContent;
        card.appendChild(rev);
      }
    });

  </script>

</body>
</html>
`;