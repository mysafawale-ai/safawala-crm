"use client"

import { useState, useRef, useCallback } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import {
  Sparkles, Upload, X, ImagePlus, Loader2,
  User, Shirt, ZoomIn, Download, RefreshCw, Camera,
} from "lucide-react"

interface TrialResult {
  label: string
  url?: string
  error?: string
}

interface Session {
  id: string
  personPreview: string
  productPreview: string
  productName: string
  description: string
  results: TrialResult[]
  createdAt: Date
}

function ImageUploadBox({
  label, icon: Icon, preview, onFile, onClear,
}: {
  label: string
  icon: React.ElementType
  preview: string | null
  onFile: (file: File) => void
  onClear: () => void
}) {
  const uploadRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDrag(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith("image/")) onFile(file)
  }, [onFile])

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
        <Icon className="h-4 w-4" />{label}
      </p>
      {preview ? (
        <div className="relative rounded-xl overflow-hidden border-2 border-purple-300 bg-gray-50 aspect-square">
          <img src={preview} alt={label} className="w-full h-full object-cover" />
          <button
            onClick={onClear}
            className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={handleDrop}
          className={`aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all gap-3 ${
            drag ? "border-purple-500 bg-purple-50" : "border-gray-300"
          }`}
        >
          <ImagePlus className="h-8 w-8 text-gray-300" />
          <p className="text-xs text-gray-400 text-center px-2">Drag & drop or choose below</p>
          <div className="flex gap-2 px-4 w-full">
            <button
              type="button"
              onClick={() => uploadRef.current?.click()}
              className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 transition-all text-purple-700 text-xs font-medium"
            >
              <ImagePlus className="h-4 w-4" />
              Upload
            </button>
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="flex-1 flex flex-col items-center gap-1 py-2 rounded-lg border border-pink-200 bg-pink-50 hover:bg-pink-100 transition-all text-pink-700 text-xs font-medium"
            >
              <Camera className="h-4 w-4" />
              Camera
            </button>
          </div>
        </div>
      )}
      {/* Upload from gallery */}
      <input
        ref={uploadRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f) }}
      />
      {/* Capture from camera */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f) }}
      />
    </div>
  )
}

function ResultCard({ result, index }: { result: TrialResult; index: number }) {
  const [zoomed, setZoomed] = useState(false)

  if (result.error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 aspect-square flex flex-col items-center justify-center gap-2 p-4">
        <X className="h-8 w-8 text-red-400" />
        <p className="text-xs text-red-600 text-center">{result.error}</p>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-1.5">
        <div
          className="relative rounded-xl overflow-hidden border border-gray-200 aspect-square cursor-zoom-in group"
          onClick={() => setZoomed(true)}
        >
          <img src={result.url} alt={result.label} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            <ZoomIn className="h-8 w-8 text-white drop-shadow" />
          </div>
          <div className="absolute bottom-2 left-2">
            <Badge className="text-[10px] bg-black/60 text-white border-0 px-2 py-0.5">{result.label}</Badge>
          </div>
        </div>
        <a
          href={result.url}
          download={`virtual-trial-${result.label.toLowerCase().replace(/ /g, "-")}.jpg`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-[11px] text-purple-600 hover:underline justify-center"
        >
          <Download className="h-3 w-3" />Download
        </a>
      </div>

      {zoomed && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setZoomed(false)}
        >
          <img src={result.url} alt={result.label} className="max-w-full max-h-full rounded-xl shadow-2xl" />
          <button className="absolute top-4 right-4 text-white bg-black/60 rounded-full p-2 hover:bg-black/80">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}
    </>
  )
}

