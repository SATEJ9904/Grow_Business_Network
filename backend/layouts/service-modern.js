module.exports = `
<!DOCTYPE html>
<html data-theme="{{colorMode}}" lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{{company}}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,500&family=Jost:wght@300;400;500;600&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css" />
  <style>
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }

    :root {
      --primary: {{primaryColor}};
      --secondary: {{secondaryColor}};
      --bg: #F7F7F5;
      --surface: #FFFFFF;
      --surface-2: #ECEEF0;
      --border: rgba(15, 23, 35, 0.10);
      --border-strong: rgba(15, 23, 35, 0.20);
      --text: #10151D;
      --muted: #5B6572;
      --muted-2: #98A2AD;
      color-scheme: light;
    }
    html[data-theme="dark"] {
      --bg: #0A0D12;
      --surface: #12161D;
      --surface-2: #1A1F27;
      --border: rgba(237, 239, 242, 0.10);
      --border-strong: rgba(237, 239, 242, 0.20);
      --text: #EDEFF2;
      --muted: #9AA3AD;
      --muted-2: #5B6572;
      color-scheme: dark;
    }

    html { scroll-behavior: smooth; }

    body {
      font-family: 'Jost', sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.65;
      overflow-x: hidden;
      transition: background 0.5s ease, color 0.5s ease;
    }

    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: var(--bg); }
    ::-webkit-scrollbar-thumb { background: var(--primary); border-radius: 4px; }

    a { color: inherit; }
    img { max-width: 100%; display: block; }

    .eyebrow {
      display: inline-flex; align-items: center; gap: 12px;
      font-size: 0.72rem; font-weight: 500; letter-spacing: 0.28em;
      text-transform: uppercase; color: var(--primary);
    }
    .eyebrow::before, .eyebrow.center::after { content: ''; width: 30px; height: 1px; background: var(--secondary); display: block; }
    .eyebrow.center { justify-content: center; }

    .grad-text {
      background: linear-gradient(120deg, var(--primary) 0%, var(--secondary) 100%);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    }

    /* ══════════════ NAV ══════════════ */
    .navbar {
      position: fixed; top: 0; left: 0; width: 100%; z-index: 900;
      height: 84px; display: flex; align-items: center;
      padding: 0 6%; transition: background 0.4s, border-color 0.4s, height 0.4s;
      border-bottom: 1px solid transparent;
    }
    .navbar.scrolled {
      background: color-mix(in srgb, var(--bg) 88%, transparent);
      backdrop-filter: blur(18px);
      border-bottom: 1px solid var(--border);
      height: 68px;
    }
    .logo { display: flex; align-items: center; gap: 12px; text-decoration: none; }
    .logo img.logo-img { max-height: 44px; max-width: 150px; object-fit: contain; display: block; }
    .logo-name { font-family: 'Cormorant Garamond', serif; font-size: 1.5rem; font-weight: 600; letter-spacing: 0.02em; }
    .nav-links { display: flex; gap: 38px; margin: 0 auto; }
    .nav-links a {
      text-decoration: none; color: var(--muted); font-size: 0.82rem;
      letter-spacing: 0.09em; text-transform: uppercase; font-weight: 500;
      position: relative; padding-bottom: 4px; transition: color 0.3s;
    }
    .nav-links a::after {
      content: ''; position: absolute; left: 0; bottom: 0; width: 0; height: 1px;
      background: var(--primary); transition: width 0.3s;
    }
    .nav-links a:hover { color: var(--text); }
    .nav-links a:hover::after { width: 100%; }
    .nav-right { display: flex; align-items: center; gap: 18px; }

    .theme-toggle {
      width: 46px; height: 26px; border-radius: 20px;
      border: 1px solid var(--border-strong); background: var(--surface-2);
      position: relative; cursor: pointer; flex-shrink: 0;
    }
    .theme-toggle .knob {
      position: absolute; top: 2px; left: 2px; width: 20px; height: 20px; border-radius: 50%;
      background: var(--primary); display: flex; align-items: center; justify-content: center;
      color: var(--surface); font-size: 10px; transition: left 0.35s ease;
    }
    html[data-theme="dark"] .theme-toggle .knob { left: 22px; }

    .nav-cta {
      display: inline-flex; align-items: center; gap: 8px;
      border: 1px solid var(--primary); color: var(--text);
      text-decoration: none; font-size: 0.78rem; font-weight: 500;
      letter-spacing: 0.08em; text-transform: uppercase;
      padding: 11px 24px; border-radius: 2px;
      transition: background 0.3s, color 0.3s; white-space: nowrap;
    }
    .nav-cta:hover { background: var(--primary); color: var(--surface); }

    /* ══════════════ HERO ══════════════ */
    .hero { padding: 190px 6% 0; text-align: center; }
    .hero-kicker { justify-content: center; margin-bottom: 26px; }
    .hero-industry {
      border: 1px solid var(--border-strong); padding: 4px 14px; border-radius: 40px;
      font-size: 0.72rem; color: var(--muted); text-transform: none; letter-spacing: 0.02em; margin-left: 10px;
    }
    .hero-title, .hero-highlight {
      font-family: 'Cormorant Garamond', serif; font-weight: 500;
      font-size: clamp(2.6rem, 6vw, 5.2rem); line-height: 1.06; letter-spacing: -0.01em;
      display: block;
    }
    .hero-title { margin-bottom: 6px; }
    .hero-highlight { font-style: italic; margin-bottom: 22px; }
    .hero-subtitle {
      font-size: 0.82rem; font-weight: 500; letter-spacing: 0.24em; text-transform: uppercase;
      color: var(--muted); margin-bottom: 26px; display: block;
    }
    .hero-desc { max-width: 560px; margin: 0 auto 40px; color: var(--muted); font-size: 1.04rem; line-height: 1.85; }
    .hero-tagline {
      font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 1.15rem;
      color: var(--primary); margin-bottom: 40px;
    }
    .hero-tagline:empty { display: none; }
    .hero-actions { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin-bottom: 44px; }
    .btn-primary {
      display: inline-flex; align-items: center; gap: 10px;
      background: var(--primary); color: #fff;
      text-decoration: none; padding: 15px 34px; border-radius: 2px;
      font-size: 0.8rem; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase;
      border: 1px solid var(--primary); transition: transform 0.35s, box-shadow 0.35s; cursor: pointer;
    }
    .btn-primary:hover { transform: translateY(-3px); box-shadow: 0 16px 34px rgba(0,0,0,0.18); }
    .btn-ghost {
      display: inline-flex; align-items: center; gap: 10px;
      background: transparent; border: 1px solid var(--border-strong); color: var(--text);
      text-decoration: none; padding: 15px 34px; border-radius: 2px;
      font-size: 0.8rem; font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase;
      transition: border-color 0.35s, transform 0.35s; cursor: pointer;
    }
    .btn-ghost:hover { border-color: var(--primary); transform: translateY(-3px); }

    .hero-meta {
      display: flex; gap: 30px; flex-wrap: wrap; justify-content: center;
      border-top: 1px solid var(--border); padding-top: 26px; margin-bottom: 56px;
    }
    .hero-meta-item { display: flex; align-items: center; gap: 8px; }
    .hero-meta-item i { color: var(--primary); font-size: 12px; }
    .hero-meta-item span, .hero-meta-item a {
      font-size: 0.78rem; letter-spacing: 0.08em; text-transform: uppercase; color: var(--muted); text-decoration: none;
    }
    .hero-meta-item:empty, .hero-meta-item span:empty { display: none; }

    .hero-media { position: relative; max-width: 1180px; margin: 0 auto; border: 1px solid var(--border-strong); padding: 10px; }
    .hero-glow {
      position: absolute; top: 0; left: 50%; transform: translateX(-50%);
      width: 1100px; height: 620px; max-width: 140vw;
      background: radial-gradient(ellipse at center, color-mix(in srgb, var(--primary) 14%, transparent) 0%, transparent 68%);
      pointer-events: none; z-index: -1;
    }
    .hero-media-wrap { aspect-ratio: 16/8; overflow: hidden; position: relative; background: var(--surface-2); }
    .hero-media-wrap img, .hero-media-wrap video {
      width: 100%; height: 100%; object-fit: cover; position: absolute; inset: 0;
    }
    .hero-media-caption {
      position: absolute; bottom: 22px; left: 26px; display: flex; align-items: center; gap: 10px;
      background: color-mix(in srgb, var(--bg) 80%, transparent); backdrop-filter: blur(8px);
      border: 1px solid var(--border); padding: 8px 16px; font-size: 0.74rem;
      letter-spacing: 0.08em; text-transform: uppercase; color: var(--text); z-index: 2;
    }
    .hero-media-caption:empty, .hero-media-caption .cap-text:empty { display: none; }
    .hero-media-caption .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--primary); flex-shrink: 0; }

    /* ══════════════ MEDIA FALLBACK ══════════════
       Any content image whose upload never happened (or whose URL broke)
       degrades to a quiet icon placeholder instead of a broken-image
       glyph — see the fallback wiring at the bottom of the script. */
    .media-frame { position: relative; }
    .media-frame.media-empty { background: var(--surface-2); }
    .media-frame.media-empty img { display: none; }
    .media-frame.media-empty::after {
      content: '\\f03e'; font-family: 'Font Awesome 6 Free'; font-weight: 900;
      position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
      color: var(--muted-2); font-size: 1.8rem;
    }
    .avatar-fallback {
      width: 56px; height: 56px; border-radius: 50%; flex-shrink: 0;
      background: var(--surface-2); border: 1px solid var(--primary);
      display: flex; align-items: center; justify-content: center;
      font-family: 'Cormorant Garamond', serif; font-size: 1.3rem; font-weight: 600; color: var(--primary);
      float: left; margin: 0 16px 10px 0;
    }

    /* ══════════════ SERVICES BANNER ══════════════ */
    .services-banner {
      position: relative; aspect-ratio: 21/7; overflow: hidden;
      margin-bottom: 70px; border: 1px solid var(--border-strong);
    }
    .services-banner:not(.media-empty) { display: block; }
    .services-banner.media-empty { display: none; }
    .services-banner img { width: 100%; height: 100%; object-fit: cover; filter: saturate(0.85) brightness(0.62); }
    .services-banner-overlay {
      position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
      text-align: center; background: linear-gradient(180deg, rgba(10,13,18,0.15), rgba(10,13,18,0.55));
    }
    .services-banner-overlay .eyebrow { color: #fff; }
    .services-banner-overlay .eyebrow::before, .services-banner-overlay .eyebrow::after { background: rgba(255,255,255,0.6); }
    .services-banner-overlay h2 {
      font-family: 'Cormorant Garamond', serif; font-weight: 500; font-size: clamp(1.8rem, 3.2vw, 3rem);
      color: #fff; margin-top: 14px;
    }

    /* ══════════════ SECTION PRIMITIVES ══════════════ */
    .section-wrap { padding: 130px 6%; }
    .section-hdr { margin-bottom: 70px; }
    .section-hdr.center { text-align: center; }
    .section-label {
      display: inline-flex; align-items: center; gap: 7px;
      font-size: 0.72rem; font-weight: 600; letter-spacing: 0.13em;
      text-transform: uppercase; color: var(--primary); margin-bottom: 14px;
    }
    .section-hdr.center .section-label { justify-content: center; }
    .section-heading {
      font-family: 'Cormorant Garamond', serif; font-weight: 500;
      font-size: clamp(2rem, 3.6vw, 3.4rem); line-height: 1.12; margin-bottom: 18px;
    }
    .section-sub { color: var(--muted); font-size: 1rem; max-width: 520px; line-height: 1.85; }
    .section-hdr.center .section-sub { margin: 0 auto; }
    .divider { height: 1px; background: linear-gradient(90deg, transparent, var(--border-strong) 20%, var(--border-strong) 80%, transparent); }

    /* ══════════════ ABOUT ══════════════ */
    .about-text { max-width: 720px; margin: 0 auto; text-align: center; }
    .about-text .section-sub { margin-left: auto; margin-right: auto; }
    .about-pills { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin: 30px 0; }
    .about-pill { border: 1px solid var(--border-strong); padding: 8px 16px; border-radius: 30px; font-size: 0.76rem; letter-spacing: 0.04em; color: var(--muted); }
    .about-pill i { color: var(--primary); margin-right: 6px; }
    .about-pill:empty { display: none; }
    .about-panels { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-top: 12px; }
    .about-panel { border-left: 1px solid var(--primary); padding: 4px 0 4px 20px; }
    .about-panel-label { font-size: 0.7rem; letter-spacing: 0.14em; text-transform: uppercase; color: var(--primary); margin-bottom: 8px; }
    .about-panel p { font-size: 0.92rem; color: var(--muted); line-height: 1.7; }
    .about-panel:has(p:empty) { display: none; }

    /* ══════════════ SERVICES ══════════════ */
    .services-grid {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 0;
      border-top: 1px solid var(--border); border-left: 1px solid var(--border);
      counter-reset: service;
    }
    .service-card {
      counter-increment: service;
      border-right: 1px solid var(--border); border-bottom: 1px solid var(--border);
      padding: 46px 38px; position: relative; transition: background 0.4s;
    }
    .service-card::before {
      content: counter(service, decimal-leading-zero);
      font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 0.95rem;
      color: var(--primary); margin-bottom: 22px; display: block;
    }
    .service-card:hover { background: var(--surface); }
    .service-img-wrap { aspect-ratio: 4/3; overflow: hidden; margin-bottom: 26px; }
    .service-image { width: 100%; height: 100%; object-fit: cover; filter: saturate(0.92) brightness(0.96); transition: transform 0.6s, filter 0.4s; }
    .service-card:hover .service-image { transform: scale(1.06); filter: saturate(1) brightness(1); }
    .service-content h3 { font-family: 'Cormorant Garamond', serif; font-size: 1.4rem; font-weight: 600; margin-bottom: 12px; }
    .service-content p { font-size: 0.92rem; color: var(--muted); line-height: 1.75; }
    @media(max-width:960px){ .services-grid { grid-template-columns: 1fr 1fr; } }
    @media(max-width:680px){ .services-grid { grid-template-columns: 1fr; } }

    /* ══════════════ VIDEOS ══════════════
       generateVideos() (shared across all three layouts) emits its own
       <section class="section"> wrapper directly — not an #videos id —
       so these are plain class selectors, matched to its actual markup. */
    .section { padding: 130px 6%; }
    .section-title {
      font-family: 'Cormorant Garamond', serif; font-weight: 500; text-align: center;
      font-size: clamp(2rem, 3.6vw, 3.4rem); margin-bottom: 60px;
    }
    .videos-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 26px; }
    .video-card { border: 1px solid var(--border); background: var(--surface); transition: transform 0.4s, border-color 0.4s; }
    .video-card:hover { transform: translateY(-6px); border-color: var(--primary); }
    .video-thumbnail { position: relative; aspect-ratio: 16/9; overflow: hidden; background: var(--surface-2); display: flex; align-items: center; justify-content: center; font-size: 2rem; }
    .video-thumbnail img { width: 100%; height: 100%; object-fit: cover; }
    .play-icon { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(10,13,18,0.32); font-size: 1rem; }
    .video-content { padding: 22px 24px 26px; }
    .video-content h3 { font-family: 'Cormorant Garamond', serif; font-size: 1.15rem; font-weight: 600; margin-bottom: 8px; }
    .video-content p { font-size: 0.88rem; color: var(--muted); margin-bottom: 14px; line-height: 1.7; }
    .video-link { font-size: 0.74rem; letter-spacing: 0.1em; text-transform: uppercase; color: var(--primary); text-decoration: none; }

    /* ══════════════ CONTACT ══════════════ */
    .contact-grid { display: grid; grid-template-columns: 0.9fr 1.1fr; gap: 70px; align-items: start; }
    .contact-cards { display: flex; flex-direction: column; gap: 1px; background: var(--border); border: 1px solid var(--border); }
    .contact-card { display: flex; align-items: flex-start; gap: 18px; background: var(--surface); padding: 24px 26px; }
    .contact-icon {
      width: 40px; height: 40px; border: 1px solid var(--secondary); border-radius: 50%;
      display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: var(--primary);
    }
    .contact-lbl { font-size: 0.68rem; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); margin-bottom: 5px; }
    .contact-val { font-size: 0.98rem; }
    .contact-cta { border: 1px solid var(--border-strong); padding: 50px 44px; position: relative; }
    .contact-cta::before { content: ''; position: absolute; top: -1px; left: -1px; width: 48px; height: 48px; border-top: 1px solid var(--primary); border-left: 1px solid var(--primary); }
    .contact-cta::after { content: ''; position: absolute; bottom: -1px; right: -1px; width: 48px; height: 48px; border-bottom: 1px solid var(--primary); border-right: 1px solid var(--primary); }
    .contact-cta h3 { font-family: 'Cormorant Garamond', serif; font-size: 2rem; font-weight: 500; margin-bottom: 16px; }
    .contact-cta p { color: var(--muted); font-size: 0.96rem; line-height: 1.8; margin-bottom: 30px; }
    .contact-socials { display: flex; gap: 12px; margin-top: 28px; }
    .social-btn {
      width: 42px; height: 42px; border: 1px solid var(--border-strong); border-radius: 50%;
      display: flex; align-items: center; justify-content: center; color: var(--muted);
      text-decoration: none; transition: border-color 0.3s, color 0.3s;
    }
    .social-btn:hover { border-color: var(--primary); color: var(--primary); }

    /* ══════════════ FOOTER ══════════════ */
    .footer { padding: 60px 6% 40px; text-align: center; border-top: 1px solid var(--border); }
    .footer-brand { display: flex; align-items: center; justify-content: center; gap: 12px; margin-bottom: 8px; }
    .footer-tagline { font-family: 'Cormorant Garamond', serif; font-style: italic; color: var(--primary); font-size: 1rem; margin-bottom: 30px; }
    .footer-tagline:empty { display: none; }
    .footer-socials { display: flex; justify-content: center; gap: 12px; margin-bottom: 30px; }
    .footer-copy { font-size: 0.78rem; color: var(--muted-2); letter-spacing: 0.03em; line-height: 1.8; }

    /* ══════════════ REVEAL ══════════════ */
    .reveal { opacity: 0; transform: translateY(28px); transition: opacity 0.9s ease, transform 0.9s ease; }
    .reveal.visible { opacity: 1; transform: translateY(0); }
    .d1{transition-delay:.08s}.d2{transition-delay:.16s}.d3{transition-delay:.24s}.d4{transition-delay:.32s}.d5{transition-delay:.4s}
    @media(prefers-reduced-motion:reduce){ .reveal{ opacity:1; transform:none; transition:none; } }

    /* ══════════════ RESPONSIVE ══════════════ */
    @media(max-width:960px){
      .contact-grid { grid-template-columns: 1fr; }
    }
    @media(max-width:680px){
      .nav-links { display: none; }
      .hero { padding: 150px 6% 0; }
    }
  </style>
</head>
<body>

  <!-- ═══ NAV ═══ -->
  <nav class="navbar" id="navbar">
    <a href="#" class="logo">
      {{logoImageTag}}
      <span class="logo-name">{{company}}</span>
    </a>
    <div class="nav-links">
      <a href="#about">About</a>
      <a href="#services">Services</a>
      <a href="#videos">Insights</a>
      <a href="#contact">Contact</a>
    </div>
    <div class="nav-right">
      <button class="theme-toggle" id="themeToggle" aria-label="Toggle dark mode">
        <span class="knob"><i class="fas fa-sun" id="themeIcon"></i></span>
      </button>
      <a href="#contact" class="nav-cta">Get in Touch</a>
    </div>
  </nav>

  <!-- ═══ HERO ═══ -->
  <section class="hero">
    <div class="hero-kicker eyebrow center reveal">{{businessCategory}}<span class="hero-industry">{{industry}}</span></div>
    <span class="hero-title reveal d1">{{heroTitle}}</span>
    <span class="hero-highlight grad-text reveal d1">{{heroHighlight}}</span>
    <span class="hero-subtitle reveal d2">{{heroSubtitle}}</span>
    <p class="hero-tagline reveal d2">{{tagline}}</p>
    <p class="hero-desc reveal d3">{{heroDescription}}</p>
    <div class="hero-actions reveal d4">
      <a href="#contact" class="btn-primary">Book a Consultation</a>
      <a href="#services" class="btn-ghost">Our Services</a>
    </div>
    <div class="hero-meta reveal d4">
      <div class="hero-meta-item"><i class="fas fa-tag"></i><span>{{expertise}}</span></div>
      <div class="hero-meta-item"><i class="fas fa-map-marker-alt"></i><span>{{city}}</span></div>
      <div class="hero-meta-item"><i class="fas fa-globe"></i><a href="{{website}}" target="_blank" rel="noopener noreferrer">Visit Website</a></div>
    </div>
    <div class="hero-media reveal d5">
      <div class="hero-glow"></div>
      <div class="hero-media-wrap media-frame" id="heroMediaWrap">
        {{heroVideo}}
        <img id="heroImg" src="{{heroImage}}" alt="{{company}}" />
        <div class="hero-media-caption"><span class="dot"></span><span class="cap-text">{{tagline}}</span></div>
      </div>
    </div>
  </section>

  <!-- ═══ ABOUT ═══ -->
  <section id="about">
    <div class="section-wrap">
      <div class="about-text">
        <div class="eyebrow center reveal"><i class="fas fa-address-card"></i>&nbsp;About Us</div>
        <h2 class="section-heading reveal d1">About <span class="grad-text">{{company}}</span></h2>
        <p class="section-sub reveal d2">{{about}}</p>
        <div class="about-pills reveal d3">
          <span class="about-pill">{{businessCategory}}</span>
          <span class="about-pill">{{industry}}</span>
          <span class="about-pill">{{expertise}}</span>
          <span class="about-pill">{{city}}</span>
        </div>
        <div class="about-panels reveal d4">
          <div class="about-panel">
            <div class="about-panel-label">What Makes Us Unique</div>
            <p>{{uniqueBusiness}}</p>
          </div>
          <div class="about-panel">
            <div class="about-panel-label">Growth Opportunities</div>
            <p>{{growthOpportunities}}</p>
          </div>
        </div>
      </div>
    </div>
  </section>

  <div class="divider"></div>

  <!-- ═══ SERVICES ═══ -->
  <section id="services">
    <div class="section-wrap" style="padding-bottom:0;">
      <div class="services-banner media-frame">
        <img src="{{servicesImage}}" alt="{{company}} services" />
        <div class="services-banner-overlay">
          <div class="eyebrow center">What We Offer</div>
          <h2>Our Services</h2>
        </div>
      </div>
    </div>
    <div class="section-wrap" style="padding-top:0;">
      <div class="section-hdr center reveal">
        <div class="section-label"><i class="fas fa-bolt"></i> What We Offer</div>
        <h2 class="section-heading">Our <span class="grad-text">Services</span></h2>
      </div>
      <div class="services-grid reveal">
        {{services}}
      </div>
    </div>
  </section>

  {{videoSection}}

  <div class="divider"></div>

  <!-- ═══ CONTACT ═══ -->
  <section id="contact">
    <div class="section-wrap">
      <div class="section-hdr reveal">
        <div class="section-label"><i class="fas fa-headset"></i> Reach Out</div>
        <h2 class="section-heading">Start the <span class="grad-text">Conversation</span></h2>
        <p class="section-sub">Tell us about your business — we'd love to help.</p>
      </div>
      <div class="contact-grid">
        <div class="contact-cards reveal d1">
          <div class="contact-card">
            <div class="contact-icon"><i class="fas fa-envelope"></i></div>
            <div><div class="contact-lbl">Email</div><div class="contact-val">{{email}}</div></div>
          </div>
          <div class="contact-card">
            <div class="contact-icon"><i class="fas fa-phone-alt"></i></div>
            <div><div class="contact-lbl">Phone</div><div class="contact-val">{{phone}}</div></div>
          </div>
          <div class="contact-card">
            <div class="contact-icon"><i class="fas fa-location-dot"></i></div>
            <div><div class="contact-lbl">Address</div><div class="contact-val">{{address}}</div></div>
          </div>
        </div>
        <div class="contact-cta reveal d2">
          <h3>Let's Build Your Next Chapter</h3>
          <p>Whether it's a single decision or a full strategic overhaul, we'd love to hear about your goals and how <strong>{{company}}</strong> can help.</p>
          <a href="mailto:{{email}}" class="btn-primary">Send a Message</a>
          <div class="contact-socials">
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
      <span class="logo-name">{{company}}</span>
    </div>
    <div class="footer-tagline">{{tagline}}</div>
    <div class="footer-socials">
      <a href="{{website}}" target="_blank" rel="noopener noreferrer" class="social-btn"><i class="fas fa-globe"></i></a>
      <a href="{{linkedin}}" target="_blank" rel="noopener noreferrer" class="social-btn"><i class="fab fa-linkedin-in"></i></a>
      <a href="{{instagram}}" target="_blank" rel="noopener noreferrer" class="social-btn"><i class="fab fa-instagram"></i></a>
    </div>
    <div class="footer-copy">&copy; {{company}} &middot; {{footerInfo}} &middot; {{city}}<br/>{{industry}} &middot; {{businessCategory}}</div>
  </footer>

  <script>
    /* ════════════════════════════════
       NAV SCROLL
    ════════════════════════════════ */
    const nav = document.getElementById('navbar');
    window.addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 30));

    /* ════════════════════════════════
       THEME TOGGLE — {{colorMode}} sets the member's chosen default
       (baked into data-theme on <html> above); a visitor's own toggle
       is remembered in their browser and wins on repeat visits.
    ════════════════════════════════ */
    const root = document.documentElement;
    const toggle = document.getElementById('themeToggle');
    const icon = document.getElementById('themeIcon');
    function applyTheme(t) {
      root.setAttribute('data-theme', t);
      icon.className = t === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
      try { localStorage.setItem('site-theme', t); } catch (e) {}
    }
    let savedTheme = null;
    try { savedTheme = localStorage.getItem('site-theme'); } catch (e) {}
    applyTheme(savedTheme || root.getAttribute('data-theme') || 'light');
    toggle.addEventListener('click', () => {
      applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
    });

    /* ════════════════════════════════
       MEDIA FALLBACKS
       A member's incomplete profile (missing photo, broken upload URL,
       an unfilled {{placeholder}} left as literal text) degrades to a
       quiet icon placeholder instead of a broken-image glyph.
    ════════════════════════════════ */
    function isRealSrc(src) {
      return !!src && src.trim() !== '' && !/^\\{\\{.*\\}\\}$/.test(src.trim());
    }
    function mediaFallback(img) {
      const frame = img.closest('.media-frame');
      if (frame) frame.classList.add('media-empty');
      else img.style.display = 'none';
    }
    function avatarFallback(img) {
      const name = img.getAttribute('alt') || '?';
      const fb = document.createElement('div');
      fb.className = 'avatar-fallback';
      fb.textContent = name.trim().charAt(0).toUpperCase() || '?';
      img.replaceWith(fb);
    }
    document.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src') || '';
      const onFail = () => img.classList.contains('testimonial-avatar') ? avatarFallback(img) : mediaFallback(img);
      if (!isRealSrc(src)) { onFail(); return; }
      img.addEventListener('error', onFail);
      if (img.complete && img.naturalWidth === 0) onFail();
    });

    /* Hero video takes priority over the fallback image — both are
       absolutely positioned in the same box. */
    (function () {
      const wrap = document.getElementById('heroMediaWrap');
      const heroImg = document.getElementById('heroImg');
      if (!wrap || !heroImg) return;
      if (wrap.querySelector('video')) heroImg.style.display = 'none';
    })();

    /* Empty-field collapse — {{placeholder}} tokens the member left
       blank get replaced with '' by the backend, so hide the row/pill/
       panel instead of showing a bare icon or empty line. */
    document.querySelectorAll('.hero-meta-item span, .about-pill, .about-panel p, .hero-tagline, .footer-tagline, .cap-text')
      .forEach(el => { if (!el.textContent.trim()) (el.closest('.about-panel') || el).style.display = 'none'; });

    /* Services banner — hide the whole strip if no image was uploaded. */
    (function () {
      const banner = document.querySelector('.services-banner');
      if (banner && banner.classList.contains('media-empty')) banner.style.display = 'none';
    })();

    /* ════════════════════════════════
       SCROLL REVEAL
    ════════════════════════════════ */
    const revObs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => revObs.observe(el));
    setTimeout(() => document.querySelectorAll('.hero .reveal').forEach(el => el.classList.add('visible')), 80);
  </script>

</body>
</html>
`;
