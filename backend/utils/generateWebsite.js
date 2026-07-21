// const modern = require('../layouts/service-modern');

// const layouts = {
//   modern,
// };

// const generateServices = services => {

//   if (!services?.length) {
//     return '';
//   }

//   return services.map(service => `

//     <div class="service-card">

//       <h3>
//         ${service.title}
//       </h3>

//       <p>
//         ${service.description}
//       </p>

//     </div>

//   `).join('');
// };

// const generateContact = contacts => {

//   if (!contacts?.length) {
//     return '';
//   }

//   return contacts.map(contact => `

//     <div>

//       <p>
//         ${contact.email}
//       </p>

//       <p>
//         ${contact.phone}
//       </p>

//       <p>
//         ${contact.address}
//       </p>

//     </div>

//   `).join('');
// };

// const generateWebsite = data => {

//   let html = layouts[data.layoutId || 'modern'];

//   html = html.replace(
//     /{{company}}/g,
//     data.company || ''
//   );

//   html = html.replace(
//     /{{heroTitle}}/g,
//     data.heroTitle || ''
//   );

//   html = html.replace(
//     /{{heroHighlight}}/g,
//     data.heroHighlight || ''
//   );

//   html = html.replace(
//     /{{heroDescription}}/g,
//     data.heroDescription || ''
//   );

//   html = html.replace(
//     /{{about}}/g,
//     data.about || ''
//   );

//   html = html.replace(
//     /{{services}}/g,
//     generateServices(data.serviceItems)
//   );

//   html = html.replace(
//     /{{contact_section}}/g,
//     generateContact(data.contactItems)
//   );

//   return html;
// };

// module.exports = generateWebsite;

const serviceLayout = require("../layouts/service-modern");

const ecommerceLayout = require("../layouts/ecommerce-modern");

const hybridLayout = require("../layouts/hybrid-modern");

// ================= IMAGE URL HELPER =================
const getProperImageUrl = (image, apiBaseUrl = "") => {
  if (!image) return "";

  if (typeof image === "object" && image.uri) {
    const uri = image.uri;
    if (uri.startsWith("http://") || uri.startsWith("https://")) {
      return uri;
    }

    if (uri.startsWith("file://") || uri.startsWith("content://")) {
      return "";
    }

    if (uri.includes("/uploads/")) {
      return `${apiBaseUrl}${uri.startsWith("/") ? "" : "/"}${uri}`;
    }

    return "";
  }

  if (typeof image === "string") {
    if (image.startsWith("http://") || image.startsWith("https://")) {
      return image;
    }

    if (image.startsWith("file://") || image.startsWith("content://")) {
      return "";
    }

    if (image.includes("/uploads/")) {
      return `${apiBaseUrl}${image.startsWith("/") ? "" : "/"}${image}`;
    }

    return "";
  }

  return "";
};

// ================= SERVICES =================

const generateServices = (services, apiBaseUrl = "") => {
  if (!services?.length) return "";

  return services
    .map(
      (service) => `

    <div class="service-card">

      <img
        src="${getProperImageUrl(service.image, apiBaseUrl)}"
        alt="${service.title || "Service"}"
        class="service-image"
        loading="lazy"
        style="width:100%;height:250px;object-fit:cover;border-radius:12px;"
      />

      <div class="service-content">

        <h3>
          ${service.title}
        </h3>

        <p>
          ${service.description}
        </p>

      </div>

    </div>

  `,
    )
    .join("");
};

// ================= PRODUCTS =================

const generateProducts = (products, apiBaseUrl = "") => {
  if (!products?.length) return "";

  return products
    .map(
      (product) => `

    <div class="product-card">

      <img
        src="${getProperImageUrl(product.image, apiBaseUrl)}"
        alt="${product.title || "Product"}"
        class="product-image"
        loading="lazy"
        style="width:100%;height:250px;object-fit:cover;border-radius:12px;"
      />

      <div class="product-content">

        <h3>
          ${product.title}
        </h3>

        <p>
          ${product.description}
        </p>

        <div class="price">

          ₹${product.price}

        </div>

        <button class="buy-btn">
          Buy Now
        </button>

      </div>

    </div>

  `,
    )
    .join("");
};

