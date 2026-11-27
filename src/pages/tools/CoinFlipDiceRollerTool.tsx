// Eduvelto — Coin Flip & Dice Roller tool UI (Text batch, 27 Nov 2026).
// Renders inside ToolsDetailPage's PageShell (no own h1 / Breadcrumb).
// Pure logic lives in src/lib/tools/textTools.ts.
// All processing is 100% in-browser; nothing is uploaded.
import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';
import { ToolHero, Tiles, ButtonRow, cardStyle, noteStyle, primaryButtonStyle, buttonStyle, activeButtonStyle } from './toolUi';
import { flipCoin, rollDice, diceTotal } from '../../lib/tools/textTools';

export function CoinFlipDiceRollerTool() {
  const { t } = useLanguage();
  const [coin, setCoin] = useState<'heads' | 'tails' | null>(null);
  const [coinFlips, setCoinFlips] = useState(0);
  const [diceCount, setDiceCount] = useState(2);
  const [rolls, setRolls] = useState<number[] | null>([3, 4]);
  const [diceRolls, setDiceRolls] = useState(0);
  const flip = () => { setCoin(flipCoin()); setCoinFlips((c) => c + 1); };
  const roll = () => {
    const result = rollDice(diceCount, 6);
    if (result !== null) { setRolls(result); setDiceRolls((c) => c + 1); }
  };
  return (
    <section className="ev-card" style={cardStyle}>
      <ToolHero titleBn="কয়েন ফ্লিপ ও ডাইস রোলার" titleEn="Coin Flip & Dice Roller" descBn="কয়েন ছুঁড়ুন বা ডাইস চালান — খেলার সিদ্ধান্তের জন্য।" descEn="Flip a coin or roll dice — for game decisions." chipBn="১০০% ব্রাউজারেই — কিছু আপলোড হয় না" chipEn="100% in-browser — nothing is uploaded" />
      <p style={{ margin: '0 0 8px', fontSize: 14, fontWeight: 600 }}>{t({ bn: 'কয়েন ফ্লিপ', en: 'Coin flip' })}</p>
      <ButtonRow>
        <button type="button" style={primaryButtonStyle} onClick={flip}>{t({ bn: 'কয়েন ছুঁড়ুন', en: 'Flip the coin' })}</button>
      </ButtonRow>
      {coin ? (
        <Tiles items={[
          { labelBn: 'ফল', labelEn: 'Result', value: coin === 'heads' ? t({ bn: 'হেড', en: 'Heads' }) : t({ bn: 'টেইল', en: 'Tails' }) },
          { labelBn: 'মোট ফ্লিপ', labelEn: 'Total flips', value: String(coinFlips) },
        ]} />
      ) : null}
      <p style={{ margin: '18px 0 8px', fontSize: 14, fontWeight: 600 }}>{t({ bn: 'ডাইস রোলার (১–৬)', en: 'Dice roller (1–6)' })}</p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <label style={{ fontSize: 14, fontWeight: 600 }}>{t({ bn: 'কয়টি ডাইস', en: 'How many dice' })}</label>
        {[1, 2, 3].map((n) => (
          <button key={n} type="button" style={diceCount === n ? activeButtonStyle : buttonStyle} onClick={() => setDiceCount(n)}>{n}</button>
        ))}
        <button type="button" style={primaryButtonStyle} onClick={roll}>{t({ bn: 'ডাইস চালান', en: 'Roll the dice' })}</button>
      </div>
      {rolls ? (
        <Tiles items={[
          { labelBn: 'ডাইস', labelEn: 'Dice', value: rolls.join(' + ') },
          { labelBn: 'মোট', labelEn: 'Total', value: String(diceTotal(rolls)) },
          { labelBn: 'মোট রোল', labelEn: 'Total rolls', value: String(diceRolls) },
        ]} />
      ) : null}
      <p style={noteStyle}>{t({ bn: 'প্রতিটি ফ্লিপ ও রোল সম্পূর্ণ দৈবচয়ন — প্রতিটি ফলের সম্ভাবনা সমান।', en: 'Every flip and roll is fully random — each outcome is equally likely.' })}</p>
    </section>
  );
}
