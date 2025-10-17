"use client"

/**
 * BarcodeInput - Simple Inline Barcode Scanner Input
 * 
 * Lightweight component for quick barcode scanning in forms
 * Supports USB scanners via keyboard input simulation
 * 
 * Usage:
 * <BarcodeInput
 *   onScan={(code) => lookupProduct(code)}
 *   placeholder="Scan or type barcode..."
 * />
 */

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Scan } from "lucide-react"

interface BarcodeInputProps {
  onScan: (code: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  autoFocus?: boolean
  debounceMs?: number
}

export function BarcodeInput({
  onScan,
  placeholder = "Scan barcode...",
  className = "",
  disabled = false,
  autoFocus = true,
  debounceMs = 300,
}: BarcodeInputProps) {
  const [value, setValue] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Auto-focus on mount
  useEffect(() => {
    if (autoFocus && inputRef.current) {
      inputRef.current.focus()
    }
  }, [autoFocus])

  // Debounced scan trigger
  useEffect(() => {
    if (!value.trim()) return

    setIsScanning(true)

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      onScan(value.trim())
      setValue("")
      setIsScanning(false)
    }, debounceMs)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [value, onScan, debounceMs])

  return (
    <div className="relative">
      <Scan className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
      <Input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && value.trim()) {
            e.preventDefault()
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current)
            }
            onScan(value.trim())
            setValue("")
            setIsScanning(false)
          }
        }}
        placeholder={placeholder}
        className={`pl-10 pr-10 ${className}`}
        disabled={disabled || isScanning}
      />
      {isScanning && (
        <div className="absolute right-3 top-3">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  )
}
