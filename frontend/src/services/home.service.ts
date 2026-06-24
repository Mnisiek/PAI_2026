import { catalogService } from './catalog.service'
import type { Product } from '../types/catalog'

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

/**
 * Simulates a retargeting engine — returns products the user may have
 * previously viewed or shown interest in.
 * (Currently mocked: returns price-descending products from the catalog.)
 */
export async function getRetargetedOffers(): Promise<Product[]> {
  await sleep(120 + Math.random() * 180)

  const all = await catalogService.getProducts({ search: '', categoryId: null })

  return [...all]
    .sort((a, b) => b.priceFrom.amount - a.priceFrom.amount)
    .slice(0, 4)
}

/**
 * Simulates an ML-based recommendation engine — returns offers optimised
 * for the current user's profile.
 * (Currently mocked: returns a pseudo-random shuffle of catalog products.)
 */
export async function getOptimizedOffers(): Promise<Product[]> {
  await sleep(150 + Math.random() * 200)

  const all = await catalogService.getProducts({ search: '', categoryId: null })

  const shuffled = [...all].sort(() => Math.random() - 0.5)

  return shuffled.slice(0, 4)
}
