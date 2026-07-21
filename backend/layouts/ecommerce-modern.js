module.exports = `

<!DOCTYPE html>

<html data-theme="{{theme}}">

<head>

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

body{
  margin:0;
  background: var(--bg);
  color: var(--text);
  font-family:Arial;
}

.hero{

  padding:120px 40px;

  text-align:center;

}

.company-name{

  display:inline-flex;

  align-items:center;

  justify-content:center;

  margin-top:22px;

  padding:12px 22px;

  border-radius:999px;

  border:1px solid rgba(255,255,255,0.18);

  background:rgba(59,130,246,0.12);

  color:#ffffff;

  font-size:19px;

  font-weight:800;

  letter-spacing:0.08em;

  text-transform:uppercase;

  box-shadow:0 15px 32px rgba(59,130,246,0.16);

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

.products-grid{

  display:grid;

  grid-template-columns:
  repeat(auto-fit,minmax(280px,1fr));

  gap:30px;

}

.product-card{

  background:#111827;

  border-radius:30px;

  overflow:hidden;

  transition:0.35s ease;

}

.product-card:hover{

  transform:
  translateY(-10px)
  scale(1.03);

}

.product-image{

  width:100%;

  height:260px;

  object-fit:cover;

}

.product-content{

  padding:24px;

}

.buy-btn{

  width:100%;

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

  margin-top:20px;

}

.price{

  font-size:28px;

  color:#7c5cff;

  font-weight:900;

}

.old-price{

  text-decoration:line-through;

  color:#6b7280;

}

.testimonials-section{

  padding:100px 40px;

  background:#f8fafc;

  text-align:center;

}

.testimonials-section h2{

  color:#111827;

  font-size:36px;

  font-weight:900;

  margin-bottom:50px;

}

.testimonials-grid{

  display:grid;

  grid-template-columns:
  repeat(auto-fit,minmax(300px,1fr));

  gap:30px;

  max-width:1200px;

  margin:0 auto;

}

.testimonial-card{

  background:#ffffff;

  border-radius:20px;

  padding:30px;

  box-shadow:0 10px 30px rgba(0,0,0,0.1);

  transition:0.3s ease;

}

.testimonial-card:hover{

  transform:translateY(-5px);

  box-shadow:0 20px 40px rgba(0,0,0,0.15);

}

.testimonial-avatar{

  width:60px;

  height:60px;

  border-radius:50%;

  object-fit:cover;

  margin:0 auto 20px;

  display:block;

  border:3px solid {{primaryColor}};

}

.testimonial-card h3{

  font-size:18px;

  font-weight:700;

  color:#111827;

  margin-bottom:5px;

}

.testimonial-card span{

  color:#6b7280;

  font-size:14px;

  margin-bottom:15px;

  display:block;

}

.testimonial-card p{

  color:#374151;

  line-height:1.6;

  font-style:italic;

}

  <h1>

    {{heroTitle}}

  </h1>

  <p class="company-name">

    {{company}}

  </p>

  <p>

    {{heroDescription}}

  </p>

</section>

<div class="hero-video-section">

  {{heroVideo}}

  {{videoSection}}

</div>

<section class="products">

  <h2>

    Featured Products

  </h2>

  <div class="products-grid">

    {{products}}

  </div>

</section>

<section class="testimonials-section">

 

  <div class="testimonials-grid">

    {{testimonials}}

  </div>

</section>

</body>

</html>

`;
