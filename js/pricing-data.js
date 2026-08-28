/* ==========================================================================
   SUPPORT PRICING — the only place numbers live.

   >>> EVERY FIGURE BELOW IS A PLACEHOLDER. <<<
   They are structurally sensible but they are NOT your rates. Work through
   them, then set `confirmed: true`. While it is false the page labels the
   output as a worked example rather than a quote, and the deploy workflow
   warns you. That's deliberate — it means you cannot accidentally publish
   numbers you never agreed to.

   HOW THE MATH WORKS
     monthly = (base x response x coverage + add-ons) x term
   and the page shows that as a band (+/- rangePct) because a real quote
   depends on things a form can't see.

   To remove an option, delete its entry. To remove a whole question, delete
   the array — the UI and the calculation both adapt.
   ========================================================================== */
window.MKM_PRICING = {

  confirmed: false,
  currency: "AUD",

  // Callout terms. The standard 2.5-hour callout is included in the monthly
  // fee rather than charged — that's the whole pitch of subscribing.
  calloutHours: 2.5,
  calloutWaived: true,

  // What's being covered. `base` is the monthly starting point.
  // `hourly` is the rate for work beyond the included hours.
  //   >>> THE TWO HOURLY RATES BELOW ARE MAX'S ACTUAL FIGURES. <<<
  //   Everything else on this page is still placeholder.
  domains: [
    { id: "site",       label: "Brochure website",        base: 120, hourly: 180,
      hint: "Up to about 10 pages, no checkout." },
    { id: "ecom",       label: "E-commerce store",        base: 240, hourly: 180,
      hint: "Shopify or WooCommerce, live orders." },
    { id: "multi",      label: "Multiple sites",          base: 380, hourly: 180,
      hint: "Two or more properties under one agreement." },
    // Publishing automation RATES is a bigger step than publishing capability
    // — see README before leaving this one in.
    { id: "automation", label: "Industrial control system", base: 650, hourly: 200,
      hint: "PLC/SCADA. Scoped case by case." }
  ],

  // How fast you commit to responding.
  response: [
    { id: "nbd",  label: "Next business day",  mult: 1.00, hint: "Fine for most brochure sites." },
    { id: "same", label: "Same business day",  mult: 1.30 },
    { id: "4h",   label: "Within 4 hours",     mult: 1.65 },
    { id: "1h",   label: "Within 1 hour",      mult: 2.20, hint: "Revenue stops when the site does." }
  ],

  // When that response window applies.
  coverage: [
    { id: "business", label: "Business hours",     mult: 1.00 },
    { id: "extended", label: "7am - 9pm, 7 days",  mult: 1.35 },
    { id: "always",   label: "24/7",               mult: 1.85 }
  ],

  // Flat monthly additions.
  addons: [
    { id: "updates", label: "Content updates",        price: 90,
      hint: "Up to 2 hours a month of changes." },
    { id: "hosting", label: "Hosting, SSL & backups", price: 45 },
    { id: "monitor", label: "Uptime monitoring",      price: 35,
      hint: "You hear it from me, not from a customer." },
    { id: "seo",     label: "Ongoing local SEO",      price: 180 },
    { id: "photo",   label: "Quarterly photo refresh", price: 150,
      hint: "One short shoot a quarter, edited." }
  ],

  // Commitment.
  term: [
    { id: "monthly", label: "Month to month", mult: 1.00 },
    { id: "annual",  label: "12 months",      mult: 0.90, hint: "10% off, cancel with 30 days notice." }
  ],

  // Width of the band shown, either side of the computed figure.
  rangePct: 0.15,

};
