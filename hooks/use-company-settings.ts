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
        const res = await fetch('/api/company-settings-simple', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (!res.ok) {
          throw new Error(`Failed to fetch company settings: ${res.statusText}`)
        }

        const data = await res.json()
        setSettings(data)
        setError(null)
      } catch (err) {
        console.error('Error fetching company settings:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch settings')
        // Set default values on error
        setSettings({
          company_name: 'Your Company',
          email: 'info@company.com',
          phone: '',
          address: '',
          city: '',
          state: '',
          gst_number: '',
          timezone: 'Asia/Kolkata',
          currency: 'INR',
        })
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  return { settings, loading, error }
}
