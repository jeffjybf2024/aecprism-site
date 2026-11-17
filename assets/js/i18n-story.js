// Group B: English for the service-building animation. Loaded after i18n2.js.
Object.assign(window.PRISM_EN, {
  "pos.h": "We don't do traditional BIM.",
  "pos.p": "Information that goes straight into decisions.",
  "ph.pre": "Pre-design", "ph.con": "Construction", "ph.ops": "Operations",

  // the old step names: the step cards are gone, but the booking form's topic list still uses them
  "sc.land.n": "Land Assessment", "sc.env.n": "Environmental Analysis", "sc.site.n": "Smart Construction Site", "sc.auto.n": "Automated Workflows",
  "sc.cost.n": "Cost Management", "sc.property.n": "Property Management", "sc.facility.n": "Facility Management",

  // Group E: the legend and the illustrative figures on each card (the data layer draws them over the building)
  "dl.demo": "Illustrative",
  "dl.land.l1": "Site boundary", "dl.land.l2": "Setback", "dl.land.l3": "Buildable envelope",
  "dl.land.v1": "<small>Floor area ratio</small> <b>400%</b>", "dl.land.v2": "<small>Buildable floor area</small> <b>9,600 m²</b>",
  "dl.env.l1": "Wind speed low → high", "dl.env.l2": "White massing",
  "dl.env.v1": "<small>Winter-solstice sun</small> <b>3.2 h</b>",
  "dl.site.l1": "Complete", "dl.site.l2": "In progress", "dl.site.l3": "Not started",
  "dl.site.v1": "<small>Progress</small> <b>62%</b>", "dl.site.v2": "<small>Against plan</small> <b>3 days ahead</b>",
  "dl.auto.l1": "Passed", "dl.auto.l2": "To fix", "dl.auto.l3": "Check sweep",
  "dl.auto.v1": "<small>Checks</small> <b>1,248</b>", "dl.auto.v2": "<small>To fix</small> <b>3</b>",
  "dl.cost.l1": "Cost per floor low → high", "dl.cost.l2": "Design change",
  "dl.cost.v1": "<small>Budget</small> <b>NT$ 1.24 bn → 1.29 bn</b>",
  "dl.property.l1": "Leased", "dl.property.l2": "Expiring soon", "dl.property.l3": "Vacant",
  "dl.property.v1": "<small>Occupancy</small> <b>92%</b>",
  "dl.facility.l1": "Sensors", "dl.facility.l2": "Alert", "dl.facility.l3": "Core and equipment",
  "dl.facility.v1": "<small>Chilled-water pump #3</small> <b>Vibration alert → maintenance booked</b>"
});

// label under the scroll bar, one per film station (opening, positioning, then the seven steps)
window.PRISM_CH_LABELS = {
  zh: ["AEC PRISM", "AEC PRISM", "AEC PRISM", "AEC PRISM", "新一代 BIM", "01 · 土地評估", "02 · 環境分析", "03 · 智慧工地", "04 · 自動化流程", "05 · 成本管理", "06 · 物業管理", "07 · 設備管理"],
  en: ["AEC PRISM", "AEC PRISM", "AEC PRISM", "AEC PRISM", "NEXT-GEN BIM", "01 · LAND", "02 · ENVIRONMENT", "03 · SITE", "04 · AUTOMATION", "05 · COST", "06 · PROPERTY", "07 · FACILITY"]
};
