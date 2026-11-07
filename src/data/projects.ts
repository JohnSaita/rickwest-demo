// Rickwest Realty projects, taken from the public listings on https://www.rickwestrealty.co.ke/ (checked 7 Nov 2026).
// Coordinates are placed by hand from the location text in each listing:
//   precision "landmark" = the listing names a landmark next to the site (pin is close)
//   precision "area"     = the listing gives only the neighbourhood (pin is approximate, shown with a dashed circle)
// Confirm exact locations with Rickwest before any of this goes live.

export type Precision = "landmark" | "area";
export type Purpose = "sale" | "rent";

export interface UnitType {
  type: string;
  size: string;
  price: string;
}

export interface Project {
  id: string;
  name: string;
  area: Area;
  locationNote: string;
  coords: [number, number]; // [lng, lat]
  precision: Precision;
  purpose: Purpose;
  /** Lowest price in KES, used for filtering and the pin label. Null for rentals. */
  fromKES: number | null;
  priceLabel: string;
  pinLabel: string;
  beds: string;
  size: string;
  completion?: string;
  units?: UnitType[];
  highlights: string[];
  image?: string;
  listingUrl: string;
}

export const AREAS = ["Westlands", "Riverside", "Kileleshwa", "Syokimau", "Mombasa Road"] as const;
export type Area = (typeof AREAS)[number];

const IMG = "https://www.rickwestrealty.co.ke/wp-content/uploads/";
const LIST = "https://www.rickwestrealty.co.ke/property/";

