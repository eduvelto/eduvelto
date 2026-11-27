// Eduvelto — Full forms / abbreviations directory (27 Nov 2026).
// Every full form below is the standard, correct expansion.

export type FullFormCategory = 'education' | 'technology' | 'government' | 'medical' | 'finance' | 'general';

export interface FullFormItem {
  short: string;
  full: string;
  category: FullFormCategory;
  noteBn?: string;
}

// [short, full, category]
const RAW: Array<[string, string, FullFormCategory]> = [
  ['BCS', 'Bangladesh Civil Service', 'government'],
  ['SSC', 'Secondary School Certificate', 'education'],
  ['HSC', 'Higher Secondary Certificate', 'education'],
  ['JSC', 'Junior School Certificate', 'education'],
  ['PSC', 'Primary School Certificate', 'education'],
  ['NU', 'National University', 'education'],
  ['DU', 'University of Dhaka', 'education'],
  ['BUET', 'Bangladesh University of Engineering and Technology', 'education'],
  ['CU', 'University of Chittagong', 'education'],
  ['RU', 'University of Rajshahi', 'education'],
  ['JU', 'Jahangirnagar University', 'education'],
  ['GPA', 'Grade Point Average', 'education'],
  ['CGPA', 'Cumulative Grade Point Average', 'education'],
  ['NCTB', 'National Curriculum and Textbook Board', 'education'],
  ['UGC', 'University Grants Commission', 'education'],
  ['PhD', 'Doctor of Philosophy', 'education'],
  ['MSc', 'Master of Science', 'education'],
  ['BSc', 'Bachelor of Science', 'education'],
  ['BA', 'Bachelor of Arts', 'education'],
  ['MA', 'Master of Arts', 'education'],
  ['MBA', 'Master of Business Administration', 'education'],
  ['BBA', 'Bachelor of Business Administration', 'education'],
  ['MBBS', 'Bachelor of Medicine, Bachelor of Surgery', 'medical'],
  ['BDS', 'Bachelor of Dental Surgery', 'medical'],
  ['ICU', 'Intensive Care Unit', 'medical'],
  ['CCU', 'Coronary Care Unit', 'medical'],
  ['ECG', 'Electrocardiogram', 'medical'],
  ['MRI', 'Magnetic Resonance Imaging', 'medical'],
  ['CT', 'Computed Tomography', 'medical'],
  ['DNA', 'Deoxyribonucleic Acid', 'medical'],
  ['RNA', 'Ribonucleic Acid', 'medical'],
  ['HIV', 'Human Immunodeficiency Virus', 'medical'],
  ['AIDS', 'Acquired Immunodeficiency Syndrome', 'medical'],
  ['WHO', 'World Health Organization', 'general'],
  ['UN', 'United Nations', 'general'],
  ['UNESCO', 'United Nations Educational, Scientific and Cultural Organization', 'general'],
  ['UNICEF', 'United Nations Children\u2019s Fund', 'general'],
  ['NID', 'National Identity Card', 'government'],
  ['UNO', 'Upazila Nirbahi Officer', 'government'],
  ['DC', 'Deputy Commissioner', 'government'],
  ['SP', 'Superintendent of Police', 'government'],
  ['OC', 'Officer-in-Charge', 'government'],
  ['MP', 'Member of Parliament', 'government'],
  ['PM', 'Prime Minister', 'government'],
  ['GDP', 'Gross Domestic Product', 'finance'],
  ['VAT', 'Value Added Tax', 'finance'],
  ['ATM', 'Automated Teller Machine', 'finance'],
  ['PIN', 'Personal Identification Number', 'finance'],
  ['EMI', 'Equated Monthly Instalment', 'finance'],
  ['NBR', 'National Board of Revenue', 'government'],
  ['BB', 'Bangladesh Bank', 'finance'],
  ['CPU', 'Central Processing Unit', 'technology'],
  ['RAM', 'Random Access Memory', 'technology'],
  ['ROM', 'Read Only Memory', 'technology'],
  ['GPU', 'Graphics Processing Unit', 'technology'],
  ['USB', 'Universal Serial Bus', 'technology'],
  ['GPS', 'Global Positioning System', 'technology'],
  ['URL', 'Uniform Resource Locator', 'technology'],
  ['HTML', 'HyperText Markup Language', 'technology'],
  ['CSS', 'Cascading Style Sheets', 'technology'],
  ['HTTP', 'HyperText Transfer Protocol', 'technology'],
  ['HTTPS', 'HyperText Transfer Protocol Secure', 'technology'],
  ['PDF', 'Portable Document Format', 'technology'],
  ['JPG', 'Joint Photographic Experts Group', 'technology'],
  ['PNG', 'Portable Network Graphics', 'technology'],
  ['GIF', 'Graphics Interchange Format', 'technology'],
  ['MP3', 'MPEG Audio Layer III', 'technology'],
  ['MP4', 'MPEG-4 Part 14', 'technology'],
  ['WiFi', 'Wireless Fidelity', 'technology'],
  ['SIM', 'Subscriber Identity Module', 'technology'],
  ['SMS', 'Short Message Service', 'technology'],
  ['MMS', 'Multimedia Messaging Service', 'technology'],
  ['AI', 'Artificial Intelligence', 'technology'],
  ['IT', 'Information Technology', 'technology'],
  ['ICT', 'Information and Communications Technology', 'technology'],
  ['LAN', 'Local Area Network', 'technology'],
  ['WAN', 'Wide Area Network', 'technology'],
  ['IP', 'Internet Protocol', 'technology'],
  ['DNS', 'Domain Name System', 'technology'],
  ['OTP', 'One-Time Password', 'technology'],
  ['QR', 'Quick Response', 'technology'],
  ['LED', 'Light Emitting Diode', 'technology'],
  ['LCD', 'Liquid Crystal Display', 'technology'],
  ['HDMI', 'High-Definition Multimedia Interface', 'technology'],
  ['PDF', 'Portable Document Format', 'technology'],
  ['FAQ', 'Frequently Asked Questions', 'general'],
  ['etc.', 'et cetera', 'general'],
  ['e.g.', 'exempli gratia (for example)', 'general'],
  ['i.e.', 'id est (that is)', 'general'],
  ['vs.', 'versus', 'general'],
  ['AM / PM', 'Ante Meridiem (before noon) / Post Meridiem (after noon)', 'general'],
  ['AD', 'Anno Domini (in the year of the Lord)', 'general'],
  ['BC', 'Before Christ', 'general'],
  ['GMT', 'Greenwich Mean Time', 'general'],
  ['UTC', 'Coordinated Universal Time', 'general'],
  ['RIP', 'Rest in Peace', 'general'],
  ['VIP', 'Very Important Person', 'general'],
  ['CCTV', 'Closed-Circuit Television', 'technology'],
  ['FIFA', 'Fédération Internationale de Football Association', 'general'],
  ['ICC', 'International Cricket Council', 'general'],
  ['BGB', 'Border Guard Bangladesh', 'government'],
  ['RAB', 'Rapid Action Battalion', 'government'],
  ['BRTA', 'Bangladesh Road Transport Authority', 'government'],
  ['BTRC', 'Bangladesh Telecommunication Regulatory Commission', 'government'],
  ['EC', 'Election Commission', 'government'],
  ['ACC', 'Anti-Corruption Commission', 'government'],
];