export default function VirtualTrialPage() {
  const { toast } = useToast()

  // Current upload state
  const [personFile, setPersonFile] = useState<File | null>(null)
  const [personPreview, setPersonPreview] = useState<string | null>(null)
  const [productFile, setProductFile] = useState<File | null>(null)
  const [productPreview, setProductPreview] = useState<string | null>(null)
  const [productName, setProductName] = useState("")

  // Sessions (history of trials)
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeSession, setActiveSession] = useState<Session | null>(null)

  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState("")

  const toBase64 = (file: File): Promise<string> =>
    new Promise((res, rej) => {
      const reader = new FileReader()
      reader.onload = () => res(reader.result as string)
      reader.onerror = rej
      reader.readAsDataURL(file)
    })

  const handleFile = (type: "person" | "product") => async (file: File) => {
    const preview = URL.createObjectURL(file)
    if (type === "person") { setPersonFile(file); setPersonPreview(preview) }
    else { setProductFile(file); setProductPreview(preview) }
  }

  const handleGenerate = async () => {
    if (!personFile || !productFile) {
      toast({ title: "Missing Images", description: "Please upload both a person photo and a product photo.", variant: "destructive" })
      return
    }
    setLoading(true)
    setProgress("Analysing person and product with GPT-4o...")

    try {
      const [personB64, productB64] = await Promise.all([toBase64(personFile), toBase64(productFile)])

      setProgress("Generating 4-angle views with GPT Image... (this takes ~30–60 sec)")

      const res = await fetch("/api/virtual-trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personImageBase64: personB64,
          productImageBase64: productB64,
          productName: productName || "safa turban",
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Generation failed")

      const session: Session = {
        id: Date.now().toString(),
        personPreview: personPreview!,
        productPreview: productPreview!,
        productName: productName || "Safa Turban",
        description: data.description,
        results: data.results,
        createdAt: new Date(),
      }
      setSessions(prev => [session, ...prev])
      setActiveSession(session)
      toast({ title: "Virtual Trial Ready!", description: "4-angle views generated successfully." })
    } catch (err: any) {
      toast({ title: "Generation Failed", description: err.message, variant: "destructive" })
    } finally {
      setLoading(false)
      setProgress("")
    }
  }

  const clearUploads = () => {
    setPersonFile(null); setPersonPreview(null)
    setProductFile(null); setProductPreview(null)
    setProductName("")
  }

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Virtual Trial</h1>
            <p className="text-sm text-gray-500">AI-powered try-on — see how a product looks on a person from 4 angles</p>
          </div>
          <Badge className="ml-auto bg-purple-100 text-purple-700 border-purple-200">Powered by GPT-4o + DALL-E 3</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left panel: Upload */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="p-4 space-y-4">
              <p className="font-semibold text-gray-800 text-sm">Upload Photos</p>

              <ImageUploadBox
                label="Person Photo"
                icon={User}
                preview={personPreview}
                onFile={handleFile("person")}
                onClear={() => { setPersonFile(null); setPersonPreview(null) }}
              />

              <ImageUploadBox
                label="Product Photo (Safa / Turban)"
                icon={Shirt}
                preview={productPreview}
                onFile={handleFile("product")}
                onClear={() => { setProductFile(null); setProductPreview(null) }}
              />

              <div>
                <label className="text-xs font-medium text-gray-600 mb-1 block">Product Name (optional)</label>
                <Input
                  placeholder="e.g. Barati Safa, Royal Turban..."
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={loading || !personFile || !productFile}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
              >
                {loading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Generating...</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" />Generate 4-Angle Trial</>
                )}
              </Button>

              {loading && progress && (
                <p className="text-xs text-purple-600 text-center animate-pulse">{progress}</p>
              )}

              {(personFile || productFile) && !loading && (
                <button onClick={clearUploads} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1 mx-auto">
                  <RefreshCw className="h-3 w-3" />Clear & start over
                </button>
              )}
            </Card>

            {/* Session History */}
            {sessions.length > 0 && (
              <Card className="p-4 space-y-2">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Previous Trials</p>
                {sessions.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setActiveSession(s)}
                    className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all text-xs ${
                      activeSession?.id === s.id ? "bg-purple-50 border border-purple-200" : "hover:bg-gray-50"
                    }`}
                  >
                    <img src={s.personPreview} className="w-8 h-8 rounded-full object-cover border" alt="" />
                    <img src={s.productPreview} className="w-8 h-8 rounded object-cover border" alt="" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{s.productName}</p>
                      <p className="text-gray-400">{s.createdAt.toLocaleTimeString()}</p>
                    </div>
                  </button>
                ))}
              </Card>
            )}
          </div>

          {/* Right panel: Results */}
          <div className="lg:col-span-2">
            {activeSession ? (
              <div className="space-y-4">
                <Card className="p-4">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">AI Description</p>
                  <p className="text-sm text-gray-700 leading-relaxed">{activeSession.description}</p>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                  {activeSession.results.map((result, i) => (
                    <ResultCard key={i} result={result} index={i} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[400px] rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-4 text-center p-8">
                <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center">
                  <Sparkles className="h-8 w-8 text-purple-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-700">No trial yet</p>
                  <p className="text-sm text-gray-400 mt-1">Upload a person photo and product photo,<br />then click Generate to see 4-angle views</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
