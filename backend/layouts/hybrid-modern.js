module.exports = `

<!DOCTYPE html>

<html data-theme="{{theme}}">

<head>

<meta charset="UTF-8"/>

<meta
  name="viewport"
  content="width=device-width, initial-scale=1.0"
/>

<title>{{company}}</title>

<style>

:root {
  --bg: #050816;
  --bg-secondary: #0b1120;
  --card: rgba(17, 25, 40, 0.72);
  --text: #ffffff;
  --text-light: #94a3b8;
  --primary: {{primaryColor}};
  --secondary: {{secondaryColor}};
  --border: rgba(255, 255, 255, 0.08);
  --glass: rgba(255, 255, 255, 0.05);
  --shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  --gradient: linear-gradient(135deg, {{primaryColor}}, {{secondaryColor}});
}

[data-theme="light"] {
  --bg: #f5f7fb;
  --bg-secondary: #ffffff;
  --card: rgba(255, 255, 255, 0.85);
  --text: #0f172a;
  --text-light: #475569;
  --primary: {{primaryColor}};
  --secondary: {{secondaryColor}};
  --border: rgba(15, 23, 42, 0.08);
  --glass: rgba(255, 255, 255, 0.72);
  --shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
  --gradient: linear-gradient(135deg, {{primaryColor}}, {{secondaryColor}});
}

[data-theme="faint"] {
  --bg: #f8fafc;
  --bg-secondary: #ffffff;
  --card: rgba(255, 255, 255, 0.95);
  --text: #64748b;
  --text-light: #94a3b8;
  --primary: {{primaryColor}};
  --secondary: {{secondaryColor}};
  --border: rgba(203, 213, 225, 0.5);
  --glass: rgba(255, 255, 255, 0.85);
  --shadow: 0 12px 32px rgba(203, 213, 225, 0.15);
  --gradient: linear-gradient(135deg, {{primaryColor}}, {{secondaryColor}});
}

*{
  margin:0;
  padding:0;
  box-sizing:border-box;
}

body{

  font-family:Arial;

  background: var(--bg);

  color:white;

  overflow-x:hidden;

}

.hero{

  min-height:100vh;

  display:flex;

  align-items:center;

  justify-content:center;

  padding:80px;

  text-align:center;

  background:
  radial-gradient(
    circle at top right,
    rgba(124,92,255,0.35),
    transparent 30%
  );

}

.hero-content{

  max-width:900px;

}

.hero h1{

  font-size:90px;

  line-height:1;

  font-weight:900;

}

.gradient{

  background:
  linear-gradient(
    135deg,
    {{primaryColor}},
    {{secondaryColor}}
  );

  -webkit-background-clip:text;

  -webkit-text-fill-color:transparent;

}

.hero p{

  margin-top:30px;

  font-size:20px;

  color:#9ca3af;

  line-height:1.7;

}

.company-name{

  display:inline-flex;

  align-items:center;

  justify-content:center;

  margin-top:22px;

  padding:12px 22px;

  border-radius:999px;

  border:1px solid rgba(255,255,255,0.18);

  background:rgba(124,92,255,0.12);

  color:#ffffff;

  font-size:19px;

  font-weight:800;

  letter-spacing:0.07em;

  text-transform:uppercase;

  box-shadow:0 16px 35px rgba(124,92,255,0.14);

  animation:companyPulse 4s ease-in-out infinite alternate;

}

@keyframes companyPulse{

  from{

    transform:translateY(0);

    opacity:0.9;

  }

  to{

    transform:translateY(-3px);

    opacity:1;

  }

}

.services-grid,
.products-grid{

  display:grid;

  grid-template-columns:
  repeat(auto-fit,minmax(300px,1fr));

  gap:30px;

}

.service-card,
.product-card{

  background:
  rgba(255,255,255,0.05);

  border-radius:30px;

  overflow:hidden;

  transition:0.35s ease;

  backdrop-filter:blur(20px);

  border:1px solid
  rgba(255,255,255,0.08);

}

.service-card:hover,
.product-card:hover{

  transform:
  translateY(-12px)
  scale(1.03);

  box-shadow:
  0 30px 60px
  rgba(124,92,255,0.35);

}

.service-image,
.product-image{

  width:100%;

  height:240px;

  object-fit:cover;

}

.service-content,
.product-content{

  padding:28px;

}

.price{

  font-size:28px;

  font-weight:900;

  color:#7c5cff;

  margin-top:15px;

}

.buy-btn{

  width:100%;

  margin-top:20px;

  padding:16px;

  border:none;

  border-radius:16px;

  background:
  linear-gradient(
    135deg,
    {{primaryColor}},
    {{secondaryColor}}
  );

  color:white;

  font-weight:700;

}

.contact-card{

  background:
  rgba(255,255,255,0.05);

  padding:30px;

  border-radius:30px;

  margin-top:20px;

}

/* ================= TESTIMONIALS ================= */

.testimonials-section{

  background:
  linear-gradient(
    135deg,
    rgba(124,92,255,0.05),
    rgba(6,182,212,0.05)
  );

  border-radius: 40px;

  margin: 40px 0;

  padding: 80px 40px;

}

.testimonials-grid{

  display:grid;

  grid-template-columns:
  repeat(auto-fit,minmax(350px,1fr));

  gap:32px;

  width:100%;

}

.testimonial-card{

  width:100%;

  background:#ffffff;

  border-radius:32px;

  padding:32px;

  position:relative;

  box-shadow:
  0 20px 60px rgba(0,0,0,0.1);

  border:1px solid rgba(255,255,255,0.2);

  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);

  overflow:hidden;

}

.testimonial-card::before{

  content:'';

  position:absolute;

  top:0;

  left:0;

  right:0;

  height:4px;

  background:
  linear-gradient(
    90deg,
    {{primaryColor}},
    {{secondaryColor}}
  );

}

.testimonial-card:hover{

  transform:
  translateY(-12px)
  scale(1.02);

  box-shadow:
  0 40px 100px rgba(124,92,255,0.25);

}

.testimonial-avatar{

  width:80px;

  height:80px;

  border-radius:50%;

  object-fit:cover;

  border:4px solid {{primaryColor}};

  margin-bottom:20px;

}

.testimonial-card h3{

  font-size:22px;

  font-weight:800;

  color:#111827;

  margin-bottom:8px;

}

.testimonial-card span{

  color:#6b7280;

  font-size:14px;

  font-weight:600;

  margin-bottom:16px;

  display:block;

}

.testimonial-card p{

  color:#374151;

  line-height:1.8;

  font-size:16px;

  font-style:italic;

  position:relative;

}

.testimonial-card p::before{

  content:'"';

  font-size:60px;

  color:{{primaryColor}};

  position:absolute;

  top:-20px;

  left:-10px;

  font-family:Georgia,serif;

  opacity:0.3;

}

.testimonial-card p::after{

  content:'"';

  font-size:60px;

  color:{{primaryColor}};

  position:absolute;

  bottom:-40px;

  right:-10px;

  font-family:Georgia,serif;

  opacity:0.3;

}

/* ================= CONTACT SECTION ================= */

.contact-section{

  background:#111827;

  color:white;

  border-radius:40px;

  margin:40px 0;

  padding:80px 40px;

}

.contact-section .section-title{

  color:white;

  margin-bottom:40px;

}

</style>

</head>

<body>

<section class="hero">

  <div class="hero-content">

    <h1>

      {{heroTitle}}

      <span class="gradient">

        {{heroHighlight}}

      </span>

    </h1>

    <p class="company-name">

      {{company}}

    </p>

    <p>

      {{heroDescription}}

    </p>

  </div>

</section>

<div class="section hero-video-section">

  {{heroVideo}}

  {{videoSection}}

</div>

<section class="section">

  <h2 class="section-title">

    Our Services

  </h2>

  <div class="services-grid">

    {{services}}

  </div>

</section>

<section class="section">

  <h2 class="section-title">

    Featured Products

  </h2>

  <div class="products-grid">

    {{products}}

  </div>

</section>

<section class="section">

  <h2 class="section-title">

    About Us

  </h2>

  <p
    style="
      max-width:900px;
      margin:auto;
      color:#9ca3af;
      line-height:2;
      font-size:18px;
      text-align:center;
    "
  >

    {{about}}

  </p>

</section>

<section class="section testimonials-section">


  <div class="testimonials-grid">

    {{testimonials}}

  </div>

</section>

<section class="section contact-section">

  <h2 class="section-title">

    Get In Touch

  </h2>

  {{contacts}}

</section>

</body>

</html>

`;