// ================= TESTIMONIALS =================

const generateTestimonials = (testimonials, apiBaseUrl = "") => {
  if (!testimonials?.length) return "";

  return testimonials
    .map(
      (item) => `

    <div class="testimonial-card">

      <img
        src="${getProperImageUrl(item.image, apiBaseUrl)}"
        alt="${item.name || "Testimonial"}"
        class="testimonial-avatar"
        loading="lazy"
        style="width:80px;height:80px;border-radius:50%;object-fit:cover;"
      />

      <h3>
        ${item.name}
      </h3>

      <span>
        ${item.role}
      </span>

      <p>
        ${item.review}
      </p>

    </div>

  `,
    )
    .join("");
};

// ================= FAQ =================

const generateFAQ = (faqs) => {
  if (!faqs?.length) return "";

  return faqs
    .map(
      (item) => `

    <div class="faq-card">

      <h3>
        ${item.question}
      </h3>

      <p>
        ${item.answer}
      </p>

    </div>

  `,
    )
    .join("");
};

// ================= VIDEOS =================

const generateVideos = (videos, apiBaseUrl = "") => {
  if (!videos?.length) return "";

  const videoCards = videos
    .map((video) => {
      const videoUrl =
        video.videoUrl || (video.video && video.video.uri) || video.video || "";
      const thumbnail = video.thumbnail?.uri || video.thumbnail || "";

      if (!videoUrl) return "";

      return `

    <div class="video-card">

      <div class="video-thumbnail">

        ${
          thumbnail
            ? `<img 
              src="${getProperImageUrl(thumbnail, apiBaseUrl)}" 
              alt="${video.title || "Video"}" 
              style="width:100%;height:200px;object-fit:cover;border-radius:12px;"
              loading="lazy"
            />`
            : "🎬"
        }

        <div class="play-icon">▶️</div>

      </div>

      <div class="video-content">

        <h3>${video.title}</h3>

        <p>${video.description || ""}</p>

        <a
          href="${videoUrl}"
          target="_blank"
          class="video-link"
        >
          Watch Video →
        </a>

      </div>

    </div>

  `;
    })
    .join("");

  return `

    <section class="section">

      <h2 class="section-title">
        Promotional Videos
      </h2>

      <div class="videos-grid">

        ${videoCards}

      </div>

    </section>

  `;
};

const generateHeroVideo = (heroVideo, apiBaseUrl = "") => {
  if (!heroVideo) return "";

  const videoUrl =
    typeof heroVideo === "string" ? heroVideo : heroVideo.uri || "";

  if (!videoUrl) return "";

  const resolvedUrl = getProperImageUrl(videoUrl, apiBaseUrl);
  if (!resolvedUrl) return "";

  return `

    <video controls autoplay muted loop playsinline>
      <source src="${resolvedUrl}" type="video/mp4" />
      Your browser does not support the video tag.
    </video>

  `;
};

// ================= CONTACT =================

const generateContacts = (contacts) => {
  if (!contacts?.length) return "";

  return contacts
    .map(
      (contact) => `

    <div class="contact-card">

      <p>
        📧 ${contact.email}
      </p>

      <p>
        📱 ${contact.phone}
      </p>

      <p>
        📍 ${contact.address}
      </p>

    </div>

  `,
    )
    .join("");
};

// ================= WEBSITE =================

