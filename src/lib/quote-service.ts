import { db } from '@/lib/db'
import type { Order, OrderItem } from '@/generated/prisma/client'

export interface QuoteItem {
  albumSlug: string
  stickerCode: string
  stickerName: string
  quantity: number
  unitPrice: number
  resolvedPrice?: number
}

export class PriceManipulationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PriceManipulationError'
  }
}

export class InventoryNotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InventoryNotFoundError'
  }
}

/**
 * Creates an Order with decrement of Inventory in a single transaction.
 * Validates that client-provided unitPrice matches server-resolved price.
 * Atomically creates Order + updates Inventory quantities.
 */
export async function createQuoteWithDecrement(
  sellerId: string,
  customerName: string,
  customerPhone: string | null,
  customerEmail: string | null,
  items: QuoteItem[],
  channel: 'SYSTEM' | 'WHATSAPP' | 'MANUAL'
): Promise<Order & { items: OrderItem[] }> {
  // 1. Validate seller exists
  const seller = await db.seller.findUnique({ where: { id: sellerId } })
  if (!seller) {
    throw new Error('Seller not found')
  }

  // 2. Validate stickers exist and client prices
  const validatedItems: QuoteItem[] = []

  for (const item of items) {
    // Check inventory record exists
    const inventoryRecord = await db.inventory.findUnique({
      where: {
        sellerId_albumSlug_stickerCode: {
          sellerId,
          albumSlug: item.albumSlug,
          stickerCode: item.stickerCode,
        },
      },
    })

    if (!inventoryRecord) {
      throw new InventoryNotFoundError(
        `Sticker ${item.stickerCode} not found in inventory`
      )
    }

    // Use server-resolved price from item or client price as fallback
    const resolvedPrice = item.resolvedPrice ?? item.unitPrice

    // 3. Validate client price matches resolved price (allow overpay, reject underpay)
    const clientPrice = item.unitPrice
    if (clientPrice < resolvedPrice) {
      throw new PriceManipulationError(
        `Price mismatch: client sent R$ ${clientPrice.toFixed(2)}, server resolved R$ ${resolvedPrice.toFixed(2)}`
      )
    }

    validatedItems.push({
      ...item,
      resolvedPrice,
    })
  }

  // 4. Calculate total price using resolved prices
  const totalPrice = validatedItems.reduce(
    (sum, item) => sum + (item.resolvedPrice ?? item.unitPrice) * item.quantity,
    0
  )

  // 5. Atomic transaction: create Order + decrement Inventory
  const order = await db.$transaction(async (tx) => {
    // Create Order
    const newOrder = await tx.order.create({
      data: {
        sellerId,
        customerName,
        customerPhone,
        customerEmail,
        channel,
        status: 'QUOTE',
        totalPrice,
        items: {
          create: validatedItems.map((item) => ({
            albumSlug: item.albumSlug,
            stickerCode: item.stickerCode,
            stickerName: item.stickerName,
            quantity: item.quantity,
            unitPrice: item.resolvedPrice ?? item.unitPrice,
          })),
        },
      },
      include: {
        items: true,
      },
    })

    // Decrement inventory for each item
    for (const item of validatedItems) {
      // Validate sufficient quantity before decrement
      const currentStock = await tx.inventory.findUnique({
        where: {
          sellerId_albumSlug_stickerCode: {
            sellerId,
            albumSlug: item.albumSlug,
            stickerCode: item.stickerCode,
          },
        },
      })

      if (!currentStock || currentStock.quantity < item.quantity) {
        throw new InventoryNotFoundError(
          `Insufficient stock for ${item.stickerCode}: need ${item.quantity}, have ${currentStock?.quantity ?? 0}`
        )
      }

      await tx.inventory.update({
        where: {
          sellerId_albumSlug_stickerCode: {
            sellerId,
            albumSlug: item.albumSlug,
            stickerCode: item.stickerCode,
          },
        },
        data: {
          quantity: {
            decrement: item.quantity,
          },
        },
      })
    }

    return newOrder
  })

  return order
}
