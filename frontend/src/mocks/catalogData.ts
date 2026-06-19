import type { AttributeValue, Brand, Category, Money, Offer, Product, Spec } from '../types/catalog'

export const categories: Category[] = [
  { id: '1', name: 'Elektronika', slug: 'elektronika', parentId: null, isLeaf: false },
  { id: '2', name: 'Dom i Ogród', slug: 'dom-i-ogrod', parentId: null, isLeaf: false },
  { id: '3', name: 'Sport', slug: 'sport', parentId: null, isLeaf: false },
  { id: '4', name: 'Moda', slug: 'moda', parentId: null, isLeaf: false },
  { id: '5', name: 'Biuro', slug: 'biuro', parentId: null, isLeaf: false },
  { id: '11', name: 'Audio', slug: 'audio', parentId: '1', isLeaf: true },
  { id: '12', name: 'Monitory', slug: 'monitory', parentId: '1', isLeaf: true },
  { id: '21', name: 'Kuchnia', slug: 'kuchnia', parentId: '2', isLeaf: true },
  { id: '22', name: 'Oświetlenie', slug: 'oswietlenie', parentId: '2', isLeaf: true },
  { id: '31', name: 'Fitness', slug: 'fitness', parentId: '3', isLeaf: true },
  { id: '32', name: 'Wearables', slug: 'wearables', parentId: '3', isLeaf: true },
  { id: '41', name: 'Okrycia', slug: 'okrycia', parentId: '4', isLeaf: true },
  { id: '42', name: 'Obuwie', slug: 'obuwie', parentId: '4', isLeaf: true },
  { id: '51', name: 'Fotele', slug: 'fotele', parentId: '5', isLeaf: true },
  { id: '52', name: 'Lampy', slug: 'lampy', parentId: '5', isLeaf: true },
]

const categoryById = new Map(categories.map((category) => [category.id, category]))

const leaf = (id: string): Category => {
  const category = categoryById.get(id)
  if (!category) {
    throw new Error(`Unknown mock category: ${id}`)
  }
  return category
}

const pln = (amount: number): Money => ({ amount, currency: 'PLN' })

const text = (code: string, name: string, value: string): AttributeValue => ({
  code,
  name,
  dataType: 'TEXT',
  unit: null,
  textValue: value,
  numValue: null,
  boolValue: null,
})

const offer = (
  id: string,
  sku: string,
  amount: number,
  stock: number,
  attributes: AttributeValue[] = [],
): Offer => ({ id, sku, price: pln(amount), stock, status: 'ACTIVE', attributes })

const brand = (id: string, name: string, slug: string): Brand => ({ id, name, slug })

const spec = (key: string, value: string): Spec => ({ key, value })

