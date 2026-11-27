// Eduvelto — Periodic table data (27 Nov 2026).
// All 118 elements: standard IUPAC atomic weights (conventional values;
// synthetic elements show the mass number of the most stable isotope).
// Categories: alkali, alkaline-earth, transition, post-transition,
// metalloid, nonmetal, halogen, noble-gas, lanthanide, actinide.

export type ElementCategory =
  | 'alkali'
  | 'alkaline-earth'
  | 'transition'
  | 'post-transition'
  | 'metalloid'
  | 'nonmetal'
  | 'halogen'
  | 'noble-gas'
  | 'lanthanide'
  | 'actinide';

export interface ElementInfo {
  z: number;
  symbol: string;
  nameEn: string;
  nameBn: string;
  mass: number;
  category: ElementCategory;
  group: number; // 1–18; 0 = f-block row (lanthanides/actinides)
  period: number; // 1–7
}

// [z, symbol, nameEn, nameBn, mass, category, group, period]
const RAW: Array<[number, string, string, string, number, ElementCategory, number, number]> = [
  [1, 'H', 'Hydrogen', 'হাইড্রোজেন', 1.008, 'nonmetal', 1, 1],
  [2, 'He', 'Helium', 'হিলিয়াম', 4.0026, 'noble-gas', 18, 1],
  [3, 'Li', 'Lithium', 'লিথিয়াম', 6.94, 'alkali', 1, 2],
  [4, 'Be', 'Beryllium', 'বেরিলিয়াম', 9.0122, 'alkaline-earth', 2, 2],
  [5, 'B', 'Boron', 'বোরন', 10.81, 'metalloid', 13, 2],
  [6, 'C', 'Carbon', 'কার্বন', 12.011, 'nonmetal', 14, 2],
  [7, 'N', 'Nitrogen', 'নাইট্রোজেন', 14.007, 'nonmetal', 15, 2],
  [8, 'O', 'Oxygen', 'অক্সিজেন', 15.999, 'nonmetal', 16, 2],
  [9, 'F', 'Fluorine', 'ফ্লোরিন', 18.998, 'halogen', 17, 2],
  [10, 'Ne', 'Neon', 'নিয়ন', 20.18, 'noble-gas', 18, 2],
  [11, 'Na', 'Sodium', 'সোডিয়াম', 22.99, 'alkali', 1, 3],
  [12, 'Mg', 'Magnesium', 'ম্যাগনেসিয়াম', 24.305, 'alkaline-earth', 2, 3],
  [13, 'Al', 'Aluminium', 'অ্যালুমিনিয়াম', 26.982, 'post-transition', 13, 3],
  [14, 'Si', 'Silicon', 'সিলিকন', 28.085, 'metalloid', 14, 3],
  [15, 'P', 'Phosphorus', 'ফসফরাস', 30.974, 'nonmetal', 15, 3],
  [16, 'S', 'Sulfur', 'সালফার', 32.06, 'nonmetal', 16, 3],
  [17, 'Cl', 'Chlorine', 'ক্লোরিন', 35.45, 'halogen', 17, 3],
  [18, 'Ar', 'Argon', 'আর্গন', 39.948, 'noble-gas', 18, 3],
  [19, 'K', 'Potassium', 'পটাশিয়াম', 39.098, 'alkali', 1, 4],
  [20, 'Ca', 'Calcium', 'ক্যালসিয়াম', 40.078, 'alkaline-earth', 2, 4],
  [21, 'Sc', 'Scandium', 'স্ক্যান্ডিয়াম', 44.956, 'transition', 3, 4],
  [22, 'Ti', 'Titanium', 'টাইটানিয়াম', 47.867, 'transition', 4, 4],
  [23, 'V', 'Vanadium', 'ভ্যানাডিয়াম', 50.942, 'transition', 5, 4],
  [24, 'Cr', 'Chromium', 'ক্রোমিয়াম', 51.996, 'transition', 6, 4],
  [25, 'Mn', 'Manganese', 'ম্যাঙ্গানিজ', 54.938, 'transition', 7, 4],
  [26, 'Fe', 'Iron', 'আয়রন', 55.845, 'transition', 8, 4],
  [27, 'Co', 'Cobalt', 'কোবাল্ট', 58.933, 'transition', 9, 4],
  [28, 'Ni', 'Nickel', 'নিকেল', 58.693, 'transition', 10, 4],
  [29, 'Cu', 'Copper', 'তামা', 63.546, 'transition', 11, 4],
  [30, 'Zn', 'Zinc', 'জিংক', 65.38, 'transition', 12, 4],
  [31, 'Ga', 'Gallium', 'গ্যালিয়াম', 69.723, 'post-transition', 13, 4],
  [32, 'Ge', 'Germanium', 'জার্মেনিয়াম', 72.63, 'metalloid', 14, 4],
  [33, 'As', 'Arsenic', 'আর্সেনিক', 74.922, 'metalloid', 15, 4],
  [34, 'Se', 'Selenium', 'সেলেনিয়াম', 78.971, 'nonmetal', 16, 4],
  [35, 'Br', 'Bromine', 'ব্রোমিন', 79.904, 'halogen', 17, 4],
  [36, 'Kr', 'Krypton', 'ক্রিপ্টন', 83.798, 'noble-gas', 18, 4],
  [37, 'Rb', 'Rubidium', 'রুবিডিয়াম', 85.468, 'alkali', 1, 5],
  [38, 'Sr', 'Strontium', 'স্ট্রনশিয়াম', 87.62, 'alkaline-earth', 2, 5],
  [39, 'Y', 'Yttrium', 'ইট্রিয়াম', 88.906, 'transition', 3, 5],
  [40, 'Zr', 'Zirconium', 'জিরকোনিয়াম', 91.224, 'transition', 4, 5],
  [41, 'Nb', 'Niobium', 'নায়োবিয়াম', 92.906, 'transition', 5, 5],
  [42, 'Mo', 'Molybdenum', 'মলিবডেনাম', 95.95, 'transition', 6, 5],
  [43, 'Tc', 'Technetium', 'টেকনেশিয়াম', 98, 'transition', 7, 5],
  [44, 'Ru', 'Ruthenium', 'রুথেনিয়াম', 101.07, 'transition', 8, 5],
  [45, 'Rh', 'Rhodium', 'রোডিয়াম', 102.91, 'transition', 9, 5],
  [46, 'Pd', 'Palladium', 'প্যালাডিয়াম', 106.42, 'transition', 10, 5],
  [47, 'Ag', 'Silver', 'রূপা', 107.87, 'transition', 11, 5],
  [48, 'Cd', 'Cadmium', 'ক্যাডমিয়াম', 112.41, 'transition', 12, 5],
  [49, 'In', 'Indium', 'ইন্ডিয়াম', 114.82, 'post-transition', 13, 5],
  [50, 'Sn', 'Tin', 'টিন', 118.71, 'post-transition', 14, 5],
  [51, 'Sb', 'Antimony', 'অ্যান্টিমনি', 121.76, 'metalloid', 15, 5],
  [52, 'Te', 'Tellurium', 'টেলুরিয়াম', 127.6, 'metalloid', 16, 5],
  [53, 'I', 'Iodine', 'আয়োডিন', 126.9, 'halogen', 17, 5],
  [54, 'Xe', 'Xenon', 'জেনন', 131.29, 'noble-gas', 18, 5],
  [55, 'Cs', 'Caesium', 'সিজিয়াম', 132.91, 'alkali', 1, 6],
  [56, 'Ba', 'Barium', 'বেরিয়াম', 137.33, 'alkaline-earth', 2, 6],
  [57, 'La', 'Lanthanum', 'ল্যান্থানাম', 138.91, 'lanthanide', 3, 6],
  [58, 'Ce', 'Cerium', 'সেরিয়াম', 140.12, 'lanthanide', 0, 6],
  [59, 'Pr', 'Praseodymium', 'প্রাসিওডিমিয়াম', 140.91, 'lanthanide', 0, 6],
  [60, 'Nd', 'Neodymium', 'নিওডিমিয়াম', 144.24, 'lanthanide', 0, 6],
  [61, 'Pm', 'Promethium', 'প্রোমিথিয়াম', 145, 'lanthanide', 0, 6],
  [62, 'Sm', 'Samarium', 'সামারিয়াম', 150.36, 'lanthanide', 0, 6],
  [63, 'Eu', 'Europium', 'ইউরোপিয়াম', 151.96, 'lanthanide', 0, 6],
  [64, 'Gd', 'Gadolinium', 'গ্যাডোলিনিয়াম', 157.25, 'lanthanide', 0, 6],
  [65, 'Tb', 'Terbium', 'টারবিয়াম', 158.93, 'lanthanide', 0, 6],
  [66, 'Dy', 'Dysprosium', 'ডিসপ্রোসিয়াম', 162.5, 'lanthanide', 0, 6],
  [67, 'Ho', 'Holmium', 'হলমিয়াম', 164.93, 'lanthanide', 0, 6],
  [68, 'Er', 'Erbium', 'আরবিয়াম', 167.26, 'lanthanide', 0, 6],
  [69, 'Tm', 'Thulium', 'থুলিয়াম', 168.93, 'lanthanide', 0, 6],
  [70, 'Yb', 'Ytterbium', 'ইটারবিয়াম', 173.05, 'lanthanide', 0, 6],
  [71, 'Lu', 'Lutetium', 'লুটেশিয়াম', 174.97, 'lanthanide', 0, 6],
  [72, 'Hf', 'Hafnium', 'হাফনিয়াম', 178.49, 'transition', 4, 6],
  [73, 'Ta', 'Tantalum', 'ট্যান্টালাম', 180.95, 'transition', 5, 6],
  [74, 'W', 'Tungsten', 'টাংস্টেন', 183.84, 'transition', 6, 6],
  [75, 'Re', 'Rhenium', 'রেনিয়াম', 186.21, 'transition', 7, 6],
  [76, 'Os', 'Osmium', 'অসমিয়াম', 190.23, 'transition', 8, 6],
  [77, 'Ir', 'Iridium', 'ইরিডিয়াম', 192.22, 'transition', 9, 6],
  [78, 'Pt', 'Platinum', 'প্লাটিনাম', 195.08, 'transition', 10, 6],
  [79, 'Au', 'Gold', 'সোনা', 196.97, 'transition', 11, 6],
  [80, 'Hg', 'Mercury', 'পারদ', 200.59, 'transition', 12, 6],
  [81, 'Tl', 'Thallium', 'থ্যালিয়াম', 204.38, 'post-transition', 13, 6],
  [82, 'Pb', 'Lead', 'সীসা', 207.2, 'post-transition', 14, 6],
  [83, 'Bi', 'Bismuth', 'বিসমাথ', 208.98, 'post-transition', 15, 6],
  [84, 'Po', 'Polonium', 'পোলোনিয়াম', 209, 'post-transition', 16, 6],
  [85, 'At', 'Astatine', 'অ্যাস্টাটিন', 210, 'halogen', 17, 6],
  [86, 'Rn', 'Radon', 'রেডন', 222, 'noble-gas', 18, 6],
  [87, 'Fr', 'Francium', 'ফ্রান্সিয়াম', 223, 'alkali', 1, 7],
  [88, 'Ra', 'Radium', 'রেডিয়াম', 226, 'alkaline-earth', 2, 7],
  [89, 'Ac', 'Actinium', 'অ্যাক্টিনিয়াম', 227, 'actinide', 3, 7],
  [90, 'Th', 'Thorium', 'থোরিয়াম', 232.04, 'actinide', 0, 7],
  [91, 'Pa', 'Protactinium', 'প্রোট্যাক্টিনিয়াম', 231.04, 'actinide', 0, 7],
  [92, 'U', 'Uranium', 'ইউরেনিয়াম', 238.03, 'actinide', 0, 7],
  [93, 'Np', 'Neptunium', 'নেপচুনিয়াম', 237, 'actinide', 0, 7],
  [94, 'Pu', 'Plutonium', 'প্লুটোনিয়াম', 244, 'actinide', 0, 7],
  [95, 'Am', 'Americium', 'আমেরিসিয়াম', 243, 'actinide', 0, 7],
  [96, 'Cm', 'Curium', 'কুরিয়াম', 247, 'actinide', 0, 7],
  [97, 'Bk', 'Berkelium', 'বার্কেলিয়াম', 247, 'actinide', 0, 7],
  [98, 'Cf', 'Californium', 'ক্যালিফোর্নিয়াম', 251, 'actinide', 0, 7],
  [99, 'Es', 'Einsteinium', 'আইনস্টাইনিয়াম', 252, 'actinide', 0, 7],
  [100, 'Fm', 'Fermium', 'ফার্মিয়াম', 257, 'actinide', 0, 7],
  [101, 'Md', 'Mendelevium', 'মেন্ডেলিভিয়াম', 258, 'actinide', 0, 7],
  [102, 'No', 'Nobelium', 'নোবেলিয়াম', 259, 'actinide', 0, 7],
  [103, 'Lr', 'Lawrencium', 'লরেন্সিয়াম', 266, 'actinide', 0, 7],
  [104, 'Rf', 'Rutherfordium', 'রাদারফোর্ডিয়াম', 267, 'transition', 4, 7],
  [105, 'Db', 'Dubnium', 'ডুবনিয়াম', 268, 'transition', 5, 7],
  [106, 'Sg', 'Seaborgium', 'সিবোর্জিয়াম', 269, 'transition', 6, 7],
  [107, 'Bh', 'Bohrium', 'বোরিয়াম', 270, 'transition', 7, 7],
  [108, 'Hs', 'Hassium', 'হাসিয়াম', 277, 'transition', 8, 7],
  [109, 'Mt', 'Meitnerium', 'মাইটনেরিয়াম', 278, 'transition', 9, 7],
  [110, 'Ds', 'Darmstadtium', 'ডার্মস্টাডটিয়াম', 281, 'transition', 10, 7],
  [111, 'Rg', 'Roentgenium', 'রন্টজেনিয়াম', 282, 'transition', 11, 7],
  [112, 'Cn', 'Copernicium', 'কোপার্নিসিয়াম', 285, 'transition', 12, 7],
  [113, 'Nh', 'Nihonium', 'নিহোনিয়াম', 286, 'post-transition', 13, 7],
  [114, 'Fl', 'Flerovium', 'ফ্লেরোভিয়াম', 289, 'post-transition', 14, 7],
  [115, 'Mc', 'Moscovium', 'মস্কোভিয়াম', 290, 'post-transition', 15, 7],
  [116, 'Lv', 'Livermorium', 'লিভারমোরিয়াম', 293, 'post-transition', 16, 7],
  [117, 'Ts', 'Tennessine', 'টেনেসিন', 294, 'halogen', 17, 7],
  [118, 'Og', 'Oganesson', 'ওগানেসন', 294, 'noble-gas', 18, 7],
];

export const PERIODIC_TABLE: ElementInfo[] = RAW.map(([z, symbol, nameEn, nameBn, mass, category, group, period]) => ({
  z,
  symbol,
  nameEn,
  nameBn,
  mass,
  category,
  group,
  period,
}));

export function elementBySymbol(symbol: string): ElementInfo | undefined {
  return PERIODIC_TABLE.find((e) => e.symbol.toLowerCase() === symbol.trim().toLowerCase());
}

export function elementByAtomicNumber(z: number): ElementInfo | undefined {
  return PERIODIC_TABLE.find((e) => e.z === z);
}
