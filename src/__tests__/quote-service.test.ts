import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createQuoteWithDecrement, PriceManipulationError, InventoryNotFoundError } from '@/lib/quote-service'
import { db } from '@/lib/db'

vi.mock('@/lib/price-resolver', () => ({
  resolveUnitPrice: vi.fn(),
}))

const { resolveUnitPrice } = await import('@/lib/price-resolver')

describe('createQuoteWithDecrement', () => {
  const sellerId = 'seller-123'
  const albumSlug = 'album-1'
  const validItem = {
    albumSlug,
    stickerCode: 'BRA1',
    stickerName: 'Neymar',
    quantity: 2,
    unitPrice: 5.0,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('lança Error se seller não existe', async () => {
    ;(db.seller.findUnique as any).mockResolvedValue(null)

    await expect(
      createQuoteWithDecrement(sellerId, 'John Doe', null, null, [validItem], 'SYSTEM')
    ).rejects.toThrow('Seller not found')
  })

  it('lança InventoryNotFoundError se sticker não existe em inventory', async () => {
    ;(db.seller.findUnique as any).mockResolvedValue({ id: sellerId })
    ;(db.inventory.findUnique as any).mockResolvedValue(null)

    await expect(
      createQuoteWithDecrement(sellerId, 'John Doe', null, null, [validItem], 'SYSTEM')
    ).rejects.toThrow(InventoryNotFoundError)
  })

  it('rejeita unitPrice < resolvedPrice (PriceManipulationError)', async () => {
    ;(db.seller.findUnique as any).mockResolvedValue({ id: sellerId })
    ;(db.inventory.findUnique as any).mockResolvedValue({
      sellerId,
      albumSlug,
      stickerCode: 'BRA1',
      quantity: 100,
    })
    ;(resolveUnitPrice as any).mockResolvedValue(10.0) // servidor resolveu 10

    const clientItem = {
      ...validItem,
      unitPrice: 5.0, // cliente tentou pagar 5 (UNDERPAY)
      resolvedPrice: 10.0, // servidor resolveu 10
    }

    await expect(
      createQuoteWithDecrement(sellerId, 'John Doe', null, null, [clientItem], 'SYSTEM')
    ).rejects.toThrow(PriceManipulationError)
  })

  it('decrementa inventory em transação quando tudo válido', async () => {
    const mockOrder = {
      id: 'order-1',
      sellerId,
      channel: 'SYSTEM',
      status: 'QUOTE',
      totalPrice: 10.0,
      createdAt: new Date(),
      items: [
        {
          id: 'item-1',
          orderId: 'order-1',
          albumSlug,
          stickerCode: 'BRA1',
          stickerName: 'Neymar',
          quantity: 2,
          unitPrice: 5.0,
        },
      ],
    }

    ;(db.seller.findUnique as any).mockResolvedValue({ id: sellerId })
    ;(db.inventory.findUnique as any)
      .mockResolvedValueOnce({
        sellerId,
        albumSlug,
        stickerCode: 'BRA1',
        quantity: 100,
      })
      .mockResolvedValueOnce({
        sellerId,
        albumSlug,
        stickerCode: 'BRA1',
        quantity: 100,
      }) // check stock inside transaction
    ;(resolveUnitPrice as any).mockResolvedValue(5.0)
    ;(db.$transaction as any).mockImplementation(async (fn: any) => {
      return fn({
        order: {
          create: vi.fn().mockResolvedValue(mockOrder),
        },
        inventory: {
          findUnique: vi.fn().mockResolvedValue({
            sellerId,
            albumSlug,
            stickerCode: 'BRA1',
            quantity: 100,
          }),
          update: vi.fn().mockResolvedValue({
            sellerId,
            albumSlug,
            stickerCode: 'BRA1',
            quantity: 98,
          }),
        },
      })
    })

    const result = await createQuoteWithDecrement(sellerId, 'John Doe', null, null, [validItem], 'SYSTEM')

    expect(result).toEqual(mockOrder)
    expect(db.$transaction).toHaveBeenCalled()
  })


  it('permite client overpay (unitPrice > resolvedPrice) — usa resolvedPrice', async () => {
    const mockOrder = {
      id: 'order-2',
      sellerId,
      channel: 'WHATSAPP',
      status: 'QUOTE',
      totalPrice: 20.0, // 2 × 10 (resolved)
      createdAt: new Date(),
      items: [
        {
          id: 'item-2',
          orderId: 'order-2',
          albumSlug,
          stickerCode: 'BRA1',
          stickerName: 'Neymar',
          quantity: 2,
          unitPrice: 10.0, // resolved price
        },
      ],
    }

    ;(db.seller.findUnique as any).mockResolvedValue({ id: sellerId })
    ;(db.inventory.findUnique as any)
      .mockResolvedValueOnce({
        sellerId,
        albumSlug,
        stickerCode: 'BRA1',
        quantity: 100,
      })
      .mockResolvedValueOnce({
        sellerId,
        albumSlug,
        stickerCode: 'BRA1',
        quantity: 100,
      })
    ;(resolveUnitPrice as any).mockResolvedValue(10.0) // server resolved 10

    const overpaidItem = {
      ...validItem,
      unitPrice: 15.0, // client willingly pays 15 > 10
      resolvedPrice: 10.0, // server resolved 10
    }

    ;(db.$transaction as any).mockImplementation(async (fn: any) => {
      return fn({
        order: {
          create: vi.fn().mockResolvedValue(mockOrder),
        },
        inventory: {
          findUnique: vi.fn().mockResolvedValue({
            sellerId,
            albumSlug,
            stickerCode: 'BRA1',
            quantity: 100,
          }),
          update: vi.fn().mockResolvedValue({
            sellerId,
            albumSlug,
            stickerCode: 'BRA1',
            quantity: 98,
          }),
        },
      })
    })

    const result = await createQuoteWithDecrement(sellerId, 'John Doe', null, null, [overpaidItem], 'SYSTEM')

    expect(result).toEqual(mockOrder)
    expect(result.totalPrice).toBe(20.0) // uses resolved price, not overpaid
  })
})
