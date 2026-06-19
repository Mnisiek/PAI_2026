import type { Category, Product } from '../types/catalog'

export const categories: Category[] = [
  { id: 'cat-1', name: 'Elektronika', slug: 'elektronika', parentId: null },
  { id: 'cat-2', name: 'Dom i Ogród', slug: 'dom-i-ogrod', parentId: null },
  { id: 'cat-3', name: 'Sport', slug: 'sport', parentId: null },
  { id: 'cat-4', name: 'Moda', slug: 'moda', parentId: null },
  { id: 'cat-5', name: 'Biuro', slug: 'biuro', parentId: null },
  { id: 'subcat-11', name: 'Audio', slug: 'audio', parentId: 'cat-1' },
  { id: 'subcat-12', name: 'Monitory', slug: 'monitory', parentId: 'cat-1' },
  { id: 'subcat-21', name: 'Kuchnia', slug: 'kuchnia', parentId: 'cat-2' },
  { id: 'subcat-22', name: 'Oświetlenie', slug: 'oswietlenie', parentId: 'cat-2' },
  { id: 'subcat-31', name: 'Fitness', slug: 'fitness', parentId: 'cat-3' },
  { id: 'subcat-32', name: 'Wearables', slug: 'wearables', parentId: 'cat-3' },
  { id: 'subcat-41', name: 'Okrycia', slug: 'okrycia', parentId: 'cat-4' },
  { id: 'subcat-42', name: 'Obuwie', slug: 'obuwie', parentId: 'cat-4' },
  { id: 'subcat-51', name: 'Fotele', slug: 'fotele', parentId: 'cat-5' },
  { id: 'subcat-52', name: 'Lampy', slug: 'lampy', parentId: 'cat-5' },
]

export const products: Product[] = [
  {
    id: 'prd-1',
    title: 'Słuchawki bezprzewodowe S-900',
    price: 349.99,
    imageUrl:
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80',
    categoryId: 'subcat-11',
    description: 'Redukcja szumu, do 40 h pracy, Bluetooth 5.3.',
  },
  {
    id: 'prd-2',
    title: 'Monitor 27 cali QHD',
    price: 1199,
    imageUrl:
      'https://unsplash.com/photos/flat-screen-computer-monitor-turned-on-beside-black-keyboard-8GDCzWrcE3M',
    categoryId: 'subcat-12',
    description: 'Odświeżanie 165 Hz, panel IPS, tryb nocny.',
  },
  {
    id: 'prd-3',
    title: 'Ekspres ciśnieniowy Barista One',
    price: 1899.5,
    imageUrl:
      'https://images.unsplash.com/photo-1511920170033-f8396924c348?auto=format&fit=crop&w=900&q=80',
    categoryId: 'subcat-21',
    description: 'Młynek stalowy, 12 profilów, automatyczne czyszczenie.',
  },
  {
    id: 'prd-4',
    title: 'Lampa stojąca Arc Light',
    price: 429,
    imageUrl:
      'https://images.unsplash.com/photo-1549187774-b4e9b0445b41?auto=format&fit=crop&w=900&q=80',
    categoryId: 'subcat-22',
    description: 'Regulacja wysokości i ciepła barwa światła.',
  },
  {
    id: 'prd-5',
    title: 'Mata treningowa Pro Grip',
    price: 159,
    imageUrl:
      'https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=900&q=80',
    categoryId: 'subcat-31',
    description: 'Antypoślizgowa, 6 mm grubości, materiał premium.',
  },
  {
    id: 'prd-6',
    title: 'Smartwatch Active 4',
    price: 799,
    imageUrl:
      'https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=900&q=80',
    categoryId: 'subcat-32',
    description: 'GPS, monitor snu, 7 dni pracy na baterii.',
  },
  {
    id: 'prd-7',
    title: 'Kurtka miejska Northline',
    price: 569,
    imageUrl:
      'https://images.unsplash.com/photo-1551232864-3f0890e580d9?auto=format&fit=crop&w=900&q=80',
    categoryId: 'subcat-41',
    description: 'Wodoodporna, oddychająca, kaptur chowany w kołnierz.',
  },
  {
    id: 'prd-8',
    title: 'Buty biegowe AeroFlow',
    price: 499,
    imageUrl:
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80',
    categoryId: 'subcat-42',
    description: 'Lekka podeszwa, amortyzacja dynamiczna.',
  },
  {
    id: 'prd-9',
    title: 'Fotel ergonomiczny Office Plus',
    price: 1350,
    imageUrl:
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=900&q=80',
    categoryId: 'subcat-51',
    description: 'Regulacja 4D, siatka mesh, podparcie lędźwi.',
  },
  {
    id: 'prd-10',
    title: 'Lampka biurkowa Focus Beam',
    price: 189,
    imageUrl:
      'https://images.unsplash.com/photo-1519710164239-da123dc03ef4?auto=format&fit=crop&w=900&q=80',
    categoryId: 'subcat-52',
    description: 'Sterowanie dotykowe, trzy temperatury światła.',
  },
]
