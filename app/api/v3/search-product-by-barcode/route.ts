import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

interface Product {
  id: string
  name: string
  barcode: string
  description?: string
  price?: number
  rental_price?: number
  stock?: number
  [key: string]: any
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { barcode } = req.query

    // Validate barcode parameter
    if (!barcode || typeof barcode !== 'string') {
      return res.status(400).json({ error: 'Barcode parameter is required' })
    }

    // Search product by barcode
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('barcode', barcode.trim())
      .limit(1)

    if (error) {
      console.error('Supabase error:', error)
      return res.status(500).json({ error: 'Database query failed' })
    }

    // Check if product found
    if (!products || products.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
        barcode: barcode
      })
    }

    // Return the found product
    return res.status(200).json({
      success: true,
      product: products[0],
      message: 'Product found'
    })
  } catch (error: any) {
    console.error('Barcode search error:', error)
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    })
  }
}
