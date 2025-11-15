'use client'

import { useState, useEffect } from 'react'

export interface CompanySettings {
  id?: string
  company_name: string
  email: string
  phone: string
  address: string
  city: string
  state: string
  gst_number: string
  logo_url?: string | null
  signature_url?: string | null
  website?: string | null
  timezone?: string
  currency?: string
  language?: string | null
  date_format?: string | null
  // Branding
  primary_color?: string
  secondary_color?: string
  accent_color?: string
  background_color?: string
  font_family?: string
  // Document
  invoice_number_format?: string
  quote_number_format?: string
  default_payment_terms?: string
  default_tax_rate?: number
  show_gst_breakdown?: boolean
  default_terms_conditions?: string
  created_at?: string
  updated_at?: string
}

export function useCompanySettings() {
  const [settings, setSettings] = useState<CompanySettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/settings/all', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!res.ok) {
          throw new Error(`Failed to fetch company settings: ${res.statusText}`)
        }

        const data = await res.json()
        // Use merged settings for convenience
        setSettings(data.merged || data.company)
        setError(null)
      } catch (err) {
        console.error('Error fetching company settings:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch settings')
        // Set default values on error
        setSettings({
          company_name: 'SAFAWALA',
          email: 'info@safawala.com',
          phone: '+91-XXXXXXXXXX',
          address: 'Your Address Here',
          city: '',
          state: '',
          gst_number: '',
          timezone: 'Asia/Kolkata',
          currency: 'INR',
          primary_color: '#3B82F6',
          secondary_color: '#EF4444',
          accent_color: '#10B981',
          default_terms_conditions: 'This is a digital invoice. Please keep this for your records. For any queries, contact our support team.'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  return { settings, loading, error }
}