export const PROJECTS: Project[] = [
  {
    id: "hephe",
    name: "Hephe Palace",
    area: "Westlands",
    locationNote: "Next to Kingfisher Hotel, opposite The Oval",
    coords: [36.8041, -1.2589],
    precision: "landmark",
    purpose: "sale",
    fromKES: 6_200_000,
    priceLabel: "KES 6.2M – 22.95M",
    pinLabel: "6.2M",
    beds: "Studio – 3 bed + DSQ",
    size: "48 – 168 m²",
    completion: "Sep 2028",
    units: [
      { type: "Studio", size: "48 m²", price: "KES 6.2M – 6.9M" },
      { type: "1 bed", size: "67–72 m²", price: "KES 7.5M – 9.7M" },
      { type: "2 bed", size: "109 m²", price: "KES 13.8M – 14.99M" },
      { type: "3 bed + DSQ", size: "158–168 m²", price: "KES 19.8M – 22.95M" },
    ],
    highlights: ["Heated rooftop infinity pool", "Karura Forest views", "36 months at 0% interest", "Up to 10% off"],
    image: IMG + "2025/10/IMG-20250922-WA0024-1-592x444.jpg",
    listingUrl: LIST + "hephe/",
  },
  {
    id: "calla",
    name: "Calla Residency",
    area: "Westlands",
    locationNote: "Westlands, next to the Expressway",
    coords: [36.8036, -1.2652],
    precision: "area",
    purpose: "sale",
    fromKES: 6_000_000,
    priceLabel: "From KES 6M",
    pinLabel: "6.0M",
    beds: "1 – 2 bed + DSQ",
    size: "55 – 122 m²",
    completion: "Jan 2028",
    units: [
      { type: "1 bed", size: "55 m²", price: "KES 6M" },
      { type: "1 bed + study", size: "64 m²", price: "KES 6.5M" },
      { type: "2 bed en-suite", size: "108 m²", price: "From KES 10.5M" },
      { type: "2 bed + DSQ", size: "117–122 m²", price: "From KES 12M" },
    ],
    highlights: ["Rooftop pool and BBQ deck", "Gym and kids' play area", "Borehole and backup generator"],
    image: IMG + "2026/01/IMG-20260130-WA0075-592x444.jpg",
    listingUrl: LIST + "1-and-2-bedroom-apartments-for-sale-in-westlands-nairobi-kenya-from-kes-6m-calla-residency/",
  },
  {
    id: "golden-mansion",
    name: "Golden Mansion",
    area: "Westlands",
    locationNote: "Westlands, Nairobi",
    coords: [36.8088, -1.2627],
    precision: "area",
    purpose: "sale",
    fromKES: 7_800_000,
    priceLabel: "KES 7.8M",
    pinLabel: "7.8M",
    beds: "Apartments",
    size: "64.4 m²",
    completion: "New construction",
    highlights: ["New listing", "New construction"],
    image: IMG + "2026/01/202508-Z1-003-%E6%AD%A3%E9%80%8F%E8%A7%86-%E5%9B%BE%E5%B9%85003rrj-g%E5%89%AF%E6%9C%AC-1-592x444.jpg",
    listingUrl: LIST + "golden-mansion-apartments-for-sale-in-westlands-nairobi/",
  },
  {
    id: "pearl-lumina",
    name: "Pearl Lumina",
    area: "Riverside",
    locationNote: "Riverside, Nairobi",
    coords: [36.8046, -1.2733],
    precision: "area",
    purpose: "sale",
    fromKES: 8_300_000,
    priceLabel: "From KES 8.3M",
    pinLabel: "8.3M",
    beds: "Apartments",
    size: "—",
    highlights: ["Hot offer"],
    image: IMG + "2026/02/IMG-20260217-WA0094-592x444.jpg",
    listingUrl: LIST + "pearl-lumina-apartments-for-sale-in-riverside-from-kes-8-3m/",
  },
  {
    id: "riverside-123",
    name: "Riverside 1, 2 & 3 Bed",
    area: "Riverside",
    locationNote: "Riverside, Nairobi",
    coords: [36.7978, -1.2706],
    precision: "area",
    purpose: "sale",
    fromKES: 7_900_000,
    priceLabel: "From KES 7.9M",
    pinLabel: "7.9M",
    beds: "1 – 3 bed",
    size: "From 66 m²",
    highlights: ["Hot offer"],
    image: IMG + "2026/01/IMG-20260129-WA0241-592x444.jpg",
    listingUrl: LIST + "12-and-3-bedroom-apartments-for-sale-in-riverside-nairobi-from-kes-7-9m/",
  },
  {
    id: "maylan-park",
    name: "Maylan Park Residence",
    area: "Kileleshwa",
    locationNote: "Mandera Road, Kileleshwa",
    coords: [36.7872, -1.2788],
    precision: "area",
    purpose: "sale",
    fromKES: 6_500_000,
    priceLabel: "From KES 6.5M",
    pinLabel: "6.5M",
    beds: "1 bed +",
    size: "From 66 m²",
    highlights: ["Hot offer"],
    image: IMG + "2026/01/IMG-20260122-WA0203-512x444.jpg",
    listingUrl: LIST + "maylan-park-residence/",
  },
  {
    id: "kileleshwa-family",
    name: "Kileleshwa 2, 3 & 4 Bed",
    area: "Kileleshwa",
    locationNote: "Kileleshwa, Nairobi",
    coords: [36.7808, -1.2838],
    precision: "area",
    purpose: "sale",
    fromKES: 18_500_000,
    priceLabel: "KES 18.5M",
    pinLabel: "18.5M",
    beds: "2 – 4 bed",
    size: "—",
    highlights: ["Family-size units"],
    listingUrl: LIST + "23-and-4-bedroom-apartments-for-sale-in-kileleshwa/",
  },
  {
    id: "kileleshwa-starter",
    name: "Kileleshwa Apartments",
    area: "Kileleshwa",
    locationNote: "Kileleshwa, Nairobi",
    coords: [36.7905, -1.2812],
    precision: "area",
    purpose: "sale",
    fromKES: 3_450_000,
    priceLabel: "From KES 3.45M",
    pinLabel: "3.45M",
    beds: "1 bed",
    size: "From 35 m²",
    highlights: ["Lowest entry price in the portfolio"],
    image: IMG + "2026/01/IMG-20260123-WA0076-592x444.jpg",
    listingUrl: LIST + "apartments-for-sale-in-kileleshwa-from-kes-3-45m/",
  },
  {
    id: "syokimau",
    name: "Syokimau 1, 2 & 3 Bed",
    area: "Syokimau",
    locationNote: "Syokimau, Machakos County",
    coords: [36.9302, -1.3615],
    precision: "area",
    purpose: "sale",
    fromKES: 4_400_000,
    priceLabel: "From KES 4.4M",
    pinLabel: "4.4M",
    beds: "1 – 3 bed",
    size: "From 56 m²",
    completion: "New construction",
    highlights: ["Close to JKIA and the SGR", "New construction"],
    image: IMG + "2025/12/IMG-20251218-WA0015-592x444.jpg",
    listingUrl: LIST + "12-and-3-bedroom-apartments-from-kes-4-4m-in-syokimau/",
  },
  {
    id: "jkia-hotel",
    name: "JKIA Premium Hotel Apartments",
    area: "Mombasa Road",
    locationNote: "Next to Argyle Grand Hotel, opposite Hilton Garden Inn",
    coords: [36.8992, -1.3343],
    precision: "landmark",
    purpose: "sale",
    fromKES: 7_835_100, // USD 60,270 at the listing's own rate of 130 KES/USD
    priceLabel: "From USD 60,270",
    pinLabel: "$60K",
    beds: "Studio – 1 bed",
    size: "33 – 53 m²",
    completion: "Q4 2026",
    units: [
      { type: "Standard studio", size: "33 m²", price: "USD 60,270" },
      { type: "King studio", size: "44 m²", price: "USD 80,960" },
      { type: "Standard 1 bed", size: "49 m²", price: "USD 90,160" },
      { type: "King 1 bed", size: "53 m²", price: "USD 97,520" },
    ],
    highlights: ["Furnished and serviced", "30% deposit, balance over 18 months", "Pool, gym, sauna"],
    image: IMG + "2024/11/WhatsApp-Image-2024-11-11-at-12.40.53-2.jpeg",
    listingUrl: LIST + "jkia-premium-hotel-apartments-for-sale-from-usd-60270/",
  },
  {
    id: "westlands-office",
    name: "Westlands Office Space",
    area: "Westlands",
    locationNote: "Westlands, Nairobi",
    coords: [36.8112, -1.2676],
    precision: "area",
    purpose: "rent",
    fromKES: null,
    priceLabel: "KES 149 per sq ft",
    pinLabel: "Office",
    beds: "Office floors",
    size: "2,850 – 32,315 sq ft",
    highlights: ["For rent", "Flexible floor sizes"],
    image: IMG + "2025/10/20250918_105915-592x444.jpg",
    listingUrl: LIST + "2850sqft-to-32315sqft-office-space-for-rent-in-westlands-nairobi/",
  },
];

/** Places buyers ask about. Drive times are fetched from each project to these. */
export const DESTINATIONS = [
  { id: "westlands", label: "Westlands (Sarit Centre)", coords: [36.8026, -1.2613] as [number, number] },
  { id: "cbd", label: "Nairobi CBD (KICC)", coords: [36.8233, -1.2884] as [number, number] },
  { id: "jkia", label: "JKIA airport", coords: [36.9259, -1.3263] as [number, number] },
];

export const SALES_WHATSAPP = "254789305431"; // From the "Call Us" button on rickwestrealty.co.ke

export const BUDGETS = [
  { id: "any", label: "Any budget", min: 0, max: Infinity },
  { id: "u5", label: "Under 5M", min: 0, max: 5_000_000 },
  { id: "5-8", label: "5M – 8M", min: 5_000_000, max: 8_000_000 },
  { id: "8-12", label: "8M – 12M", min: 8_000_000, max: 12_000_000 },
  { id: "12p", label: "12M +", min: 12_000_000, max: Infinity },
] as const;