const generateWebsiteHtml = (data, apiBaseUrl = "") => {
  let html = "";

  // ================= WEBSITE TYPE =================

  if (data.websiteMode === "product") {
    html = ecommerceLayout;
  } else if (data.websiteMode === "both") {
    html = hybridLayout;
  } else {
    html = serviceLayout;
  }

  // ================= BASIC =================

  html = html.replace(/{{company}}/g, data.company || "");

  html = html.replace(/{{heroTitle}}/g, data.heroTitle || "");

  html = html.replace(/{{heroHighlight}}/g, data.heroHighlight || "");

  html = html.replace(/{{heroSubtitle}}/g, data.heroSubtitle || "");

  html = html.replace(/{{heroDescription}}/g, data.heroDescription || "");

  html = html.replace(/{{about}}/g, data.about || "");

  html = html.replace(/{{theme}}/g, (data.theme || "Modern").toLowerCase());

  html = html.replace(/{{footerInfo}}/g, data.footerInfo || "");

  html = html.replace(/{{primaryColor}}/g, data.primaryColor || "#7c5cff");

  html = html.replace(/{{secondaryColor}}/g, data.secondaryColor || "#06b6d4");

  // ================= LOGO & HERO IMAGES =================

  const logoUrl = getProperImageUrl(data.logo, apiBaseUrl);
  const heroImageUrl = getProperImageUrl(data.heroImage, apiBaseUrl);
  const servicesImageUrl = getProperImageUrl(data.servicesImage, apiBaseUrl);
  const aboutImageUrl = getProperImageUrl(data.aboutImage, apiBaseUrl);

  // Create logo image tag
  const logoImageTag = logoUrl
    ? `<img src="${logoUrl}" alt="${data.company || "Logo"}" style="max-height:50px;max-width:150px;object-fit:contain;" loading="lazy" />`
    : "";

  html = html.replace(/{{logoImageTag}}/g, logoImageTag);
  html = html.replace(/{{logo}}/g, logoUrl);
  html = html.replace(/{{logoUrl}}/g, logoUrl);
  html = html.replace(/{{heroImage}}/g, heroImageUrl);
  html = html.replace(/{{servicesImage}}/g, servicesImageUrl);
  html = html.replace(/{{aboutImage}}/g, aboutImageUrl);

  // ================= PROFILE FIELDS =================

  html = html.replace(/{{expertise}}/g, data.expertise || "");

  html = html.replace(/{{tagline}}/g, data.tagline || "");

  html = html.replace(
    /{{growthOpportunities}}/g,
    data.growthOpportunities || "",
  );

  html = html.replace(/{{uniqueBusiness}}/g, data.uniqueBusiness || "");

  html = html.replace(/{{industry}}/g, data.industry || "");

  html = html.replace(/{{businessCategory}}/g, data.businessCategory || "");

  html = html.replace(/{{website}}/g, data.website || "#");

  html = html.replace(/{{linkedin}}/g, data.linkedin || "#");

  html = html.replace(/{{instagram}}/g, data.instagram || "#");

  html = html.replace(/{{city}}/g, data.city || "");

  html = html.replace(/{{email}}/g, data.contactItems?.[0]?.email || "");

  html = html.replace(/{{phone}}/g, data.contactItems?.[0]?.phone || "");

  html = html.replace(/{{address}}/g, data.contactItems?.[0]?.address || "");

  // ================= DYNAMIC CONTENT =================

  html = html.replace(
    /{{services}}/g,
    generateServices(data.serviceItems, apiBaseUrl),
  );

  html = html.replace(
    /{{products}}/g,
    generateProducts(data.productItems, apiBaseUrl),
  );

  html = html.replace(
    /{{testimonials}}/g,
    generateTestimonials(data.testimonialItems, apiBaseUrl),
  );

  html = html.replace(/{{contacts}}/g, generateContacts(data.contactItems));

  html = html.replace(
    /{{heroVideo}}/g,
    generateHeroVideo(data.heroVideo, apiBaseUrl),
  );

  html = html.replace(
    /{{videoSection}}/g,
    generateVideos(data.videoItems, apiBaseUrl),
  );

  return html;
};

module.exports = generateWebsiteHtml;
