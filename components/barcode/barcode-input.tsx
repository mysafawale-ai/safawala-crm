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
  debounceMs = 800,
}: BarcodeInputProps) {
  const [value, setValue] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const scanStartTimeRef = useRef<number>(0)

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
      const finalValue = value.trim()
      console.log('[BarcodeInput] Scan complete:', {
        fullValue: finalValue,
        length: finalValue.length,
        timestamp: new Date().toISOString(),
        scanDuration: Date.now() - scanStartTimeRef.current
      })
      onScan(finalValue)
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
        onChange={(e) => {
          const newValue = e.currentTarget.value
          console.log('[BarcodeInput] Character received:', {
            character: newValue[newValue.length - 1],
            totalLength: newValue.length,
            fullValue: newValue
          })
          if (!value) {
            // mark start of scan window
            scanStartTimeRef.current = Date.now()
          }
          setValue(newValue)
        }}
        onKeyDown={(e) => {
          // Detect scanner Enter key (typically comes after all characters)
          // Scanners typically send: character1 + character2 + ... + characterN + ENTER
          if (e.key === 'Enter' && value.trim()) {
            e.preventDefault()
            const finalValue = value.trim()
            console.log('[BarcodeInput] Enter key pressed, triggering scan:', {
              fullValue: finalValue,
              length: finalValue.length
            })
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current)
            }
            onScan(finalValue)
            setValue("")
            setIsScanning(false)
          }
          // Also log other characters being typed
          if (e.key.length === 1) {
            console.log('[BarcodeInput] Char:', e.key)
          }
        }}
        onPaste={(e) => {
          // Handle paste events (some scanners paste the full code). Defer to debounce.
          e.preventDefault()
          const pastedText = e.clipboardData.getData('text')
          const combined = (value + pastedText)
          console.log('[BarcodeInput] Paste detected:', {
            pastedText,
            combinedValue: combined,
            length: combined.length
          })
          if (!value) {
            scanStartTimeRef.current = Date.now()
          }
          setValue(combined)
        }}
        placeholder={placeholder}
        className={`pl-10 pr-10 font-mono text-sm tracking-wide ${className}`}
        disabled={disabled || isScanning}
        autoComplete="off"
        spellCheck="false"
      />
      {isScanning && (
        <div className="absolute right-3 top-3">
          <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
        </div>
      )}
    </div>
  )
}
