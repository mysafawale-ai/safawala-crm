"use client"

import { useState, useEffect } from "react"
import Image from "next/image"

interface CompanyHeaderProps {
  className?: string
}

interface CompanySettings {
  company_name: string
  logo_url?: string
}

export function CompanyHeader({ className = "" }: CompanyHeaderProps) {
  const [companySettings, setCompanySettings] = useState<CompanySettings>({
    company_name: "Safawala CRM",
    logo_url: ""
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCompanySettings()
  }, [])

  const fetchCompanySettings = async () => {
    try {
      console.log('[CompanyHeader] Fetching franchise-specific company settings...')
      
      const response = await fetch('/api/company-settings', {
        credentials: 'include', // Include session cookie
      })
      
      if (response.ok) {
        const data = await response.json()
        console.log('[CompanyHeader] Loaded settings:', data.company_name)
        setCompanySettings({
          company_name: data.company_name || 'Safawala CRM',
          logo_url: data.logo_url || ''
        })
      } else {
        console.error('[CompanyHeader] Failed to fetch settings:', response.status)
        // Fallback to default
        setCompanySettings({
          company_name: 'Safawala CRM',
          logo_url: ''
        })
      }
    } catch (error) {
      console.error('[CompanyHeader] Error fetching company settings:', error)
      // Fallback to default
      setCompanySettings({
        company_name: 'Safawala CRM',
        logo_url: ''
      })
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center space-x-3 ${className}`}>
        <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
      </div>
    )
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {companySettings.logo_url && (
        <div className="w-8 h-8 relative">
          <Image
            src={companySettings.logo_url}
            alt={`${companySettings.company_name} Logo`}
            width={32}
            height={32}
            className="w-full h-full object-contain rounded"
          />
        </div>
      )}
      <span className="font-semibold text-lg">{companySettings.company_name}</span>
    </div>
  )
}