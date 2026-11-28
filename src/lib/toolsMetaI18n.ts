// Eduvelto — per-language overlay for the TOP-20 tools' meta + the
// phased core pages' SEO (owner order 28 Nov 2026, phased 8-language
// rollout).
//
// SCOPE (honest): ONLY the 20 slugs in TOP_20_TOOL_SLUGS and the 6
// phased pages ('/', '/tools', '/free-quiz', '/about', '/support',
// '/contact') have translations here. The other 245 tools keep their
// bn/en meta (English fallback for the 6 new languages) — NEVER claim
// all 265 tools are in 8 languages.
//
// Consulted by:
// - resolveRouteSeo() (src/lib/seo.ts) — tool pages + phased static
//   routes return the translated title/description/crumb.
// - ToolsDetailPage — page title, description, breadcrumb, share
//   title, embed title and related-tool cards.
// - ToolsHubPage — tool card titles/descriptions.
// A missing entry falls back to the bn/en meta (English for the new
// languages) — never blank, never a raw key.

import type { ToolMeta } from './toolsMeta';
import { isPhasedLang, type PhasedLang } from '../i18n/phasedStrings';

export type LocalisedMeta = { title: string; description: string; crumb: string };

export const TOP_20_TOOL_SLUGS: readonly string[] = [
  'pdf-merger',
  'pdf-splitter',
  'pdf-compressor',
  'pdf-to-jpg',
  'pdf-to-word',
  'pdf-page-reorder',
  'pdf-watermark',
  'image-to-pdf',
  'text-to-pdf',
  'image-resizer',
  'image-cropper',
  'jpg-to-png',
  'png-to-jpg',
  'webp-converter',
  'heic-to-jpg',
  'image-compressor',
  'bmi-calculator',
  'qr-code-generator',
  'word-counter',
  'age-calculator',
];

