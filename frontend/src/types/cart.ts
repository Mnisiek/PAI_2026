export interface CartItem {
  // The chosen offer (variant) id — the cart line key.
  id: string
  productId: string
  title: string
  price: number
  imageUrl: string
  quantity: number
}
