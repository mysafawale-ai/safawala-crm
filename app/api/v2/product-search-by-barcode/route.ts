import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)

type ResponseData = {
  success?: boolean
  product?: any
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { barcode } = req.query

  if (!barcode || typeof barcode !== 'string') {
    return res.status(400).json({ error: 'Barcode is required' })
  }

  try {
    // Search by barcode_number in products table
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('barcode_number', barcode)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Product not found' })
      }
      throw error
    }

    if (!product) {
      return res.status(404).json({ error: 'Product not found' })
    }

    return res.status(200).json({
      success: true,
      product
    })
  } catch (error: any) {
    console.error('Barcode search error:', error)
    return res.status(500).json({ error: error.message })
  }
}