export const TOOL_META_I18N: Record<string, Partial<Record<PhasedLang, LocalisedMeta>>> = {
  'pdf-merger': {
    hi: { title: 'PDF मर्जर', description: 'कई PDF फ़ाइलों को मिलाकर एक PDF बनाएँ। फ़ाइलें आपके ब्राउज़र में ही प्रोसेस होती हैं, कभी अपलोड नहीं होतीं।', crumb: 'PDF मर्जर' },
    ar: { title: 'دمج PDF', description: 'ادمج عدة ملفات PDF في ملف PDF واحد. تتم معالجة الملفات في متصفحك ولا تُرفع أبداً.', crumb: 'دمج PDF' },
    es: { title: 'Unir PDF', description: 'Combina varios archivos PDF en un solo PDF. Los archivos se procesan en tu navegador y nunca se suben.', crumb: 'Unir PDF' },
    pt: { title: 'Unir PDF', description: 'Combine vários arquivos PDF em um só PDF. Os arquivos são processados no seu navegador e nunca são enviados.', crumb: 'Unir PDF' },
    fr: { title: 'Fusionner des PDF', description: 'Combinez plusieurs fichiers PDF en un seul PDF. Les fichiers sont traités dans votre navigateur et ne sont jamais envoyés.', crumb: 'Fusionner des PDF' },
    id: { title: 'Gabung PDF', description: 'Gabungkan beberapa file PDF menjadi satu PDF. File diproses di browser Anda dan tidak pernah diunggah.', crumb: 'Gabung PDF' },
  },
  'pdf-splitter': {
    hi: { title: 'PDF स्प्लिटर', description: 'किसी PDF से चुने हुए पृष्ठ अलग करके नया PDF बनाएँ।', crumb: 'PDF स्प्लिटर' },
    ar: { title: 'تقسيم PDF', description: 'قسّم ملف PDF واحفظ الصفحات المحددة في ملف PDF جديد.', crumb: 'تقسيم PDF' },
    es: { title: 'Dividir PDF', description: 'Divide un PDF y guarda las páginas seleccionadas como un nuevo PDF.', crumb: 'Dividir PDF' },
    pt: { title: 'Dividir PDF', description: 'Divida um PDF e salve as páginas selecionadas como um novo PDF.', crumb: 'Dividir PDF' },
    fr: { title: 'Diviser un PDF', description: 'Divisez un PDF et enregistrez les pages sélectionnées dans un nouveau PDF.', crumb: 'Diviser un PDF' },
    id: { title: 'Pisah PDF', description: 'Pisahkan PDF dan simpan halaman yang dipilih sebagai PDF baru.', crumb: 'Pisah PDF' },
  },
  'pdf-compressor': {
    hi: { title: 'PDF कंप्रेसर', description: 'PDF फ़ाइल का आकार छोटा करें, ताकि साझा या अपलोड करना आसान हो।', crumb: 'PDF कंप्रेसर' },
    ar: { title: 'ضغط PDF', description: 'قلّل حجم ملف PDF ليسهل مشاركته أو رفعه.', crumb: 'ضغط PDF' },
    es: { title: 'Comprimir PDF', description: 'Reduce el tamaño de un archivo PDF para compartirlo o subirlo más fácilmente.', crumb: 'Comprimir PDF' },
    pt: { title: 'Comprimir PDF', description: 'Reduza o tamanho de um arquivo PDF para facilitar o compartilhamento ou o envio.', crumb: 'Comprimir PDF' },
    fr: { title: 'Compresser un PDF', description: 'Réduisez la taille d’un fichier PDF pour le partager ou l’envoyer plus facilement.', crumb: 'Compresser un PDF' },
    id: { title: 'Kompres PDF', description: 'Perkecil ukuran file PDF agar lebih mudah dibagikan atau diunggah.', crumb: 'Kompres PDF' },
  },
  'pdf-to-jpg': {
    hi: { title: 'PDF से JPG', description: 'PDF के पृष्ठों को JPG छवियों में बदलें।', crumb: 'PDF से JPG' },
    ar: { title: 'PDF إلى JPG', description: 'حوّل صفحات PDF إلى صور JPG.', crumb: 'PDF إلى JPG' },
    es: { title: 'PDF a JPG', description: 'Convierte las páginas de un PDF en imágenes JPG.', crumb: 'PDF a JPG' },
    pt: { title: 'PDF para JPG', description: 'Converta páginas de PDF em imagens JPG.', crumb: 'PDF para JPG' },
    fr: { title: 'PDF vers JPG', description: 'Convertissez les pages d’un PDF en images JPG.', crumb: 'PDF vers JPG' },
    id: { title: 'PDF ke JPG', description: 'Ubah halaman PDF menjadi gambar JPG.', crumb: 'PDF ke JPG' },
  },
  'pdf-to-word': {
    hi: { title: 'PDF से Word', description: 'PDF के पाठ को संपादन योग्य Word (.docx) फ़ाइल में बदलें — अपने बांग्ला और अंग्रेज़ी फ़ॉन्ट खुद चुनें।', crumb: 'PDF से Word' },
    ar: { title: 'PDF إلى Word', description: 'حوّل نص PDF إلى ملف Word ‏(.docx)‏ قابل للتحرير — اختر خطوط البنغالية والإنجليزية بنفسك.', crumb: 'PDF إلى Word' },
    es: { title: 'PDF a Word', description: 'Convierte el texto de un PDF en un archivo Word (.docx) editable — elige tus propias fuentes en bengalí e inglés.', crumb: 'PDF a Word' },
    pt: { title: 'PDF para Word', description: 'Converta o texto de um PDF em um arquivo Word (.docx) editável — escolha suas próprias fontes em bengali e inglês.', crumb: 'PDF para Word' },
    fr: { title: 'PDF vers Word', description: 'Convertissez le texte d’un PDF en un fichier Word (.docx) modifiable — choisissez vos propres polices bengali et anglaise.', crumb: 'PDF vers Word' },
    id: { title: 'PDF ke Word', description: 'Ubah teks PDF menjadi file Word (.docx) yang bisa diedit — pilih sendiri font Bangla dan Inggris Anda.', crumb: 'PDF ke Word' },
  },
  'pdf-page-reorder': {
    hi: { title: 'PDF पृष्ठ क्रम बदलें', description: 'PDF के पृष्ठों को फिर से व्यवस्थित या घुमाकर नए क्रम में सजाएँ।', crumb: 'PDF पृष्ठ क्रम बदलें' },
    ar: { title: 'إعادة ترتيب صفحات PDF', description: 'أعد ترتيب صفحات PDF أو أدرها بترتيب جديد.', crumb: 'إعادة ترتيب صفحات PDF' },
    es: { title: 'Reordenar páginas de PDF', description: 'Reordena o gira las páginas de un PDF en un nuevo orden.', crumb: 'Reordenar páginas de PDF' },
    pt: { title: 'Reordenar páginas do PDF', description: 'Reorganize ou gire as páginas de um PDF em uma nova ordem.', crumb: 'Reordenar páginas do PDF' },
    fr: { title: 'Réorganiser les pages du PDF', description: 'Réorganisez ou faites pivoter les pages d’un PDF dans un nouvel ordre.', crumb: 'Réorganiser les pages du PDF' },
    id: { title: 'Susun Ulang Halaman PDF', description: 'Susun ulang atau putar halaman PDF ke urutan baru.', crumb: 'Susun Ulang Halaman PDF' },
  },
  'pdf-watermark': {
    hi: { title: 'PDF वॉटरमार्क', description: 'PDF के हर पृष्ठ पर अपना नाम या पाठ वॉटरमार्क के रूप में लगाएँ।', crumb: 'PDF वॉटरमार्क' },
    ar: { title: 'علامة PDF المائية', description: 'أضف اسمك أو نصاً كعلامة مائية على كل صفحة من صفحات PDF.', crumb: 'علامة PDF المائية' },
    es: { title: 'Marca de agua en PDF', description: 'Añade tu nombre o un texto como marca de agua en cada página de un PDF.', crumb: 'Marca de agua en PDF' },
    pt: { title: 'Marca d\'água em PDF', description: 'Adicione seu nome ou um texto como marca d\'água em cada página de um PDF.', crumb: 'Marca d\'água em PDF' },
    fr: { title: 'Filigrane PDF', description: 'Ajoutez votre nom ou un texte en filigrane sur chaque page d’un PDF.', crumb: 'Filigrane PDF' },
    id: { title: 'Watermark PDF', description: 'Tambahkan nama atau teks Anda sebagai watermark di setiap halaman PDF.', crumb: 'Watermark PDF' },
  },
  'image-to-pdf': {
    hi: { title: 'छवि से PDF', description: 'एक या अधिक छवियों को PDF फ़ाइल में बदलें।', crumb: 'छवि से PDF' },
    ar: { title: 'صورة إلى PDF', description: 'حوّل صورة أو أكثر إلى ملف PDF.', crumb: 'صورة إلى PDF' },
    es: { title: 'Imagen a PDF', description: 'Convierte una o más imágenes en un archivo PDF.', crumb: 'Imagen a PDF' },
    pt: { title: 'Imagem para PDF', description: 'Transforme uma ou mais imagens em um arquivo PDF.', crumb: 'Imagem para PDF' },
    fr: { title: 'Image vers PDF', description: 'Transformez une ou plusieurs images en un fichier PDF.', crumb: 'Image vers PDF' },
    id: { title: 'Gambar ke PDF', description: 'Ubah satu gambar atau lebih menjadi file PDF.', crumb: 'Gambar ke PDF' },
  },
  'text-to-pdf': {
    hi: { title: 'टेक्स्ट से PDF', description: 'सादे पाठ या Markdown से PDF फ़ाइल बनाएँ।', crumb: 'टेक्स्ट से PDF' },
    ar: { title: 'نص إلى PDF', description: 'أنشئ ملف PDF من نص عادي أو Markdown.', crumb: 'نص إلى PDF' },
    es: { title: 'Texto a PDF', description: 'Crea un archivo PDF a partir de texto sin formato o Markdown.', crumb: 'Texto a PDF' },
    pt: { title: 'Texto para PDF', description: 'Crie um arquivo PDF a partir de texto simples ou Markdown.', crumb: 'Texto para PDF' },
    fr: { title: 'Texte vers PDF', description: 'Créez un fichier PDF à partir de texte brut ou de Markdown.', crumb: 'Texte vers PDF' },
    id: { title: 'Teks ke PDF', description: 'Buat file PDF dari teks biasa atau Markdown.', crumb: 'Teks ke PDF' },
  },
  'image-resizer': {
    hi: { title: 'इमेज रिसाइज़र', description: 'किसी छवि का आकार बदलें — पासपोर्ट फोटो और आवेदनों के लिए तय साइज़ भी चुन सकते हैं।', crumb: 'इमेज रिसाइज़र' },
    ar: { title: 'تغيير حجم الصور', description: 'غيّر أبعاد الصورة، بما في ذلك المقاسات الجاهزة لصور جواز السفر والطلبات.', crumb: 'تغيير حجم الصور' },
    es: { title: 'Redimensionador de imágenes', description: 'Cambia las dimensiones de una imagen, incluidos los tamaños predefinidos para fotos de pasaporte y solicitudes.', crumb: 'Redimensionador de imágenes' },
    pt: { title: 'Redimensionador de imagens', description: 'Altere as dimensões de uma imagem, incluindo tamanhos predefinidos para fotos de passaporte e candidaturas.', crumb: 'Redimensionador de imagens' },
    fr: { title: 'Redimensionneur d’images', description: 'Modifiez les dimensions d’une image, y compris les tailles prédéfinies pour les photos de passeport et les candidatures.', crumb: 'Redimensionneur d’images' },
    id: { title: 'Pengubah Ukuran Gambar', description: 'Ubah dimensi gambar, termasuk ukuran preset untuk foto paspor dan lamaran.', crumb: 'Pengubah Ukuran Gambar' },
  },
  'image-cropper': {
    hi: { title: 'छवि काटने वाला', description: 'छवि के अनचाहे हिस्से काटकर केवल ज़रूरी हिस्सा रखें।', crumb: 'छवि काटने वाला' },
    ar: { title: 'قص الصور', description: 'اقتطع الأجزاء غير المرغوبة من الصورة واحتفظ بالجزء الذي تحتاجه فقط.', crumb: 'قص الصور' },
    es: { title: 'Recortador de imágenes', description: 'Corta las partes no deseadas de una imagen y quédate solo con la parte que necesitas.', crumb: 'Recortador de imágenes' },
    pt: { title: 'Cortador de imagens', description: 'Corte as partes indesejadas de uma imagem e fique apenas com a parte necessária.', crumb: 'Cortador de imagens' },
    fr: { title: 'Rogneur d\'images', description: 'Découpez les parties indésirables d’une image et ne gardez que la partie utile.', crumb: 'Rogneur d\'images' },
    id: { title: 'Pemotong Gambar', description: 'Potong bagian gambar yang tidak diinginkan dan simpan hanya bagian yang Anda butuhkan.', crumb: 'Pemotong Gambar' },
  },
  'jpg-to-png': {
    hi: { title: 'JPG से PNG', description: 'JPG छवि को PNG प्रारूप में बदलें।', crumb: 'JPG से PNG' },
    ar: { title: 'JPG إلى PNG', description: 'حوّل صورة JPG إلى صيغة PNG.', crumb: 'JPG إلى PNG' },
    es: { title: 'JPG a PNG', description: 'Convierte una imagen JPG a formato PNG.', crumb: 'JPG a PNG' },
    pt: { title: 'JPG para PNG', description: 'Converta uma imagem JPG para o formato PNG.', crumb: 'JPG para PNG' },
    fr: { title: 'JPG vers PNG', description: 'Convertissez une image JPG au format PNG.', crumb: 'JPG vers PNG' },
    id: { title: 'JPG ke PNG', description: 'Ubah gambar JPG ke format PNG.', crumb: 'JPG ke PNG' },
  },
  'png-to-jpg': {
    hi: { title: 'PNG से JPG', description: 'PNG छवि को JPG प्रारूप में बदलें।', crumb: 'PNG से JPG' },
    ar: { title: 'PNG إلى JPG', description: 'حوّل صورة PNG إلى صيغة JPG.', crumb: 'PNG إلى JPG' },
    es: { title: 'PNG a JPG', description: 'Convierte una imagen PNG a formato JPG.', crumb: 'PNG a JPG' },
    pt: { title: 'PNG para JPG', description: 'Converta uma imagem PNG para o formato JPG.', crumb: 'PNG para JPG' },
    fr: { title: 'PNG vers JPG', description: 'Convertissez une image PNG au format JPG.', crumb: 'PNG vers JPG' },
    id: { title: 'PNG ke JPG', description: 'Ubah gambar PNG ke format JPG.', crumb: 'PNG ke JPG' },
  },
  'webp-converter': {
    hi: { title: 'WebP कनवर्टर', description: 'छवियों को आधुनिक WebP प्रारूप में बदलें, या WebP से किसी अन्य प्रारूप में बदलें।', crumb: 'WebP कनवर्टर' },
    ar: { title: 'محوّل WebP', description: 'حوّل الصور إلى صيغة WebP الحديثة، أو من WebP إلى صيغة أخرى.', crumb: 'محوّل WebP' },
    es: { title: 'Convertidor WebP', description: 'Convierte imágenes al moderno formato WebP, o de WebP a otro formato.', crumb: 'Convertidor WebP' },
    pt: { title: 'Conversor WebP', description: 'Converta imagens para o moderno formato WebP, ou de WebP para outro formato.', crumb: 'Conversor WebP' },
    fr: { title: 'Convertisseur WebP', description: 'Convertissez des images au format moderne WebP, ou de WebP vers un autre format.', crumb: 'Convertisseur WebP' },
    id: { title: 'Konverter WebP', description: 'Ubah gambar ke format WebP yang modern, atau dari WebP ke format lain.', crumb: 'Konverter WebP' },
  },
  'heic-to-jpg': {
    hi: { title: 'HEIC से JPG', description: 'iPhone की HEIC फ़ोटो को JPG में बदलें, ताकि वह हर जगह खुले।', crumb: 'HEIC से JPG' },
    ar: { title: 'HEIC إلى JPG', description: 'حوّل صورة HEIC من iPhone إلى JPG لتفتح في كل مكان.', crumb: 'HEIC إلى JPG' },
    es: { title: 'HEIC a JPG', description: 'Convierte una foto HEIC de iPhone a JPG para que se abra en todas partes.', crumb: 'HEIC a JPG' },
    pt: { title: 'HEIC para JPG', description: 'Converta uma foto HEIC do iPhone para JPG para abrir em qualquer lugar.', crumb: 'HEIC para JPG' },
    fr: { title: 'HEIC vers JPG', description: 'Convertissez une photo HEIC d’iPhone en JPG pour l’ouvrir partout.', crumb: 'HEIC vers JPG' },
    id: { title: 'HEIC ke JPG', description: 'Ubah foto HEIC iPhone ke JPG agar bisa dibuka di mana saja.', crumb: 'HEIC ke JPG' },
  },
  'image-compressor': {
    hi: { title: 'छवि कंप्रेसर', description: 'छवि फ़ाइल को छोटा करें, जितनी संभव हो उतनी गुणवत्ता बनाए रखते हुए।', crumb: 'छवि कंप्रेसर' },
    ar: { title: 'ضغط الصور', description: 'صغّر ملف الصورة مع الحفاظ على أكبر قدر ممكن من الجودة.', crumb: 'ضغط الصور' },
    es: { title: 'Comprimir imagen', description: 'Haz un archivo de imagen más pequeño manteniendo la mayor calidad posible.', crumb: 'Comprimir imagen' },
    pt: { title: 'Comprimir imagem', description: 'Deixe um arquivo de imagem menor mantendo o máximo de qualidade possível.', crumb: 'Comprimir imagem' },
    fr: { title: 'Compresser une image', description: 'Réduisez un fichier image tout en conservant un maximum de qualité.', crumb: 'Compresser une image' },
    id: { title: 'Kompres Gambar', description: 'Perkecil file gambar sambil mempertahankan kualitas sebanyak mungkin.', crumb: 'Kompres Gambar' },
  },
  'bmi-calculator': {
    hi: { title: 'BMI कैलकुलेटर', description: 'ऊँचाई और वज़न से बॉडी मास इंडेक्स (BMI) निकालें।', crumb: 'BMI' },
    ar: { title: 'حاسبة مؤشر كتلة الجسم', description: 'احسب مؤشر كتلة الجسم (BMI) من الطول والوزن.', crumb: 'BMI' },
    es: { title: 'Calculadora de IMC', description: 'Calcula el índice de masa corporal (IMC) a partir de la altura y el peso.', crumb: 'BMI' },
    pt: { title: 'Calculadora de IMC', description: 'Calcule o índice de massa corporal (IMC) a partir da altura e do peso.', crumb: 'BMI' },
    fr: { title: 'Calculateur d\'IMC', description: 'Calculez l’indice de masse corporelle (IMC) à partir de la taille et du poids.', crumb: 'BMI' },
    id: { title: 'Kalkulator BMI', description: 'Hitung indeks massa tubuh (BMI) dari tinggi dan berat badan.', crumb: 'BMI' },
  },
  'qr-code-generator': {
    hi: { title: 'QR कोड जनरेटर', description: 'लिंक, पाठ, Wi-Fi या संपर्क विवरण के लिए QR कोड बनाएँ।', crumb: 'QR कोड जनरेटर' },
    ar: { title: 'منشئ رمز QR', description: 'أنشئ رموز QR للروابط أو النصوص أو Wi-Fi أو بيانات الاتصال.', crumb: 'منشئ رمز QR' },
    es: { title: 'Generador de códigos QR', description: 'Crea códigos QR para enlaces, texto, Wi-Fi o datos de contacto.', crumb: 'Generador de códigos QR' },
    pt: { title: 'Gerador de QR Code', description: 'Crie QR codes para links, texto, Wi-Fi ou dados de contato.', crumb: 'Gerador de QR Code' },
    fr: { title: 'Générateur de QR codes', description: 'Créez des QR codes pour des liens, du texte, le Wi-Fi ou des coordonnées.', crumb: 'Générateur de QR codes' },
    id: { title: 'Pembuat Kode QR', description: 'Buat kode QR untuk tautan, teks, Wi-Fi, atau detail kontak.', crumb: 'Pembuat Kode QR' },
  },
  'word-counter': {
    hi: { title: 'शब्द गिनने वाला', description: 'किसी पाठ के शब्द, अक्षर और पढ़ने का समय गिनें।', crumb: 'शब्द गिनने वाला' },
    ar: { title: 'عدّاد الكلمات', description: 'احسب كلمات النص وأحرفه ووقت قراءته.', crumb: 'عدّاد الكلمات' },
    es: { title: 'Contador de palabras', description: 'Cuenta las palabras, los caracteres y el tiempo de lectura de un texto.', crumb: 'Contador de palabras' },
    pt: { title: 'Contador de palavras', description: 'Conte as palavras, os caracteres e o tempo de leitura de um texto.', crumb: 'Contador de palavras' },
    fr: { title: 'Compteur de mots', description: 'Comptez les mots, les caractères et le temps de lecture d’un texte.', crumb: 'Compteur de mots' },
    id: { title: 'Penghitung Kata', description: 'Hitung kata, karakter, dan waktu baca dari sebuah teks.', crumb: 'Penghitung Kata' },
  },
  'age-calculator': {
    hi: { title: 'आयु कैलकुलेटर', description: 'जन्म तिथि से वर्ष, माह और दिन में आयु निकालें।', crumb: 'आयु कैलकुलेटर' },
    ar: { title: 'حاسبة العمر', description: 'احسب العمر بالسنوات والأشهر والأيام من تاريخ الميلاد.', crumb: 'حاسبة العمر' },
    es: { title: 'Calculadora de edad', description: 'Calcula la edad en años, meses y días a partir de la fecha de nacimiento.', crumb: 'Calculadora de edad' },
    pt: { title: 'Calculadora de idade', description: 'Calcule a idade em anos, meses e dias a partir da data de nascimento.', crumb: 'Calculadora de idade' },
    fr: { title: 'Calculateur d\'âge', description: 'Calculez l’âge en années, mois et jours à partir de la date de naissance.', crumb: 'Calculateur d\'âge' },
    id: { title: 'Kalkulator Usia', description: 'Hitung usia dalam tahun, bulan, dan hari dari tanggal lahir.', crumb: 'Kalkulator Usia' },
  },
};

