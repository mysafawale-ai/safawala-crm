"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  X, Send, Loader2, Users, Minimize2, Maximize2, Mic, MicOff,
  Sparkles, RotateCcw, Trash2, ChevronDown,
} from "lucide-react"

interface ChatMessage {
  id: string
  user_name: string
  user_role: string
  message: string
  message_type: "text" | "voice"
  voice_url?: string
  created_at: string
  user_id?: string
}

const ROLE_COLORS: Record<string, string> = {
  franchise_admin: "#a855f7",
  franchise_owner: "#a855f7",
  manager: "#6366f1",
  booking_staff: "#22c55e",
  warehouse_staff: "#a855f7",
  hr_staff: "#6366f1",
  accounts_staff: "#ef4444",
  delivery_staff: "#14b8a6",
  qc_staff: "#eab308",
  stylist: "#ec4899",
  travels_staff: "#0891b2",
  staff: "#64748b",
}

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()
}

function getColor(role: string) {
  return ROLE_COLORS[role] || "#64748b"
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })
}

function formatDay(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return "Today"
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday"
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })
}

export function TeamChat() {
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const [unread, setUnread] = useState(0)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [refining, setRefining] = useState(false)

  const [aiState, setAiState] = useState({ open: false, minimized: false })

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastSeenRef = useRef<string>("")
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  useEffect(() => {
    const raw = localStorage.getItem("safawala_user")
    if (raw) { try { setCurrentUser(JSON.parse(raw)) } catch {} }
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") {
      if ((window as any).__safawalaAIState) {
        setAiState((window as any).__safawalaAIState)
      }
      const handler = (e: Event) => {
        const detail = (e as CustomEvent).detail
        if (detail) {
          setAiState(detail)
        }
      }
      window.addEventListener("safawala-ai-state", handler)
      return () => window.removeEventListener("safawala-ai-state", handler)
    }
  }, [])

  const getRightPosition = () => {
    if (!aiState.open) return 220
    if (aiState.minimized) return 328
    return 440
  }

  const fetchMessages = useCallback(async (since?: string) => {
    try {
      const url = since ? `/api/team-chat?since=${encodeURIComponent(since)}` : "/api/team-chat"
      const res = await fetch(url)
      const json = await res.json()
      if (json.needsSetup) { setNeedsSetup(true); return }
      if (json.data) {
        if (since) {
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id))
            const newMsgs = json.data.filter((m: ChatMessage) => !existingIds.has(m.id))
            if (newMsgs.length > 0 && !open) setUnread(u => u + newMsgs.length)
            return [...prev, ...newMsgs]
          })
        } else {
          setMessages(json.data)
        }
        if (json.data.length > 0) {
          lastSeenRef.current = json.data[json.data.length - 1].created_at
        }
      }
    } catch {}
  }, [open])

  useEffect(() => {
    fetchMessages()
    pollRef.current = setInterval(() => {
      fetchMessages(lastSeenRef.current || undefined)
    }, 5000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [fetchMessages])

  useEffect(() => {
    if (open) {
      setUnread(0)
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
    }
  }, [open, messages])

  const sendMessage = async (text?: string) => {
    const msg = (text ?? input).trim()
    if (!msg) return
    setSending(true)
    setInput("")
    try {
      const res = await fetch("/api/team-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: msg, message_type: "text" }),
      })
      const json = await res.json()
      if (json.needsSetup) { setNeedsSetup(true); return }
      if (json.data) {
        setMessages(prev => [...prev, json.data])
        lastSeenRef.current = json.data.created_at
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50)
      }
    } catch {} finally {
      setSending(false)
    }
  }

  const refineWithAI = async () => {
    if (!input.trim()) return
    setRefining(true)
    try {
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: `Please rewrite this message in clear, professional Hindi/English for a business team chat. Keep it short and natural. Original: "${input.trim()}"\n\nReturn ONLY the improved message, nothing else.`,
          context: "message_refinement",
        }),
      })
      const json = await res.json()
      const refined = json.response || json.message || json.content
      if (refined) setInput(refined.trim())
    } catch {} finally {
      setRefining(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioChunksRef.current = []
      const mr = new MediaRecorder(stream)
      mediaRecorderRef.current = mr
      mr.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data) }
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        await uploadVoiceMessage(blob)
      }
      mr.start()
      setIsRecording(true)
      setRecordingTime(0)
      recordingTimerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000)
    } catch { alert("Microphone permission denied") }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    setIsRecording(false)
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current)
  }

  const uploadVoiceMessage = async (blob: Blob) => {
    setSending(true)
    try {
      const fd = new FormData()
      fd.append("file", blob, `voice_${Date.now()}.webm`)
      fd.append("bucket", "team-chat-voices")
      const uploadRes = await fetch("/api/upload-simple", { method: "POST", body: fd })
      const uploadJson = await uploadRes.json()
      const voiceUrl = uploadJson.url || uploadJson.publicUrl
      if (!voiceUrl) throw new Error("Upload failed")

      const res = await fetch("/api/team-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: "🎤 Voice message", message_type: "voice", voice_url: voiceUrl }),
      })
      const json = await res.json()
      if (json.data) {
        setMessages(prev => [...prev, json.data])
        lastSeenRef.current = json.data.created_at
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50)
      }
    } catch { alert("Failed to send voice message") } finally {
      setSending(false)
    }
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  // Group messages by date
  const grouped: { day: string; msgs: ChatMessage[] }[] = []
  messages.forEach(msg => {
    const day = formatDay(msg.created_at)
    const last = grouped[grouped.length - 1]
    if (last && last.day === day) last.msgs.push(msg)
    else grouped.push({ day, msgs: [msg] })
  })

  if (!currentUser || currentUser.role === "super_admin") return null

  return (
    <>
      {/* Floating button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          style={{
            position: "fixed", bottom: 24, right: getRightPosition(), zIndex: 9998,
            width: 52, height: 52, borderRadius: "50%",
            background: "linear-gradient(135deg, #22c55e, #16a34a)",
            border: "none", cursor: "pointer",
            boxShadow: "0 4px 20px rgba(34,197,94,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "white",
            transition: "right 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          title="Team Chat"
        >
          <Users size={22} />
          {unread > 0 && (
            <span style={{
              position: "absolute", top: 2, right: 2, width: 18, height: 18, borderRadius: "50%",
              background: "#ef4444", color: "white", fontSize: 10, fontWeight: 800,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: "2px solid white",
            }}>{unread > 9 ? "9+" : unread}</span>
          )}
        </button>
      )}

      {/* Chat window */}
      {open && (
        <div style={{
          position: "fixed", bottom: 24, right: getRightPosition(), zIndex: 9999,
          width: 340, borderRadius: 20,
          background: "#ffffff", boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
          border: "1px solid #e4e4e7",
          display: "flex", flexDirection: "column",
          height: minimized ? "auto" : 500,
          fontFamily: "system-ui,-apple-system,sans-serif",
          overflow: "hidden",
          transition: "right 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}>
          {/* Header */}
          <div style={{
            padding: "12px 16px", borderBottom: "1px solid #f4f4f5",
            background: "linear-gradient(135deg, #18181b, #27272a)",
            display: "flex", alignItems: "center", gap: 10, borderRadius: "20px 20px 0 0",
            flexShrink: 0,
          }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg, #22c55e, #16a34a)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Users size={16} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: "#fff" }}>Team Chat</p>
              <p style={{ margin: 0, fontSize: 10, color: "rgba(255,255,255,0.4)" }}>{messages.length} messages</p>
            </div>
            <button onClick={() => setMinimized(m => !m)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)", padding: 4 }}>
              {minimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
            </button>
            <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.5)", padding: 4 }}>
              <X size={14} />
            </button>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px", background: "#fafafa", display: "flex", flexDirection: "column", gap: 2 }}>
                {needsSetup ? (
                  <div style={{ textAlign: "center", padding: "32px 16px", color: "#a1a1aa" }}>
                    <Users size={32} style={{ margin: "0 auto 8px", display: "block", opacity: 0.3 }} />
                    <p style={{ fontSize: 12, margin: 0 }}>Team chat needs one-time setup.</p>
                    <p style={{ fontSize: 11, margin: "4px 0 0", color: "#d4d4d8" }}>Ask your admin to run the SQL migration.</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "32px 16px", color: "#a1a1aa" }}>
                    <Users size={32} style={{ margin: "0 auto 8px", display: "block", opacity: 0.3 }} />
                    <p style={{ fontSize: 12, margin: 0 }}>No messages yet. Say hello!</p>
                  </div>
                ) : grouped.map(({ day, msgs }) => (
                  <div key={day}>
                    <div style={{ textAlign: "center", margin: "8px 0", fontSize: 10, color: "#a1a1aa", fontWeight: 600 }}>{day}</div>
                    {msgs.map((msg, i) => {
                      const isMe = msg.user_id === currentUser?.id || msg.user_name === currentUser?.name
                      const color = getColor(msg.user_role)
                      const showName = !isMe && (i === 0 || msgs[i - 1]?.user_name !== msg.user_name)
                      return (
                        <div key={msg.id} style={{ display: "flex", gap: 8, marginBottom: 4, flexDirection: isMe ? "row-reverse" : "row", alignItems: "flex-end" }}>
                          {!isMe && (
                            <div style={{ width: 28, height: 28, borderRadius: "50%", background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "white", flexShrink: 0 }}>
                              {getInitials(msg.user_name)}
                            </div>
                          )}
                          <div style={{ maxWidth: "72%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                            {showName && !isMe && (
                              <span style={{ fontSize: 10, color, fontWeight: 700, marginBottom: 2, paddingLeft: 4 }}>{msg.user_name}</span>
                            )}
                            <div style={{
                              background: isMe ? "#18181b" : "#ffffff",
                              color: isMe ? "#ffffff" : "#18181b",
                              borderRadius: isMe ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                              padding: "8px 12px", fontSize: 13, lineHeight: 1.4,
                              border: isMe ? "none" : "1px solid #e4e4e7",
                              boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
                            }}>
                              {msg.message_type === "voice" && msg.voice_url ? (
                                <audio src={msg.voice_url} controls style={{ height: 32, maxWidth: 180 }} />
                              ) : msg.message}
                            </div>
                            <span style={{ fontSize: 9, color: "#a1a1aa", marginTop: 2, paddingLeft: 4 }}>{formatTime(msg.created_at)}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Input area */}
              <div style={{ padding: "10px 12px", borderTop: "1px solid #f4f4f5", background: "#ffffff", flexShrink: 0 }}>
                {isRecording && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, padding: "6px 12px", background: "#fee2e2", borderRadius: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", animation: "pulse 1s infinite" }} />
                    <span style={{ fontSize: 12, color: "#dc2626", fontWeight: 600 }}>Recording... {recordingTime}s</span>
                    <button onClick={stopRecording} style={{ marginLeft: "auto", background: "#ef4444", color: "white", border: "none", borderRadius: 8, padding: "4px 10px", fontSize: 11, cursor: "pointer", fontWeight: 700 }}>Stop & Send</button>
                  </div>
                )}
                <div style={{ display: "flex", gap: 6, alignItems: "flex-end" }}>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    placeholder="Type a message... (Enter to send)"
                    rows={1}
                    style={{
                      flex: 1, borderRadius: 12, border: "1px solid #e4e4e7",
                      padding: "8px 12px", fontSize: 13, resize: "none",
                      fontFamily: "inherit", outline: "none", background: "#f4f4f5",
                      maxHeight: 80, lineHeight: 1.4, color: "#18181b",
                    }}
                  />
                  {/* AI Refine */}
                  {input.trim() && (
                    <button
                      onClick={refineWithAI}
                      disabled={refining}
                      title="Refine with AI"
                      style={{
                        width: 34, height: 34, borderRadius: 10, border: "1px solid #e4e4e7",
                        background: refining ? "#f4f4f5" : "#faf5ff", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#a855f7", flexShrink: 0,
                      }}
                    >
                      {refining ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                    </button>
                  )}
                  {/* Voice */}
                  <button
                    onClick={isRecording ? stopRecording : startRecording}
                    title={isRecording ? "Stop recording" : "Voice message"}
                    style={{
                      width: 34, height: 34, borderRadius: 10, border: "none",
                      background: isRecording ? "#ef4444" : "#f4f4f5",
                      cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                      color: isRecording ? "white" : "#71717a", flexShrink: 0,
                    }}
                  >
                    {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
                  </button>
                  {/* Send */}
                  <button
                    onClick={() => sendMessage()}
                    disabled={sending || !input.trim()}
                    style={{
                      width: 34, height: 34, borderRadius: 10, border: "none",
                      background: input.trim() ? "#18181b" : "#f4f4f5",
                      cursor: input.trim() ? "pointer" : "default",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: input.trim() ? "white" : "#a1a1aa", flexShrink: 0,
                    }}
                  >
                    {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