export const products: Product[] = [
  {
    id: '1',
    slug: 'sluchawki-s-900',
    name: 'Słuchawki bezprzewodowe S-900',
    description:
      'Zanurz się w dźwięku bez kompromisów. Słuchawki S-900 łączą aktywną redukcję szumów nowej ' +
      'generacji z ciepłą, szczegółową sceną dźwiękową, dzięki czemu ulubiona muzyka, podcasty i ' +
      'rozmowy brzmią dokładnie tak, jak powinny — w zatłoczonym pociągu i w domowym zaciszu.\n\n' +
      'Nauszniki z pianki z pamięcią kształtu i lekka konstrukcja sprawiają, że zapomnisz, że masz ' +
      'je na głowie nawet po całym dniu. Bateria na 40 godzin, błyskawiczne parowanie Bluetooth 5.3 ' +
      'i składane etui podróżne to wszystko, czego potrzebujesz, by zabrać swój świat dźwięku ze sobą.',
    mainImageUrl:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80',
    brand: brand('1', 'SoundWave', 'soundwave'),
    category: leaf('11'),
    priceFrom: pln(349.99),
    offers: [
      offer('1001', 'S900-BLK', 349.99, 24, [text('color', 'Kolor', 'Czarny')]),
      offer('1101', 'S900-WHT', 349.99, 12, [text('color', 'Kolor', 'Biały')]),
    ],
    specs: [
      spec('Łączność', 'Bluetooth 5.3'),
      spec('Czas pracy', '40 h'),
      spec('Redukcja szumu', 'Aktywna (ANC)'),
      spec('Waga', '250 g'),
    ],
  },
  {
    id: '2',
    slug: 'monitor-27-qhd',
    name: 'Monitor 27 cali QHD',
    description:
      'Zobacz każdy detal w rozdzielczości QHD na 27-calowym panelu IPS, który zachwyca głębią ' +
      'kolorów i szerokimi kątami widzenia. Płynne odświeżanie 165 Hz sprawia, że zarówno dynamiczne ' +
      'gry, jak i przewijanie arkuszy staje się przyjemnością dla oka.\n\n' +
      'Tryb nocny ogranicza emisję niebieskiego światła, byś mógł pracować dłużej bez zmęczenia. ' +
      'Smukłe ramki i regulowana podstawa pozwalają stworzyć ergonomiczne, eleganckie stanowisko — ' +
      'do pracy, twórczości i rozrywki.',
    mainImageUrl:
      'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=80',
    brand: brand('2', 'ViewMax', 'viewmax'),
    category: leaf('12'),
    priceFrom: pln(1199),
    offers: [offer('1002', 'VM27-QHD', 1199, 12)],
    specs: [
      spec('Przekątna', '27"'),
      spec('Rozdzielczość', '2560 x 1440'),
      spec('Odświeżanie', '165 Hz'),
      spec('Panel', 'IPS'),
    ],
  },
  {
    id: '3',
    slug: 'ekspres-barista-one',
    name: 'Ekspres ciśnieniowy Barista One',
    description:
      'Poranna kawa jak z ulubionej kawiarni — bez wychodzenia z domu. Barista One mieli świeże ' +
      'ziarna tuż przed parzeniem dzięki stalowemu młynkowi, a 19 barów ciśnienia wydobywa z nich ' +
      'pełnię aromatu i gęstą cremę.\n\n' +
      'Zapisz do 12 profili dla domowników i gości, a automatyczny system czyszczenia zadba o ' +
      'resztę. To ekspres, który zamienia codzienny rytuał w małą celebrację smaku.',
    mainImageUrl:
      'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=900&q=80',
    brand: brand('3', 'Barista', 'barista'),
    category: leaf('21'),
    priceFrom: pln(1899.5),
    offers: [offer('1003', 'BAR-ONE', 1899.5, 8)],
    specs: [
      spec('Ciśnienie', '19 bar'),
      spec('Młynek', 'Stalowy'),
      spec('Profile', '12'),
      spec('Pojemność', '1.8 l'),
    ],
  },
  {
    id: '4',
    slug: 'lampa-arc-light',
    name: 'Lampa stojąca Arc Light',
    description:
      'Arc Light to rzeźbiarski akcent, który odmienia każde wnętrze. Wygięte ramię delikatnie ' +
      'wprowadza ciepłe światło dokładnie tam, gdzie odpoczywasz — nad fotelem, kanapą czy kącikiem ' +
      'do czytania — bez oślepiającego blasku.\n\n' +
      'Płynna regulacja wysokości i barwy światła pozwala dopasować nastrój do chwili: skupioną ' +
      'jasność do lektury albo miękką poświatę na wieczór. Forma i funkcja w jednym, eleganckim geście.',
    mainImageUrl:
      'https://images.unsplash.com/photo-1549187774-b4e9b0445b41?auto=format&fit=crop&w=900&q=80',
    brand: brand('4', 'Lumio', 'lumio'),
    category: leaf('22'),
    priceFrom: pln(429),
    offers: [offer('1004', 'LUM-ARC', 429, 30)],
    specs: [
      spec('Źródło', 'LED'),
      spec('Moc', '18 W'),
      spec('Barwa', '2700–4000 K'),
      spec('Wysokość', '180 cm'),
    ],
  },
  {
    id: '5',
    slug: 'mata-pro-grip',
    name: 'Mata treningowa Pro Grip',
    description:
      'Znajdź stabilny grunt pod każdą pozycją. Mata Pro Grip o grubości 6 mm amortyzuje stawy i ' +
      'zapewnia pewny, antypoślizgowy chwyt nawet podczas intensywnego, spoconego treningu.\n\n' +
      'Wykonana z przyjaznego dla skóry materiału premium, jest lekka, łatwa do zwinięcia i ' +
      'błyskawiczna w czyszczeniu. Joga, rozciąganie czy trening siłowy w domu — Pro Grip trzyma Cię ' +
      'w ryzach.',
    mainImageUrl:
      'https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=900&q=80',
    brand: brand('5', 'FitCore', 'fitcore'),
    category: leaf('31'),
    priceFrom: pln(159),
    offers: [offer('1005', 'FC-MAT6', 159, 60)],
    specs: [
      spec('Grubość', '6 mm'),
      spec('Materiał', 'TPE'),
      spec('Wymiary', '183 x 61 cm'),
      spec('Waga', '1.1 kg'),
    ],
  },
  {
    id: '6',
    slug: 'smartwatch-active-4',
    name: 'Smartwatch Active 4',
    description:
      'Twój trener, nawigator i asystent zdrowia na jednym nadgarstku. Active 4 śledzi treningi z ' +
      'dokładnym GPS, monitoruje sen i tętno, a wyrazisty ekran AMOLED pozostaje czytelny nawet w ' +
      'pełnym słońcu.\n\n' +
      'Do 7 dni pracy na baterii oznacza, że rzadziej myślisz o ładowaniu, a wodoodporność 5 ATM ' +
      'pozwala zabrać go na basen. Smukły, lekki i gotowy na każdą aktywność — od porannego biegu po ' +
      'wieczorne powiadomienia.',
    mainImageUrl:
      'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=900&q=80',
    brand: brand('6', 'PulseTech', 'pulsetech'),
    category: leaf('32'),
    priceFrom: pln(799),
    offers: [
      offer('1006', 'PT-ACT4-BLK', 799, 18, [text('color', 'Kolor', 'Czarny')]),
      offer('1106', 'PT-ACT4-SLV', 849, 6, [text('color', 'Kolor', 'Srebrny')]),
    ],
    specs: [
      spec('Ekran', 'AMOLED 1.4"'),
      spec('Bateria', '7 dni'),
      spec('GPS', 'Tak'),
      spec('Wodoodporność', '5 ATM'),
    ],
  },
  {
    id: '7',
    slug: 'kurtka-northline',
    name: 'Kurtka miejska Northline',
    description:
      'Miasto w każdą pogodę nie zna litości — Northline tak. Wodoodporna powłoka z membraną ' +
      '10 000 mm i klejone szwy chronią przed deszczem i wiatrem, a oddychający materiał odprowadza ' +
      'wilgoć podczas ruchu.\n\n' +
      'Kaptur chowany w kołnierz, cztery praktyczne kieszenie i ponadczasowy, miejski krój sprawiają, ' +
      'że kurtka sprawdza się równie dobrze w drodze do biura, co na weekendowej wyprawie.',
    mainImageUrl:
      'https://images.unsplash.com/photo-1551232864-3f0890e580d9?auto=format&fit=crop&w=900&q=80',
    brand: brand('7', 'Northline', 'northline'),
    category: leaf('41'),
    priceFrom: pln(569),
    offers: [
      offer('1007', 'NL-CITY-M', 569, 14, [text('size', 'Rozmiar', 'M')]),
      offer('1107', 'NL-CITY-L', 569, 9, [text('size', 'Rozmiar', 'L')]),
    ],
    specs: [
      spec('Materiał', 'Nylon'),
      spec('Membrana', '10 000 mm'),
      spec('Kaptur', 'Chowany'),
      spec('Kieszenie', '4'),
    ],
  },
  {
    id: '8',
    slug: 'buty-aeroflow',
    name: 'Buty biegowe AeroFlow',
    description:
      'Poczuj lekkość każdego kroku. AeroFlow łączy dynamiczną amortyzację z przewiewną cholewką z ' +
      'siatki, która utrzymuje stopy chłodne i suche kilometr za kilometrem.\n\n' +
      'Przy wadze zaledwie 240 g i wyważonym dropie 8 mm buty zachęcają do dłuższych, szybszych ' +
      'wybiegań. Niezależnie od tego, czy gonisz nową życiówkę, czy po prostu lubisz ruch — AeroFlow ' +
      'poniesie Cię dalej.',
    mainImageUrl:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
    brand: brand('8', 'AeroRun', 'aerorun'),
    category: leaf('42'),
    priceFrom: pln(499),
    offers: [
      offer('1008', 'AR-FLOW-41', 499, 8, [text('size', 'Rozmiar', '41')]),
      offer('1108', 'AR-FLOW-42', 499, 15, [text('size', 'Rozmiar', '42')]),
      offer('1208', 'AR-FLOW-43', 499, 5, [text('size', 'Rozmiar', '43')]),
    ],
    specs: [
      spec('Drop', '8 mm'),
      spec('Waga', '240 g'),
      spec('Cholewka', 'Mesh'),
      spec('Przeznaczenie', 'Bieganie'),
    ],
  },
  {
    id: '9',
    slug: 'fotel-office-plus',
    name: 'Fotel ergonomiczny Office Plus',
    description:
      'Wygoda, która pracuje na Twoją produktywność. Fotel Office Plus z oddychającym oparciem mesh ' +
      'i dynamicznym podparciem lędźwi wspiera kręgosłup przez cały dzień pracy.\n\n' +
      'Regulacja 4D — wysokości, podłokietników, głębokości i kąta — pozwala dopasować fotel idealnie ' +
      'do sylwetki, a wytrzymała konstrukcja przenosi obciążenie do 130 kg. Usiądź raz, a poczujesz ' +
      'różnicę.',
    mainImageUrl:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
    brand: brand('9', 'ErgoSeat', 'ergoseat'),
    category: leaf('51'),
    priceFrom: pln(1350),
    offers: [offer('1009', 'ES-OFF', 1350, 10)],
    specs: [
      spec('Regulacja', '4D'),
      spec('Oparcie', 'Mesh'),
      spec('Maks. obciążenie', '130 kg'),
      spec('Podłokietniki', 'Tak'),
    ],
  },
  {
    id: '10',
    slug: 'lampka-focus-beam',
    name: 'Lampka biurkowa Focus Beam',
    description:
      'Skup się na tym, co ważne. Focus Beam oświetla biurko równym, pozbawionym migotania światłem ' +
      'LED, które redukuje zmęczenie oczu podczas długiej pracy czy nauki.\n\n' +
      'Dotykowe sterowanie i trzy temperatury barwowe pozwalają przejść od chłodnej, pobudzającej ' +
      'jasności po ciepły, relaksujący ton jednym muśnięciem palca. Energooszczędna i elegancka — ' +
      'Twój osobisty krąg światła.',
    mainImageUrl:
      'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=900&q=80',
    brand: brand('4', 'Lumio', 'lumio'),
    category: leaf('52'),
    priceFrom: pln(189),
    offers: [offer('1010', 'LUM-FOC', 189, 35)],
    specs: [
      spec('Źródło', 'LED'),
      spec('Moc', '9 W'),
      spec('Sterowanie', 'Dotykowe'),
      spec('Barwy', '3'),
    ],
  },
]