// ---------------------------------------------------------------------------
// Phased core pages' SEO (same 6 languages). Titles/descriptions are
// translations of the bn/en STATIC_ROUTES entries in src/lib/seo.ts —
// the English source is quoted in the test, so a drift there fails
// loudly instead of shipping a wrong title.
// ---------------------------------------------------------------------------

export const PHASED_ROUTE_PATHS: readonly string[] = [
  '/',
  '/tools',
  '/free-quiz',
  '/about',
  '/support',
  '/contact',
];

export const ROUTE_SEO_I18N: Record<string, Partial<Record<PhasedLang, LocalisedMeta>>> = {
  '/': {
    hi: { title: 'Eduvelto — बांग्लादेश का मुफ़्त शिक्षा मंच', description: 'Eduvelto — बांग्लादेश का मुफ़्त शिक्षा मंच: BCS, बैंक, प्राथमिक शिक्षक, NTRCA और विश्वविद्यालय प्रवेश, MCQ परीक्षाएँ और डिजिटल लाइब्रेरी — पूरी तरह मुफ़्त।', crumb: 'होम' },
    ar: { title: 'Eduvelto — منصة التعليم المجانية في بنغلاديش', description: 'Eduvelto — منصة التعليم المجانية في بنغلاديش: التحضير لامتحانات BCS والبنوك والمعلمين الابتدائيين وNTRCA والقبول الجامعي، وامتحانات MCQ ومكتبة رقمية — مجانية تماماً.', crumb: 'الرئيسية' },
    es: { title: 'Eduvelto — la plataforma educativa gratuita de Bangladés', description: 'Eduvelto — la plataforma educativa gratuita de Bangladés: preparación BCS, banca, maestro de primaria, NTRCA y admisión universitaria, exámenes MCQ y biblioteca digital, totalmente gratis.', crumb: 'Inicio' },
    pt: { title: 'Eduvelto — a plataforma de educação gratuita de Bangladesh', description: 'Eduvelto — a plataforma de educação gratuita de Bangladesh: preparação BCS, bancos, professor primário, NTRCA e admissão universitária, provas MCQ e biblioteca digital, totalmente grátis.', crumb: 'Início' },
    fr: { title: 'Eduvelto — la plateforme éducative gratuite du Bangladesh', description: 'Eduvelto — la plateforme éducative gratuite du Bangladesh : préparation BCS, banque, enseignant du primaire, NTRCA et admission universitaire, examens QCM et bibliothèque numérique, entièrement gratuite.', crumb: 'Accueil' },
    id: { title: 'Eduvelto — Platform Pendidikan Gratis Bangladesh', description: 'Eduvelto — platform pendidikan gratis Bangladesh: persiapan BCS, bank, guru SD, NTRCA, dan penerimaan universitas, ujian MCQ, dan perpustakaan digital — sepenuhnya gratis.', crumb: 'Beranda' },
  },
  '/tools': {
    hi: { title: 'मुफ़्त टूल्स — PDF, छवियाँ, कैलकुलेटर और पढ़ाई | Eduvelto', description: '141 मुफ़्त टूल्स — PDF, छवियाँ, कैलकुलेटर, स्वास्थ्य, पढ़ाई और नौकरी की तैयारी। सब कुछ आपके ब्राउज़र में ही चलता है; फ़ाइलें कभी अपलोड नहीं होतीं। Eduvelto।', crumb: 'टूल्स' },
    ar: { title: 'أدوات مجانية — PDF والصور والآلات الحاسبة والدراسة | Eduvelto', description: '141 أداة مجانية — PDF والصور والآلات الحاسبة والصحة والدراسة والتحضير للوظائف. كل شيء يعمل في متصفحك؛ ولا تُرفع الملفات أبداً. Eduvelto.', crumb: 'الأدوات' },
    es: { title: 'Herramientas gratis — PDF, imágenes, calculadoras y estudio | Eduvelto', description: '141 herramientas gratis — PDF, imágenes, calculadoras, salud, estudio y preparación para el empleo. Todo funciona en tu navegador; los archivos nunca se suben. Eduvelto.', crumb: 'Herramientas' },
    pt: { title: 'Ferramentas grátis — PDF, imagens, calculadoras e estudo | Eduvelto', description: '141 ferramentas grátis — PDF, imagens, calculadoras, saúde, estudo e preparação para emprego. Tudo funciona no seu navegador; os arquivos nunca são enviados. Eduvelto.', crumb: 'Ferramentas' },
    fr: { title: 'Outils gratuits — PDF, images, calculatrices et études | Eduvelto', description: '141 outils gratuits — PDF, images, calculatrices, santé, études et préparation à l’emploi. Tout fonctionne dans votre navigateur ; les fichiers ne sont jamais envoyés. Eduvelto.', crumb: 'Outils' },
    id: { title: 'Alat Gratis — PDF, Gambar, Kalkulator & Belajar | Eduvelto', description: '141 alat gratis — PDF, gambar, kalkulator, kesehatan, belajar, dan persiapan kerja. Semuanya berjalan di browser Anda; file tidak pernah diunggah. Eduvelto.', crumb: 'Alat' },
  },
  '/free-quiz': {
    hi: { title: 'मुफ़्त क्विज़ — सत्यापित प्रश्नों से 10 प्रश्न | Eduvelto', description: 'Eduvelto का मुफ़्त क्विज़ — 10 प्रश्न, 5 मिनट, सत्यापित प्रश्न बैंक से। पूरी तरह मुफ़्त।', crumb: 'मुफ़्त क्विज़' },
    ar: { title: 'اختبار مجاني — 10 أسئلة من بنك أسئلة موثّق | Eduvelto', description: 'اختبار Eduvelto المجاني — 10 أسئلة، 5 دقائق، من بنك أسئلة موثّق. مجاني تماماً.', crumb: 'اختبار مجاني' },
    es: { title: 'Cuestionario gratis — 10 preguntas verificadas | Eduvelto', description: 'Cuestionario gratis de Eduvelto — 10 preguntas, 5 minutos, del banco de preguntas verificadas. Totalmente gratis.', crumb: 'Cuestionario gratis' },
    pt: { title: 'Quiz grátis — 10 perguntas verificadas | Eduvelto', description: 'Quiz grátis da Eduvelto — 10 perguntas, 5 minutos, do banco de perguntas verificadas. Totalmente grátis.', crumb: 'Quiz grátis' },
    fr: { title: 'Quiz gratuit — 10 questions vérifiées | Eduvelto', description: 'Quiz gratuit d’Eduvelto — 10 questions, 5 minutes, tirées de la banque de questions vérifiées. Entièrement gratuit.', crumb: 'Quiz gratuit' },
    id: { title: 'Kuis Gratis — 10 Soal Terverifikasi | Eduvelto', description: 'Kuis gratis Eduvelto — 10 soal, 5 menit, dari bank soal terverifikasi. Sepenuhnya gratis.', crumb: 'Kuis Gratis' },
  },
  '/about': {
    hi: { title: 'Eduvelto के बारे में — बांग्लादेश का मुफ़्त शिक्षा मंच', description: 'Eduvelto बांग्लादेश के छात्रों के लिए एक मुफ़्त डिजिटल शिक्षा मंच है — पाठ, परीक्षाएँ और डिजिटल लाइब्रेरी एक जगह।', crumb: 'हमारे बारे में' },
    ar: { title: 'عن Eduvelto — منصة التعليم المجانية في بنغلاديش', description: 'Eduvelto منصة تعليمية رقمية مجانية لطلاب بنغلاديش — دروس وامتحانات ومكتبة رقمية في مكان واحد.', crumb: 'من نحن' },
    es: { title: 'Acerca de Eduvelto — la plataforma educativa gratuita de Bangladés', description: 'Eduvelto es una plataforma educativa digital gratuita para los estudiantes de Bangladés: lecciones, exámenes y una biblioteca digital en un solo lugar.', crumb: 'Acerca de' },
    pt: { title: 'Sobre a Eduvelto — a plataforma de educação gratuita de Bangladesh', description: 'A Eduvelto é uma plataforma de educação digital gratuita para os estudantes de Bangladesh — lições, provas e uma biblioteca digital em um só lugar.', crumb: 'Sobre' },
    fr: { title: 'À propos d’Eduvelto — la plateforme éducative gratuite du Bangladesh', description: 'Eduvelto est une plateforme éducative numérique gratuite pour les élèves du Bangladesh — leçons, examens et bibliothèque numérique au même endroit.', crumb: 'À propos' },
    id: { title: 'Tentang Eduvelto — Platform Pendidikan Gratis Bangladesh', description: 'Eduvelto adalah platform pendidikan digital gratis untuk pelajar Bangladesh — pelajaran, ujian, dan perpustakaan digital dalam satu tempat.', crumb: 'Tentang' },
  },
  '/support': {
    hi: { title: 'Eduvelto की सहायता करें — Eduvelto', description: 'Eduvelto पूरी तरह मुफ़्त है — स्वेच्छा से सहायता करें। bKash/Nagad से भेजें और TrxID के साथ अपना नाम दर्ज करें। आपका सहयोग मुफ़्त शिक्षा को जारी रखता है।', crumb: 'सहायता करें' },
    ar: { title: 'ادعم Eduvelto — Eduvelto', description: 'Eduvelto مجانية تماماً — ادعمها طوعاً. أرسل عبر bKash/Nagad وسجّل اسمك مع رقم المعاملة TrxID. دعمك يُبقي التعليم المجاني مستمراً.', crumb: 'ادعم' },
    es: { title: 'Apoya a Eduvelto — Eduvelto', description: 'Eduvelto es totalmente gratis — apóyala voluntariamente. Envía por bKash/Nagad y registra tu nombre con el TrxID. Tu apoyo mantiene la educación gratuita.', crumb: 'Apoyar' },
    pt: { title: 'Apoie a Eduvelto — Eduvelto', description: 'A Eduvelto é totalmente grátis — apoie voluntariamente. Envie via bKash/Nagad e registre seu nome com o TrxID. Seu apoio mantém a educação gratuita.', crumb: 'Apoiar' },
    fr: { title: 'Soutenir Eduvelto — Eduvelto', description: 'Eduvelto est entièrement gratuite — soutenez-la volontairement. Envoyez via bKash/Nagad et enregistrez votre nom avec le TrxID. Votre soutien fait vivre l’éducation gratuite.', crumb: 'Soutenir' },
    id: { title: 'Dukung Eduvelto — Eduvelto', description: 'Eduvelto sepenuhnya gratis — dukung secara sukarela. Kirim via bKash/Nagad dan catat nama Anda dengan TrxID. Dukungan Anda menjaga pendidikan gratis tetap berjalan.', crumb: 'Dukung' },
  },
  '/contact': {
    hi: { title: 'संपर्क — Eduvelto', description: 'Eduvelto से संपर्क करें — ahmmizan23@gmail.com। बांग्लादेश के मुफ़्त शिक्षा मंच के बारे में जानने के लिए लिखें।', crumb: 'संपर्क' },
    ar: { title: 'اتصل بنا — Eduvelto', description: 'تواصل مع Eduvelto — ahmmizan23@gmail.com. راسلنا لمعرفة المزيد عن منصة التعليم المجانية في بنغلاديش.', crumb: 'اتصل بنا' },
    es: { title: 'Contacto — Eduvelto', description: 'Contacta con Eduvelto — ahmmizan23@gmail.com. Escribe para saber más sobre la plataforma educativa gratuita de Bangladés.', crumb: 'Contacto' },
    pt: { title: 'Contato — Eduvelto', description: 'Fale com a Eduvelto — ahmmizan23@gmail.com. Escreva para saber mais sobre a plataforma de educação gratuita de Bangladesh.', crumb: 'Contato' },
    fr: { title: 'Contact — Eduvelto', description: 'Contactez Eduvelto — ahmmizan23@gmail.com. Écrivez-nous pour en savoir plus sur la plateforme éducative gratuite du Bangladesh.', crumb: 'Contact' },
    id: { title: 'Kontak — Eduvelto', description: 'Hubungi Eduvelto — ahmmizan23@gmail.com. Tulis untuk mengetahui lebih lanjut tentang platform pendidikan gratis Bangladesh.', crumb: 'Kontak' },
  },
};

