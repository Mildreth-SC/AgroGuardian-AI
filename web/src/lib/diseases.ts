export type DiseaseEntry = {
  slug: string;
  nameEs: string;
  nameEn: string;
  crop: string;
  pathogen: string;
  season: string;
  riskClimate: string;
  symptomsEs: string[];
  symptomsEn: string[];
  treatmentEs: string[];
  treatmentEn: string[];
  severity: "bajo" | "medio" | "alto" | "critico";
  image?: string;
};

export const DISEASE_CATALOG: DiseaseEntry[] = [
  {
    slug: "sigatoka-negra",
    nameEs: "Sigatoka negra",
    nameEn: "Black Sigatoka",
    crop: "Plátano / Banano",
    pathogen: "Mycosphaerella fijiensis",
    season: "Lluvias, humedad >80%",
    riskClimate: "Alta humedad + temperaturas cálidas",
    symptomsEs: ["Manchas necróticas alargadas", "Bordes amarillos", "Reducción del área foliar"],
    symptomsEn: ["Elongated necrotic streaks", "Yellow borders", "Reduced leaf area"],
    treatmentEs: ["Eliminar hojas afectadas", "Evitar riego por aspersión", "Fungicida según MAG"],
    treatmentEn: ["Remove affected leaves", "Avoid overhead irrigation", "Fungicide per local guide"],
    severity: "alto",
    image: "/samples/sigatoka.jpg",
  },
  {
    slug: "sigatoka-amarilla",
    nameEs: "Sigatoka amarilla",
    nameEn: "Yellow Sigatoka",
    crop: "Plátano",
    pathogen: "Mycosphaerella musicola",
    season: "Todo el año, picos húmedos",
    riskClimate: "Humedad moderada-alta",
    symptomsEs: ["Rayas finas paralelas a nervaduras", "Manchas amarillas pequeñas"],
    symptomsEn: ["Fine streaks parallel to veins", "Small yellow spots"],
    treatmentEs: ["Monitoreo semanal", "Nutrición balanceada", "Fungicida preventivo"],
    treatmentEn: ["Weekly monitoring", "Balanced nutrition", "Preventive fungicide"],
    severity: "medio",
    image: "/samples/sigatoka-amarilla.svg",
  },
  {
    slug: "roya-maiz",
    nameEs: "Roya del maíz",
    nameEn: "Corn rust",
    crop: "Maíz",
    pathogen: "Puccinia sorghi",
    season: "Época seca con rocío",
    riskClimate: "Rocío matutino, vientos",
    symptomsEs: ["Pústulas rojizo-anaranjadas", "Hojas superiores afectadas"],
    symptomsEn: ["Reddish-orange pustules", "Upper leaves affected"],
    treatmentEs: ["Variedades tolerantes", "Fungicida si >5% hoja"],
    treatmentEn: ["Tolerant varieties", "Fungicide if >5% leaf area"],
    severity: "medio",
    image: "/samples/maiz-roya.jpg",
  },
  {
    slug: "monilia-cacao",
    nameEs: "Moniliasis del cacao",
    nameEn: "Frosty pod rot (cacao)",
    crop: "Cacao",
    pathogen: "Moniliophthora roreri",
    season: "Lluvias prolongadas",
    riskClimate: "Alta humedad + sombra densa",
    symptomsEs: ["Maza blanca en mazorcas", "Podredumbre interna"],
    symptomsEn: ["White mold on pods", "Internal rot"],
    treatmentEs: ["Eliminar mazorcas infectadas", "Aumentar ventilación", "Trampas sanitarias"],
    treatmentEn: ["Remove infected pods", "Improve airflow", "Sanitation traps"],
    severity: "critico",
    image: "/samples/cacao-monilia.jpg",
  },
  {
    slug: "antracnosis-cafe",
    nameEs: "Antracnosis del café",
    nameEn: "Coffee anthracnose",
    crop: "Café",
    pathogen: "Colletotrichum spp.",
    season: "Floración y fructificación",
    riskClimate: "Lluvia + heridas en tejido",
    symptomsEs: ["Manchas hundidas en frutos", "Secamiento de ramas jóvenes"],
    symptomsEn: ["Sunken spots on fruits", "Dieback of young branches"],
    treatmentEs: ["Poda sanitaria", "Cobre o fungicida registrado"],
    treatmentEn: ["Sanitary pruning", "Copper or registered fungicide"],
    severity: "alto",
    image: "/samples/antracnosis-cafe.svg",
  },
  {
    slug: "blast-arroz",
    nameEs: "Pyricularia del arroz",
    nameEn: "Rice blast",
    crop: "Arroz",
    pathogen: "Pyricularia oryzae",
    season: "Macollamiento y espigado",
    riskClimate: "Alta humedad, noche fresca",
    symptomsEs: ["Lesiones rombo en hojas", "Cuello de panoja afectado"],
    symptomsEn: ["Diamond-shaped leaf lesions", "Neck blast on panicle"],
    treatmentEs: ["Evitar exceso de nitrógeno", "Fungicida en alerta"],
    treatmentEn: ["Avoid excess nitrogen", "Fungicide on alert"],
    severity: "alto",
    image: "/samples/blast-arroz.svg",
  },
  {
    slug: "mildiu-vina",
    nameEs: "Mildiu polvoso",
    nameEn: "Powdery mildew",
    crop: "Varios",
    pathogen: "Oidium spp.",
    season: "Épocas secas con rocío",
    riskClimate: "Humedad relativa variable",
    symptomsEs: ["Polvo blanco en hojas", "Deformación foliar leve"],
    symptomsEn: ["White powder on leaves", "Mild leaf deformation"],
    treatmentEs: ["Azufre o bicarbonato", "Mejorar circulación de aire"],
    treatmentEn: ["Sulfur or bicarbonate", "Improve air circulation"],
    severity: "medio",
    image: "/samples/mildiu-vina.svg",
  },
  {
    slug: "tizon-tomate",
    nameEs: "Tizón tardío",
    nameEn: "Late blight",
    crop: "Tomate / Papa",
    pathogen: "Phytophthora infestans",
    season: "Lluvias frías",
    riskClimate: "Frío + humedad prolongada",
    symptomsEs: ["Manchas acuosas oscuras", "Olor a podredumbre"],
    symptomsEn: ["Dark watery spots", "Rot smell"],
    treatmentEs: ["Eliminar focos", "Fungicida sistémico", "Rotación"],
    treatmentEn: ["Remove foci", "Systemic fungicide", "Crop rotation"],
    severity: "critico",
    image: "/samples/tizon-tomate.svg",
  },
  {
    slug: "mosaico-papa",
    nameEs: "Virus del mosaico",
    nameEn: "Mosaic virus",
    crop: "Papa / Tomate",
    pathogen: "Potyvirus / TMV",
    season: "Todo el año (vector)",
    riskClimate: "Presencia de áfidos",
    symptomsEs: ["Mosaico claro-oscuro", "Hojas deformadas"],
    symptomsEn: ["Light-dark mosaic", "Distorted leaves"],
    treatmentEs: ["Control de vectores", "Material certificado", "Eliminar plantas"],
    treatmentEn: ["Vector control", "Certified seed", "Roguing infected plants"],
    severity: "alto",
    image: "/samples/mosaico-papa.svg",
  },
  {
    slug: "trips-platano",
    nameEs: "Daño por trips",
    nameEn: "Thrips damage",
    crop: "Plátano",
    pathogen: "Thrips / virus asociados",
    season: "Época seca",
    riskClimate: "Sequía + polvo",
    symptomsEs: ["Rayas plateadas en hojas", "Deformación de frutos"],
    symptomsEn: ["Silvery streaks on leaves", "Fruit deformation"],
    treatmentEs: ["Trampas azules", "Aceites hortícolas", "Manejo integrado"],
    treatmentEn: ["Blue sticky traps", "Horticultural oils", "IPM"],
    severity: "medio",
    image: "/samples/trips-platano.svg",
  },
];

export function getDiseaseBySlug(slug: string) {
  return DISEASE_CATALOG.find((d) => d.slug === slug);
}

export function matchDisease(name: string) {
  const n = name.toLowerCase();
  return DISEASE_CATALOG.find(
    (d) => d.nameEs.toLowerCase().includes(n) || n.includes(d.slug.replace(/-/g, " "))
  );
}
