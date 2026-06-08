"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { X, Send, Loader2, Sparkles, Crown, Minimize2, Maximize2, RotateCcw } from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

const QUICK_ACTIONS = [
  "How many bookings today?",
  "Show pending payments",
  "Low stock items",
  "Today's deliveries",
  "Recent leads",
  "Create a booking",
]

export function SafawalaAIAssistant() {
  const [open, setOpen] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Namaste! 👑 I'm Safawala AI. I can help you manage your CRM — check bookings, customer data, inventory, leads, payments, and more. What can I do for you?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100)
    }
  }, [messages, open, minimized])

  useEffect(() => {
    if (open && !minimized) {
      setTimeout(() => inputRef.current?.focus(), 200)
    }
  }, [open, minimized])

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setLoading(true)

    try {
      const res = await fetch("/api/ai-assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
        }),
      })

      const data = await res.json()
      const reply = data.reply || data.error || "Sorry, I couldn't process that. Please try again."

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: reply,
          timestamp: new Date(),
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          timestamp: new Date(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }, [loading, messages])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const reset = () => {
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: "Namaste! 👑 I'm Safawala AI. How can I help you today?",
        timestamp: new Date(),
      },
    ])
  }

  const formatContent = (content: string) => {
    // Simple markdown-like formatting
    return content
      .split("\n")
      .map((line, i) => {
        if (line.startsWith("**") && line.endsWith("**")) {
          return <p key={i} className="font-semibold text-white">{line.slice(2, -2)}</p>
        }
        if (line.startsWith("- ") || line.startsWith("• ")) {
          return (
            <p key={i} className="flex items-start gap-1.5">
              <span className="text-yellow-400 mt-0.5">•</span>
              <span>{line.slice(2)}</span>
            </p>
          )
        }
        if (line.trim() === "") return <br key={i} />
        return <p key={i}>{line}</p>
      })
  }

  return (
    <>
      {/* Floating Button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 group flex items-center gap-2.5 bg-gradient-to-r from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300 text-black font-bold rounded-2xl px-4 py-3 shadow-2xl shadow-yellow-500/30 transition-all hover:scale-105 active:scale-95"
          title="Safawala AI Assistant"
        >
          <Crown className="w-5 h-5 fill-black/20" />
          <span className="text-sm">Safawala AI</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-40"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-black/50"></span>
          </span>
        </button>
      )}

      {/* Chat Window */}
      {open && (
        <div
          className={`fixed z-50 right-6 bottom-6 bg-[#0f0d1a] border border-white/10 rounded-2xl shadow-2xl shadow-black/60 flex flex-col transition-all overflow-hidden ${
            minimized ? "w-72 h-14" : "w-[400px] h-[580px]"
          }`}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-yellow-500/10 to-purple-500/10 border-b border-white/8 flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
              <Crown className="w-4 h-4 text-black fill-black/20" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-none">Safawala AI</p>
              {!minimized && (
                <p className="text-[10px] text-white/40 mt-0.5">Your CRM assistant</p>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={reset}
                title="Clear chat"
                className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setMinimized(!minimized)}
                className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition"
              >
                {minimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => setOpen(false)}
                className="w-7 h-7 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {!minimized && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                        <Crown className="w-3 h-3 text-black" />
                      </div>
                    )}
                    <div
                      className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed space-y-1 ${
                        msg.role === "user"
                          ? "bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-br-md"
                          : "bg-white/8 text-white/85 rounded-bl-md"
                      }`}
                    >
                      {msg.role === "assistant"
                        ? formatContent(msg.content)
                        : <p>{msg.content}</p>}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="w-6 h-6 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center mr-2 flex-shrink-0">
                      <Crown className="w-3 h-3 text-black" />
                    </div>
                    <div className="bg-white/8 rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex gap-1.5 items-center">
                        <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Quick Actions */}
              {messages.length <= 1 && (
                <div className="px-4 pb-2">
                  <p className="text-[10px] text-white/30 mb-2 uppercase tracking-wide">Quick actions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_ACTIONS.map((action) => (
                      <button
                        key={action}
                        onClick={() => sendMessage(action)}
                        className="text-[11px] bg-white/8 hover:bg-white/14 text-white/60 hover:text-white border border-white/10 rounded-full px-2.5 py-1 transition"
                      >
                        {action}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Input */}
              <div className="flex items-end gap-2 p-3 border-t border-white/8 flex-shrink-0">
                <textarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask anything about your CRM..."
                  rows={1}
                  className="flex-1 bg-white/8 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-yellow-500/50 resize-none leading-5 max-h-24 overflow-y-auto"
                  style={{ minHeight: "40px" }}
                />
                <button
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || loading}
                  className="w-9 h-9 flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-yellow-500 to-yellow-400 hover:from-yellow-400 hover:to-yellow-300 text-black rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}