/** Resolve a tool's title/description/crumb for a language. bn → the
 *  Bangla meta; en → the English meta; a phased language with an
 *  overlay entry → the overlay; anything else → the English meta
 *  (the honest fallback — never blank, never invented). */
export function toolMetaForLang(meta: ToolMeta, lang: string): LocalisedMeta {
  if (lang === 'bn') return { title: meta.titleBn, description: meta.descriptionBn, crumb: meta.crumbBn };
  if (isPhasedLang(lang)) {
    const hit = TOOL_META_I18N[meta.slug]?.[lang];
    if (hit) return hit;
  }
  return { title: meta.titleEn, description: meta.descriptionEn, crumb: meta.crumbEn };
}

/** Translated SEO for a phased core page, or null when the page/lang
 *  has no overlay (caller falls back to the bn/en STATIC_ROUTES entry). */
export function routeSeoForLang(barePath: string, lang: string): LocalisedMeta | null {
  if (!isPhasedLang(lang)) return null;
  return ROUTE_SEO_I18N[barePath]?.[lang] ?? null;
}

/** The "free tool" suffix appended to every tool meta description
 *  (mirrors the bn/en suffixes in resolveRouteSeo), per language. */
export const TOOL_DESC_SUFFIX: Record<PhasedLang, string> = {
  hi: ' — Eduvelto का मुफ़्त टूल।',
  ar: ' — أداة مجانية من Eduvelto.',
  es: ' — una herramienta gratuita de Eduvelto.',
  pt: ' — uma ferramenta gratuita da Eduvelto.',
  fr: ' — un outil gratuit d’Eduvelto.',
  id: ' — alat gratis dari Eduvelto.',
};

/** Translation of the "Tools" breadcrumb segment, per language. */
export const TOOLS_CRUMB: Record<PhasedLang, string> = {
  hi: 'टूल्स',
  ar: 'الأدوات',
  es: 'Herramientas',
  pt: 'Ferramentas',
  fr: 'Outils',
  id: 'Alat',
};