export const FULL_FORMS: FullFormItem[] = RAW.filter(
  (item, index, arr) => arr.findIndex((x) => x[0] === item[0]) === index,
).map(([short, full, category]) => ({ short, full, category }));

export const FULL_FORM_CATEGORIES: Array<{ id: FullFormCategory | 'all'; labelBn: string; labelEn: string }> = [
  { id: 'all', labelBn: 'সবগুলো', labelEn: 'All' },
  { id: 'education', labelBn: 'শিক্ষা', labelEn: 'Education' },
  { id: 'technology', labelBn: 'প্রযুক্তি', labelEn: 'Technology' },
  { id: 'government', labelBn: 'সরকারি', labelEn: 'Government' },
  { id: 'medical', labelBn: 'চিকিৎসা', labelEn: 'Medical' },
  { id: 'finance', labelBn: 'অর্থ', labelEn: 'Finance' },
  { id: 'general', labelBn: 'সাধারণ', labelEn: 'General' },
];

export function searchFullForms(query: string, category: FullFormCategory | 'all'): FullFormItem[] {
  const q = query.trim().toLowerCase();
  return FULL_FORMS.filter((item) => {
    if (category !== 'all' && item.category !== category) return false;
    if (!q) return true;
    return item.short.toLowerCase().includes(q) || item.full.toLowerCase().includes(q);
  });
}
