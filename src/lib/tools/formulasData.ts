// Eduvelto — Math & Physics formulas reference data (27 Nov 2026).
// Standard formulas only. Each group has a worked-example calculator
// (formula id matches computeFormula() in mainTablesTools.ts).

import type { FormulaId } from './mainTablesTools';

export interface FormulaInput {
  key: string;
  labelBn: string;
  labelEn: string;
  unit: string;
  defaultValue: string;
}

export interface FormulaItem {
  id: FormulaId;
  nameBn: string;
  nameEn: string;
  formula: string;
  meaningBn: string;
  meaningEn: string;
  inputs: FormulaInput[];
  resultLabelBn: string;
  resultLabelEn: string;
}

export interface FormulaGroup {
  groupBn: string;
  groupEn: string;
  items: FormulaItem[];
}

export const FORMULA_GROUPS: FormulaGroup[] = [
  {
    groupBn: 'বীজগণিত',
    groupEn: 'Algebra',
    items: [
      {
        id: 'quadratic',
        nameBn: 'দ্বিঘাত সমীকরণ',
        nameEn: 'Quadratic equation',
        formula: 'x = (−b ± √(b² − 4ac)) / 2a',
        meaningBn: 'ax² + bx + c = 0 সমীকরণের মূল নির্ণয়।',
        meaningEn: 'Roots of ax² + bx + c = 0.',
        inputs: [
          { key: 'a', labelBn: 'a', labelEn: 'a', unit: '', defaultValue: '1' },
          { key: 'b', labelBn: 'b', labelEn: 'b', unit: '', defaultValue: '-3' },
          { key: 'c', labelBn: 'c', labelEn: 'c', unit: '', defaultValue: '2' },
        ],
        resultLabelBn: 'x₁',
        resultLabelEn: 'x₁',
      },
    ],
  },
  {
    groupBn: 'জ্যামিতি',
    groupEn: 'Geometry',
    items: [
      {
        id: 'pythagoras',
        nameBn: 'পিথাগোরাসের উপপাদ্য',
        nameEn: 'Pythagoras theorem',
        formula: 'c² = a² + b²',
        meaningBn: 'সমকোণী ত্রিভুজের অতিভুজ নির্ণয়।',
        meaningEn: 'Hypotenuse of a right-angled triangle.',
        inputs: [
          { key: 'a', labelBn: 'এক বাহু (a)', labelEn: 'Side a', unit: '', defaultValue: '3' },
          { key: 'b', labelBn: 'অন্য বাহু (b)', labelEn: 'Side b', unit: '', defaultValue: '4' },
        ],
        resultLabelBn: 'অতিভুজ (c)',
        resultLabelEn: 'Hypotenuse (c)',
      },
      {
        id: 'circle-area',
        nameBn: 'বৃত্তের ক্ষেত্রফল',
        nameEn: 'Circle area',
        formula: 'A = πr²',
        meaningBn: 'ব্যাসার্ধ r হলে বৃত্তের ক্ষেত্রফল। পরিধি = 2πr।',
        meaningEn: 'Area of a circle of radius r. Circumference = 2πr.',
        inputs: [{ key: 'r', labelBn: 'ব্যাসার্ধ (r)', labelEn: 'Radius (r)', unit: '', defaultValue: '7' }],
        resultLabelBn: 'ক্ষেত্রফল',
        resultLabelEn: 'Area',
      },
      {
        id: 'triangle-area',
        nameBn: 'ত্রিভুজের ক্ষেত্রফল',
        nameEn: 'Triangle area',
        formula: 'A = ½ × ভূমি × উচ্চতা',
        meaningBn: 'ভূমি ও উচ্চতা জানা থাকলে ত্রিভুজের ক্ষেত্রফল।',
        meaningEn: 'Area from base and height.',
        inputs: [
          { key: 'base', labelBn: 'ভূমি', labelEn: 'Base', unit: '', defaultValue: '10' },
          { key: 'height', labelBn: 'উচ্চতা', labelEn: 'Height', unit: '', defaultValue: '6' },
        ],
        resultLabelBn: 'ক্ষেত্রফল',
        resultLabelEn: 'Area',
      },
      {
        id: 'rectangle-area',
        nameBn: 'আয়তক্ষেত্রের ক্ষেত্রফল',
        nameEn: 'Rectangle area',
        formula: 'A = দৈর্ঘ্য × প্রস্থ',
        meaningBn: 'দৈর্ঘ্য ও প্রস্থের গুণফল।',
        meaningEn: 'Length times width.',
        inputs: [
          { key: 'length', labelBn: 'দৈর্ঘ্য', labelEn: 'Length', unit: '', defaultValue: '8' },
          { key: 'width', labelBn: 'প্রস্থ', labelEn: 'Width', unit: '', defaultValue: '5' },
        ],
        resultLabelBn: 'ক্ষেত্রফল',
        resultLabelEn: 'Area',
      },
    ],
  },
  {
    groupBn: 'ত্রিকোণমিতি',
    groupEn: 'Trigonometry',
    items: [
      {
        id: 'trig-identity',
        nameBn: 'ত্রিকোণমিতিক অভেদ',
        nameEn: 'Trigonometric identity',
        formula: 'sin²θ + cos²θ = 1',
        meaningBn: 'যেকোনো কোণের জন্য sin²θ + cos²θ = 1 হয়। আরও: tan θ = sin θ / cos θ; sin 30° = ½; cos 60° = ½; tan 45° = 1।',
        meaningEn: 'For any angle, sin²θ + cos²θ = 1. Also: tan θ = sin θ / cos θ; sin 30° = ½; cos 60° = ½; tan 45° = 1.',
        inputs: [{ key: 'angle', labelBn: 'কোণ θ (ডিগ্রি)', labelEn: 'Angle θ (degrees)', unit: '°', defaultValue: '30' }],
        resultLabelBn: 'sin²θ + cos²θ',
        resultLabelEn: 'sin²θ + cos²θ',
      },
    ],
  },
  {
    groupBn: 'গতি ও বল',
    groupEn: 'Motion & Force',
    items: [
      {
        id: 'speed',
        nameBn: 'গতিবেগ',
        nameEn: 'Speed',
        formula: 'v = দূরত্ব ÷ সময়',
        meaningBn: 'একক সময়ে অতিক্রান্ত দূরত্ব।',
        meaningEn: 'Distance covered per unit time.',
        inputs: [
          { key: 'distance', labelBn: 'দূরত্ব (মিটার)', labelEn: 'Distance (m)', unit: 'm', defaultValue: '100' },
          { key: 'time', labelBn: 'সময় (সেকেন্ড)', labelEn: 'Time (s)', unit: 's', defaultValue: '20' },
        ],
        resultLabelBn: 'গতিবেগ',
        resultLabelEn: 'Speed',
      },
      {
        id: 'force',
        nameBn: 'বল (নিউটনের ২য় সূত্র)',
        nameEn: 'Force (Newton’s 2nd law)',
        formula: 'F = m × a',
        meaningBn: 'ভর × ত্বরণ।',
        meaningEn: 'Mass times acceleration.',
        inputs: [
          { key: 'mass', labelBn: 'ভর (কেজি)', labelEn: 'Mass (kg)', unit: 'kg', defaultValue: '10' },
          { key: 'acceleration', labelBn: 'ত্বরণ (m/s²)', labelEn: 'Acceleration (m/s²)', unit: 'm/s²', defaultValue: '2' },
        ],
        resultLabelBn: 'বল',
        resultLabelEn: 'Force',
      },
      {
        id: 'kinetic-energy',
        nameBn: 'গতিশক্তি',
        nameEn: 'Kinetic energy',
        formula: 'KE = ½mv²',
        meaningBn: 'গতির কারণে বস্তুর শক্তি।',
        meaningEn: 'Energy of a body due to its motion.',
        inputs: [
          { key: 'mass', labelBn: 'ভর (কেজি)', labelEn: 'Mass (kg)', unit: 'kg', defaultValue: '2' },
          { key: 'velocity', labelBn: 'বেগ (m/s)', labelEn: 'Velocity (m/s)', unit: 'm/s', defaultValue: '10' },
        ],
        resultLabelBn: 'গতিশক্তি',
        resultLabelEn: 'Kinetic energy',
      },
      {
        id: 'potential-energy',
        nameBn: 'স্থিতিশক্তি',
        nameEn: 'Potential energy',
        formula: 'PE = mgh (g = 9.8 m/s²)',
        meaningBn: 'উচ্চতার কারণে বস্তুর শক্তি।',
        meaningEn: 'Energy of a body due to its height.',
        inputs: [
          { key: 'mass', labelBn: 'ভর (কেজি)', labelEn: 'Mass (kg)', unit: 'kg', defaultValue: '5' },
          { key: 'height', labelBn: 'উচ্চতা (মিটার)', labelEn: 'Height (m)', unit: 'm', defaultValue: '10' },
        ],
        resultLabelBn: 'স্থিতিশক্তি',
        resultLabelEn: 'Potential energy',
      },
      {
        id: 'work',
        nameBn: 'কাজ',
        nameEn: 'Work',
        formula: 'W = F × d',
        meaningBn: 'বল × সরণ।',
        meaningEn: 'Force times displacement.',
        inputs: [
          { key: 'force', labelBn: 'বল (নিউটন)', labelEn: 'Force (N)', unit: 'N', defaultValue: '20' },
          { key: 'distance', labelBn: 'সরণ (মিটার)', labelEn: 'Distance (m)', unit: 'm', defaultValue: '5' },
        ],
        resultLabelBn: 'কাজ',
        resultLabelEn: 'Work',
      },
      {
        id: 'power',
        nameBn: 'ক্ষমতা',
        nameEn: 'Power',
        formula: 'P = W ÷ t',
        meaningBn: 'একক সময়ে কৃত কাজ।',
        meaningEn: 'Work done per unit time.',
        inputs: [
          { key: 'work', labelBn: 'কাজ (জুল)', labelEn: 'Work (J)', unit: 'J', defaultValue: '1000' },
          { key: 'time', labelBn: 'সময় (সেকেন্ড)', labelEn: 'Time (s)', unit: 's', defaultValue: '10' },
        ],
        resultLabelBn: 'ক্ষমতা',
        resultLabelEn: 'Power',
      },
      {
        id: 'ohms-law',
        nameBn: 'ওহমের সূত্র',
        nameEn: 'Ohm’s law',
        formula: 'V = I × R',
        meaningBn: 'বিভব পার্থক্য = তড়িৎপ্রবাহ × রোধ।',
        meaningEn: 'Voltage = current × resistance.',
        inputs: [
          { key: 'current', labelBn: 'তড়িৎপ্রবাহ (অ্যাম্পিয়ার)', labelEn: 'Current (A)', unit: 'A', defaultValue: '2' },
          { key: 'resistance', labelBn: 'রোধ (ওহম)', labelEn: 'Resistance (Ω)', unit: 'Ω', defaultValue: '5' },
        ],
        resultLabelBn: 'বিভব পার্থক্য',
        resultLabelEn: 'Voltage',
      },
    ],
  },
];
