"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { 
  MessageSquare, 
  Bell, 
  Clock, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  Loader2,
  RefreshCw,
  Smartphone,
} from 'lucide-react'

interface WhatsAppSectionProps {
  franchiseId: string
}

interface NotificationSettings {
  booking_confirmation: boolean
  payment_received: boolean
  delivery_reminder: boolean
  return_reminder: boolean
  invoice_sent: boolean
  delivery_reminder_hours: number
  return_reminder_hours: number
  business_hours_only: boolean
  business_start_time: string
  business_end_time: string
}

interface WATIConfig {
  is_active: boolean
  base_url: string
  instance_id: string
  test_phone: string
}

export function WhatsAppSection({ franchiseId }: WhatsAppSectionProps) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [watiConfig, setWatiConfig] = useState<WATIConfig | null>(null)
  const [templates, setTemplates] = useState<Record<string, string>>({})
  const [settings, setSettings] = useState<NotificationSettings>({
    booking_confirmation: true,
    payment_received: true,
    delivery_reminder: true,
    return_reminder: true,
    invoice_sent: true,
    delivery_reminder_hours: 24,
    return_reminder_hours: 24,
    business_hours_only: true,
    business_start_time: '09:00',
    business_end_time: '18:00',
  })
  const [testPhone, setTestPhone] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [franchiseId])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load WATI configuration
      const configRes = await fetch('/api/wati/setup')
      if (configRes.ok) {
        const configData = await configRes.json()
        setWatiConfig(configData.config)
        if (configData.config?.test_phone) {
          setTestPhone(configData.config.test_phone)
        }
      }

      // Load template statuses
      const templatesRes = await fetch('/api/wati/templates')
      if (templatesRes.ok) {
        const templatesData = await templatesRes.json()
        setTemplates(templatesData.templateStatuses || {})
      }

      // Load notification settings
      const settingsRes = await fetch(`/api/settings/whatsapp?franchiseId=${franchiseId}`)
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json()
        if (settingsData.settings) {
          setSettings(settingsData.settings)
        }
      }
    } catch (error) {
      console.error('[WhatsApp] Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ franchiseId, settings }),
      })

      if (res.ok) {
        toast({ title: 'Settings saved', description: 'WhatsApp notification settings updated' })
      } else {
        throw new Error('Failed to save')
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const handleSendTestMessage = async () => {
    if (!testPhone || testPhone.length < 10) {
      toast({ title: 'Invalid phone', description: 'Please enter a valid phone number', variant: 'destructive' })
      return
    }

    setTesting(true)
    try {
      const res = await fetch('/api/wati/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'test',
          phone: testPhone,
        }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        toast({ title: 'Test message sent!', description: `Check WhatsApp on ${testPhone}` })
      } else {
        throw new Error(data.error || 'Failed to send')
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to send test message', variant: 'destructive' })
    } finally {
      setTesting(false)
    }
  }

  const getTemplateStatus = (templateName: string) => {
    const status = templates[templateName]
    if (status === 'APPROVED') return <Badge className="bg-green-100 text-green-700">Approved</Badge>
    if (status === 'PENDING') return <Badge className="bg-yellow-100 text-yellow-700">Pending</Badge>
    if (status === 'REJECTED') return <Badge className="bg-red-100 text-red-700">Rejected</Badge>
    return <Badge variant="outline">Not Found</Badge>
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-green-600" />
            WhatsApp Integration (WATI)
          </CardTitle>
          <CardDescription>
            Connect with customers via WhatsApp Business API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              {watiConfig?.is_active ? (
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              ) : (
                <AlertCircle className="h-6 w-6 text-yellow-600" />
              )}
              <div>
                <p className="font-medium">
                  {watiConfig?.is_active ? 'Connected' : 'Not Connected'}
                </p>
                <p className="text-sm text-gray-500">
                  {watiConfig?.base_url || 'WATI API not configured'}
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Test Message */}
          <div className="space-y-2">
            <Label>Send Test Message</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Phone number (e.g., 919876543210)"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                className="max-w-xs"
              />
              <Button onClick={handleSendTestMessage} disabled={testing || !watiConfig?.is_active}>
                {testing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Send Test
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template Library */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            WhatsApp Template Library
          </CardTitle>
          <CardDescription>
            Complete list of all templates for WATI. Copy and create in your WATI dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h5 className="font-semibold text-yellow-800 mb-2">📝 How to Create Templates in WATI:</h5>
            <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
              <li>Go to WATI Dashboard → Templates → Create New Template</li>
              <li>Use EXACT template name shown (lowercase with underscores)</li>
              <li>Select "UTILITY" as category for all templates</li>
              <li>Copy the message body exactly as shown</li>
              <li>WhatsApp approval takes 24-48 hours</li>
            </ol>
          </div>

          {/* ==================== BOOKING TEMPLATES ==================== */}
          <div className="space-y-4">
            <h4 className="font-bold text-lg border-b pb-2 flex items-center gap-2">
              📋 Booking Templates (8)
            </h4>

            {/* 1. booking_confirmation */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="bg-green-100 text-green-700">Essential</Badge>
                  <span className="font-medium">booking_confirmation</span>
                </div>
                <span className="text-gray-500 text-sm">New booking created</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

Your booking has been confirmed! 🎉

📋 *Booking Details:*
• Booking ID: {{2}}
• Event Date: {{3}}
• Items: {{4}}

💰 *Payment:*
• Total: ₹{{5}}
• Status: {{6}}

📞 Contact: +91 97252 95692

Thank you for choosing Safawala! 🙏`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name, 2=BookingID, 3=EventDate, 4=Items, 5=Total, 6=PaymentStatus</p>
              </div>
            </details>

            {/* 2. booking_status_update */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Optional</Badge>
                  <span className="font-medium">booking_status_update</span>
                </div>
                <span className="text-gray-500 text-sm">Status changed</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

Your booking status has been updated! 📋

📋 *Booking Details:*
• Booking ID: {{2}}
• New Status: {{3}}
• Updated: {{4}}

Next Step: {{5}}

📞 Contact: +91 97252 95692`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name, 2=BookingID, 3=NewStatus, 4=UpdateDate, 5=NextAction</p>
              </div>
            </details>

            {/* 3. booking_modified */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Optional</Badge>
                  <span className="font-medium">booking_modified</span>
                </div>
                <span className="text-gray-500 text-sm">Booking details changed</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

Your booking has been modified! ✏️

📋 *Updated Booking:*
• Booking ID: {{2}}
• Changes: {{3}}
• New Total: ₹{{4}}

Please review the changes.

📞 Contact: +91 97252 95692`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name, 2=BookingID, 3=ChangesSummary, 4=NewTotal</p>
              </div>
            </details>

            {/* 4. booking_cancelled */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="bg-red-100 text-red-700">Important</Badge>
                  <span className="font-medium">booking_cancelled</span>
                </div>
                <span className="text-gray-500 text-sm">Booking cancelled</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

Your booking has been cancelled. ❌

📋 *Cancelled Booking:*
• Booking ID: {{2}}
• Event Date: {{3}}
• Reason: {{4}}

💰 *Refund (if applicable):*
• Amount: ₹{{5}}
• Status: {{6}}

We hope to serve you again!

📞 Contact: +91 97252 95692`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name, 2=BookingID, 3=EventDate, 4=Reason, 5=RefundAmount, 6=RefundStatus</p>
              </div>
            </details>

            {/* 5. booking_rescheduled */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Optional</Badge>
                  <span className="font-medium">booking_rescheduled</span>
                </div>
                <span className="text-gray-500 text-sm">Event date changed</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

Your booking has been rescheduled! 📅

📋 *Updated Schedule:*
• Booking ID: {{2}}
• Old Date: {{3}}
• New Date: {{4}}
• New Time: {{5}}

All items will be ready for the new date.

📞 Contact: +91 97252 95692`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name, 2=BookingID, 3=OldDate, 4=NewDate, 5=NewTime</p>
              </div>
            </details>

            {/* 6. booking_on_hold */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Optional</Badge>
                  <span className="font-medium">booking_on_hold</span>
                </div>
                <span className="text-gray-500 text-sm">Booking put on hold</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

Your booking is currently on hold. ⏸️

📋 *Booking Details:*
• Booking ID: {{2}}
• Event Date: {{3}}
• Reason: {{4}}

Action Required: {{5}}

Please contact us to proceed.

📞 Contact: +91 97252 95692`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name, 2=BookingID, 3=EventDate, 4=Reason, 5=ActionRequired</p>
              </div>
            </details>

            {/* 7. booking_completed */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="bg-green-100 text-green-700">Essential</Badge>
                  <span className="font-medium">booking_completed</span>
                </div>
                <span className="text-gray-500 text-sm">After return completed</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

Your booking is complete! 🎉

📋 *Booking Summary:*
• Booking ID: {{2}}
• Event Date: {{3}}
• Items Returned: ✅

💰 *Final Statement:*
• Total: ₹{{4}}
• Paid: ₹{{5}}
• Security Deposit Refunded: ₹{{6}}

Thank you for choosing Safawala!
We hope to serve you again! 🙏

📞 Contact: +91 97252 95692`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name, 2=BookingID, 3=EventDate, 4=Total, 5=Paid, 6=DepositRefund</p>
              </div>
            </details>

            {/* 8. booking_summary */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Optional</Badge>
                  <span className="font-medium">booking_summary</span>
                </div>
                <span className="text-gray-500 text-sm">Weekly/Monthly summary</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

Here's your booking summary! 📊

📋 *Your Bookings:*
• Total Bookings: {{2}}
• Upcoming: {{3}}
• Completed: {{4}}

💰 *Payment Summary:*
• Total Spent: ₹{{5}}
• Outstanding: ₹{{6}}

Thank you for your loyalty! 🙏

📞 Contact: +91 97252 95692`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name, 2=TotalBookings, 3=Upcoming, 4=Completed, 5=TotalSpent, 6=Outstanding</p>
              </div>
            </details>
          </div>

          {/* ==================== PAYMENT TEMPLATES ==================== */}
          <div className="space-y-4">
            <h4 className="font-bold text-lg border-b pb-2 flex items-center gap-2">
              💳 Payment Templates (8)
            </h4>

            {/* 1. payment_reminder */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="bg-green-100 text-green-700">Essential</Badge>
                  <span className="font-medium">payment_reminder</span>
                </div>
                <span className="text-gray-500 text-sm">10, 7, 3, 1 days before event</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

Friendly reminder about your pending payment! 💳

📋 *Booking Details:*
• Booking ID: {{2}}
• Event Date: {{3}}
• Days Until Event: {{4}}

💰 *Payment Due:*
• Total: ₹{{5}}
• Paid: ₹{{6}}
• Balance: ₹{{7}}

Please clear the balance before the event.

💳 UPI: safawala@paytm

📞 Contact: +91 97252 95692`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name, 2=BookingID, 3=EventDate, 4=DaysUntil, 5=Total, 6=Paid, 7=Balance</p>
              </div>
            </details>

            {/* 2. payment_received */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="bg-green-100 text-green-700">Essential</Badge>
                  <span className="font-medium">payment_received</span>
                </div>
                <span className="text-gray-500 text-sm">Payment recorded</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

Thank you! Your payment has been received. ✅

💳 *Payment Details:*
• Amount: ₹{{2}}
• Booking ID: {{3}}
• Date: {{4}}
• Method: {{5}}

📄 *Balance: ₹{{6}}*

Receipt will be shared separately.

📞 Contact: +91 97252 95692`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name, 2=Amount, 3=BookingID, 4=Date, 5=Method, 6=Balance</p>
              </div>
            </details>

            {/* 3. payment_overdue */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="bg-red-100 text-red-700">Important</Badge>
                  <span className="font-medium">payment_overdue</span>
                </div>
                <span className="text-gray-500 text-sm">Payment past due date</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

Your payment is overdue! ⚠️

📋 *Booking Details:*
• Booking ID: {{2}}
• Event Date: {{3}}
• Due Date: {{4}}

💰 *Amount Overdue:*
• Balance Due: ₹{{5}}
• Days Overdue: {{6}}

Please make the payment immediately to avoid service interruption.

💳 UPI: safawala@paytm

📞 Contact: +91 97252 95692`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name, 2=BookingID, 3=EventDate, 4=DueDate, 5=Balance, 6=DaysOverdue</p>
              </div>
            </details>

            {/* 4. payment_partial */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Optional</Badge>
                  <span className="font-medium">payment_partial</span>
                </div>
                <span className="text-gray-500 text-sm">Partial payment received</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

Partial payment received! ✅

💳 *Payment Received:*
• Amount: ₹{{2}}
• Booking ID: {{3}}

💰 *Balance Status:*
• Total: ₹{{4}}
• Paid: ₹{{5}}
• Remaining: ₹{{6}}

Please clear remaining balance before {{7}}.

📞 Contact: +91 97252 95692`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name, 2=AmountPaid, 3=BookingID, 4=Total, 5=TotalPaid, 6=Remaining, 7=DueDate</p>
              </div>
            </details>

            {/* 5. security_deposit_reminder */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Optional</Badge>
                  <span className="font-medium">security_deposit_reminder</span>
                </div>
                <span className="text-gray-500 text-sm">Remind about deposit</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

Reminder: Security deposit pending! 🔒

📋 *Booking Details:*
• Booking ID: {{2}}
• Event Date: {{3}}

💰 *Security Deposit:*
• Amount: ₹{{4}}
• Due By: {{5}}

Security deposit is required before item delivery.

💳 UPI: safawala@paytm

📞 Contact: +91 97252 95692`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name, 2=BookingID, 3=EventDate, 4=DepositAmount, 5=DueDate</p>
              </div>
            </details>

            {/* 6. security_deposit_received */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Optional</Badge>
                  <span className="font-medium">security_deposit_received</span>
                </div>
                <span className="text-gray-500 text-sm">Deposit collected</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

Security deposit received! ✅

🔒 *Deposit Details:*
• Amount: ₹{{2}}
• Booking ID: {{3}}
• Date: {{4}}

This deposit will be refunded after items are returned in good condition.

📞 Contact: +91 97252 95692`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name, 2=Amount, 3=BookingID, 4=Date</p>
              </div>
            </details>

            {/* 7. security_deposit_refunded */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="bg-green-100 text-green-700">Essential</Badge>
                  <span className="font-medium">security_deposit_refunded</span>
                </div>
                <span className="text-gray-500 text-sm">Deposit returned</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

Your security deposit has been refunded! 💰

🔒 *Refund Details:*
• Amount: ₹{{2}}
• Booking ID: {{3}}
• Refund Date: {{4}}
• Refund Method: {{5}}

Thank you for returning items in good condition!

📞 Contact: +91 97252 95692`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name, 2=Amount, 3=BookingID, 4=Date, 5=Method</p>
              </div>
            </details>

            {/* 8. refund_processed */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Optional</Badge>
                  <span className="font-medium">refund_processed</span>
                </div>
                <span className="text-gray-500 text-sm">Cancellation refund</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

Your refund has been processed! 💰

💳 *Refund Details:*
• Amount: ₹{{2}}
• Booking ID: {{3}}
• Reason: {{4}}
• Refund Date: {{5}}

Amount will be credited within 5-7 working days.

📞 Contact: +91 97252 95692`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name, 2=Amount, 3=BookingID, 4=Reason, 5=Date</p>
              </div>
            </details>
          </div>

          {/* ==================== DELIVERY TEMPLATES ==================== */}
          <div className="space-y-4">
            <h4 className="font-bold text-lg border-b pb-2 flex items-center gap-2">
              📦 Delivery Templates (6)
            </h4>

            {/* 1. delivery_scheduled */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Optional</Badge>
                  <span className="font-medium">delivery_scheduled</span>
                </div>
                <span className="text-gray-500 text-sm">Delivery date confirmed</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

Your delivery has been scheduled! 📅

📦 *Delivery Details:*
• Booking ID: {{2}}
• Date: {{3}}
• Time: {{4}}
• Address: {{5}}

Our team will contact you before delivery.

📞 Contact: +91 97252 95692`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name, 2=BookingID, 3=Date, 4=Time, 5=Address</p>
              </div>
            </details>

            {/* 2. delivery_reminder */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="bg-green-100 text-green-700">Essential</Badge>
                  <span className="font-medium">delivery_reminder</span>
                </div>
                <span className="text-gray-500 text-sm">Day before delivery</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

Reminder: Your items are scheduled for delivery tomorrow! 📦

📋 *Delivery Details:*
• Booking ID: {{2}}
• Date: {{3}}
• Time: {{4}}
• Address: {{5}}

📦 *Items:*
{{6}}

Please ensure someone is available to receive.

📞 Contact: +91 97252 95692`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name, 2=BookingID, 3=Date, 4=Time, 5=Address, 6=ItemsList</p>
              </div>
            </details>

            {/* 3. delivery_out_for_delivery */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Optional</Badge>
                  <span className="font-medium">delivery_out_for_delivery</span>
                </div>
                <span className="text-gray-500 text-sm">Items dispatched</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

Your items are out for delivery! 🚚

📦 *Delivery Details:*
• Booking ID: {{2}}
• Driver: {{3}}
• Contact: {{4}}
• ETA: {{5}}

Please keep your phone accessible.

📞 Contact: +91 97252 95692`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name, 2=BookingID, 3=DriverName, 4=DriverPhone, 5=ETA</p>
              </div>
            </details>

            {/* 4. delivery_completed */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="bg-green-100 text-green-700">Essential</Badge>
                  <span className="font-medium">delivery_completed</span>
                </div>
                <span className="text-gray-500 text-sm">Items delivered</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

Your items have been delivered! ✅

📦 *Delivery Details:*
• Booking ID: {{2}}
• Delivered On: {{3}}
• Received By: {{4}}

📋 *Items Delivered:*
{{5}}

⚠️ *Return Date: {{6}}*

Please return items in the same condition.

📞 Contact: +91 97252 95692`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name, 2=BookingID, 3=DeliveryDate, 4=ReceivedBy, 5=Items, 6=ReturnDate</p>
              </div>
            </details>

            {/* 5. delivery_delayed */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="bg-red-100 text-red-700">Important</Badge>
                  <span className="font-medium">delivery_delayed</span>
                </div>
                <span className="text-gray-500 text-sm">Delivery postponed</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

⚠️ Your delivery has been delayed.

📦 *Details:*
• Booking ID: {{2}}
• Original Date: {{3}}
• New Date: {{4}}
• Reason: {{5}}

We apologize for the inconvenience.

📞 Contact: +91 97252 95692`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name, 2=BookingID, 3=OriginalDate, 4=NewDate, 5=Reason</p>
              </div>
            </details>

            {/* 6. delivery_failed */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="bg-red-100 text-red-700">Important</Badge>
                  <span className="font-medium">delivery_failed</span>
                </div>
                <span className="text-gray-500 text-sm">Delivery unsuccessful</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

❌ Delivery attempt was unsuccessful.

📦 *Details:*
• Booking ID: {{2}}
• Date: {{3}}
• Reason: {{4}}

Please contact us to reschedule.

📞 Contact: +91 97252 95692`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name, 2=BookingID, 3=Date, 4=Reason</p>
              </div>
            </details>
          </div>

          {/* ==================== RETURN TEMPLATES ==================== */}
          <div className="space-y-4">
            <h4 className="font-bold text-lg border-b pb-2 flex items-center gap-2">
              🔄 Return Templates (6)
            </h4>

            {/* 1. return_reminder */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="bg-green-100 text-green-700">Essential</Badge>
                  <span className="font-medium">return_reminder</span>
                </div>
                <span className="text-gray-500 text-sm">Day before return</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

Reminder: Your items are due for return! 🔄

📋 *Return Details:*
• Booking ID: {{2}}
• Return Date: {{3}}
• Return Time: {{4}}

📦 *Items to Return:*
{{5}}

Please return items in good condition.
Late returns may incur additional charges.

📞 Contact: +91 97252 95692`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name, 2=BookingID, 3=Date, 4=Time, 5=Items</p>
              </div>
            </details>

            {/* 2. return_scheduled */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Optional</Badge>
                  <span className="font-medium">return_scheduled</span>
                </div>
                <span className="text-gray-500 text-sm">Return pickup scheduled</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

Your return pickup has been scheduled! 📅

📦 *Pickup Details:*
• Booking ID: {{2}}
• Date: {{3}}
• Time: {{4}}
• Address: {{5}}

Please keep items ready for pickup.

📞 Contact: +91 97252 95692`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name, 2=BookingID, 3=Date, 4=Time, 5=Address</p>
              </div>
            </details>

            {/* 3. return_overdue */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="bg-red-100 text-red-700">Important</Badge>
                  <span className="font-medium">return_overdue</span>
                </div>
                <span className="text-gray-500 text-sm">Items not returned</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

⚠️ Your items are overdue for return!

📦 *Details:*
• Booking ID: {{2}}
• Due Date: {{3}}
• Days Overdue: {{4}}

📦 *Pending Items:*
{{5}}

Late fee: ₹{{6}} per day

Please return immediately to avoid additional charges.

📞 Contact: +91 97252 95692`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name, 2=BookingID, 3=DueDate, 4=DaysOverdue, 5=Items, 6=LateFee</p>
              </div>
            </details>

            {/* 4. return_completed */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="bg-green-100 text-green-700">Essential</Badge>
                  <span className="font-medium">return_completed</span>
                </div>
                <span className="text-gray-500 text-sm">All items returned</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

All items have been returned! ✅

📦 *Return Details:*
• Booking ID: {{2}}
• Return Date: {{3}}
• Condition: {{4}}

💰 *Security Deposit:*
• Refund Amount: ₹{{5}}
• Refund Status: {{6}}

Thank you for choosing Safawala! 🙏

📞 Contact: +91 97252 95692`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name, 2=BookingID, 3=Date, 4=Condition, 5=RefundAmount, 6=RefundStatus</p>
              </div>
            </details>

            {/* 5. return_partial */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Optional</Badge>
                  <span className="font-medium">return_partial</span>
                </div>
                <span className="text-gray-500 text-sm">Some items pending</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

⚠️ Partial return received.

📦 *booking Details:*
• Booking ID: {{2}}
• Items Returned: {{3}}

📋 *Still Pending:*
{{4}}

Please return remaining items by {{5}}.

📞 Contact: +91 97252 95692`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name, 2=BookingID, 3=ReturnedCount, 4=PendingItems, 5=DueDate</p>
              </div>
            </details>

            {/* 6. return_damage_notice */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="bg-red-100 text-red-700">Important</Badge>
                  <span className="font-medium">return_damage_notice</span>
                </div>
                <span className="text-gray-500 text-sm">Damage found</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

⚠️ Damage found in returned items.

📦 *Details:*
• Booking ID: {{2}}
• Item: {{3}}
• Damage: {{4}}

💰 *Damage Charges:*
• Amount: ₹{{5}}
• Deducted from deposit: {{6}}

Please contact us for any clarification.

📞 Contact: +91 97252 95692`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name, 2=BookingID, 3=Item, 4=DamageDesc, 5=ChargeAmount, 6=Yes/No</p>
              </div>
            </details>
          </div>

          {/* ==================== INVOICE TEMPLATES ==================== */}
          <div className="space-y-4">
            <h4 className="font-bold text-lg border-b pb-2 flex items-center gap-2">
              📄 Invoice Templates (4)
            </h4>

            {/* 1. invoice_generated */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Optional</Badge>
                  <span className="font-medium">invoice_generated</span>
                </div>
                <span className="text-gray-500 text-sm">Invoice created</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

Your invoice has been generated! 📄

📄 *Invoice Details:*
• Invoice No: {{2}}
• Date: {{3}}
• Amount: ₹{{4}}
• Due Date: {{5}}

Invoice PDF will be shared separately.

📞 Contact: +91 97252 95692`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name, 2=InvoiceNo, 3=Date, 4=Amount, 5=DueDate</p>
              </div>
            </details>

            {/* 2. invoice_sent */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="bg-green-100 text-green-700">Essential</Badge>
                  <span className="font-medium">invoice_sent</span>
                </div>
                <span className="text-gray-500 text-sm">Invoice shared</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

Please find your invoice attached. 📄

📄 *Invoice Details:*
• Invoice No: {{2}}
• Amount: ₹{{3}}
• Due Date: {{4}}

💳 *Payment Options:*
• UPI: safawala@paytm
• Bank Transfer Available

📞 Contact: +91 97252 95692`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name, 2=InvoiceNo, 3=Amount, 4=DueDate</p>
              </div>
            </details>

            {/* 3. invoice_payment_reminder */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Optional</Badge>
                  <span className="font-medium">invoice_payment_reminder</span>
                </div>
                <span className="text-gray-500 text-sm">Invoice payment due</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

Reminder: Invoice payment is due! 💳

📄 *Invoice Details:*
• Invoice No: {{2}}
• Amount: ₹{{3}}
• Due Date: {{4}}
• Days Remaining: {{5}}

💳 UPI: safawala@paytm

📞 Contact: +91 97252 95692`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name, 2=InvoiceNo, 3=Amount, 4=DueDate, 5=DaysRemaining</p>
              </div>
            </details>

            {/* 4. invoice_paid */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Optional</Badge>
                  <span className="font-medium">invoice_paid</span>
                </div>
                <span className="text-gray-500 text-sm">Invoice marked paid</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

Invoice payment received! ✅

📄 *Payment Details:*
• Invoice No: {{2}}
• Amount: ₹{{3}}
• Payment Date: {{4}}
• Status: PAID

Thank you for your payment!

📞 Contact: +91 97252 95692`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name, 2=InvoiceNo, 3=Amount, 4=PaymentDate</p>
              </div>
            </details>
          </div>

          {/* ==================== QUOTE TEMPLATES ==================== */}
          <div className="space-y-4">
            <h4 className="font-bold text-lg border-b pb-2 flex items-center gap-2">
              💬 Quote & Enquiry Templates (4)
            </h4>

            {/* 1. quote_generated */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="bg-green-100 text-green-700">Essential</Badge>
                  <span className="font-medium">quote_generated</span>
                </div>
                <span className="text-gray-500 text-sm">New quote created</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

Your quote is ready! 📋

💬 *Quote Details:*
• Quote ID: {{2}}
• Event Date: {{3}}
• Items: {{4}}
• Total: ₹{{5}}

Valid until: {{6}}

Reply to confirm your booking!

📞 Contact: +91 97252 95692`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name, 2=QuoteID, 3=EventDate, 4=Items, 5=Total, 6=ValidUntil</p>
              </div>
            </details>

            {/* 2. quote_followup */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="bg-green-100 text-green-700">Essential</Badge>
                  <span className="font-medium">quote_followup</span>
                </div>
                <span className="text-gray-500 text-sm">Follow-up after 2-3 days</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

Just following up on your quote! 📋

💬 *Quote Details:*
• Quote ID: {{2}}
• Event Date: {{3}}
• Total: ₹{{4}}

Have any questions? We're here to help!

Reply YES to confirm your booking.

📞 Contact: +91 97252 95692`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name, 2=QuoteID, 3=EventDate, 4=Total</p>
              </div>
            </details>

            {/* 3. quote_expiring */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Optional</Badge>
                  <span className="font-medium">quote_expiring</span>
                </div>
                <span className="text-gray-500 text-sm">Quote about to expire</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

⚠️ Your quote is expiring soon!

💬 *Quote Details:*
• Quote ID: {{2}}
• Total: ₹{{3}}
• Expires: {{4}}

Don't miss out - confirm your booking today!

📞 Contact: +91 97252 95692`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name, 2=QuoteID, 3=Total, 4=ExpiryDate</p>
              </div>
            </details>

            {/* 4. quote_converted */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Optional</Badge>
                  <span className="font-medium">quote_converted</span>
                </div>
                <span className="text-gray-500 text-sm">Quote accepted</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

Great news! Your booking is confirmed! 🎉

💬 *From Quote:*
• Quote ID: {{2}}

📋 *New Booking:*
• Booking ID: {{3}}
• Event Date: {{4}}
• Total: ₹{{5}}

You'll receive booking confirmation shortly.

📞 Contact: +91 97252 95692`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name, 2=QuoteID, 3=BookingID, 4=EventDate, 5=Total</p>
              </div>
            </details>
          </div>

          {/* ==================== CUSTOMER TEMPLATES ==================== */}
          <div className="space-y-4">
            <h4 className="font-bold text-lg border-b pb-2 flex items-center gap-2">
              👤 Customer Engagement Templates (6)
            </h4>

            {/* 1. customer_welcome */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Optional</Badge>
                  <span className="font-medium">customer_welcome</span>
                </div>
                <span className="text-gray-500 text-sm">New customer registered</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

Welcome to Safawala! 🙏

We're delighted to have you as our customer.

🎉 *What We Offer:*
• Premium Wedding Accessories
• Turbans, Safas & Pagdis
• Jewelry & Ornaments
• Complete Wedding Sets

Visit our store or browse online!

📞 Contact: +91 97252 95692`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name</p>
              </div>
            </details>

            {/* 2. customer_birthday */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Optional</Badge>
                  <span className="font-medium">customer_birthday</span>
                </div>
                <span className="text-gray-500 text-sm">Birthday wishes</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

🎂 Happy Birthday! 🎉

Wishing you a wonderful birthday filled with joy and happiness!

🎁 *Special Birthday Offer:*
Get {{2}}% off on your next booking!
Use code: BDAY{{3}}

Valid until: {{4}}

📞 Contact: +91 97252 95692`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name, 2=DiscountPercent, 3=Year, 4=ValidDate</p>
              </div>
            </details>

            {/* 3. customer_anniversary */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Optional</Badge>
                  <span className="font-medium">customer_anniversary</span>
                </div>
                <span className="text-gray-500 text-sm">Anniversary wishes</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

💍 Happy Anniversary! 🎉

Wishing you a beautiful day celebrating your special bond!

Thank you for choosing Safawala for your special day.

📞 Contact: +91 97252 95692`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name</p>
              </div>
            </details>

            {/* 4. customer_feedback */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="bg-green-100 text-green-700">Essential</Badge>
                  <span className="font-medium">customer_feedback</span>
                </div>
                <span className="text-gray-500 text-sm">After booking completion</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

Thank you for choosing Safawala! 🙏

We hope you had a wonderful experience.

📋 *Your Recent Booking:*
• Booking ID: {{2}}
• Event Date: {{3}}

We'd love to hear your feedback!
Please rate us: ⭐⭐⭐⭐⭐

Your feedback helps us serve you better.

📞 Contact: +91 97252 95692`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name, 2=BookingID, 3=EventDate</p>
              </div>
            </details>

            {/* 5. customer_thank_you */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Optional</Badge>
                  <span className="font-medium">customer_thank_you</span>
                </div>
                <span className="text-gray-500 text-sm">After transaction</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

Thank you for your business! 🙏

We truly appreciate your trust in Safawala.

Your satisfaction is our priority.
We look forward to serving you again!

📞 Contact: +91 97252 95692`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name</p>
              </div>
            </details>

            {/* 6. customer_referral */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Optional</Badge>
                  <span className="font-medium">customer_referral</span>
                </div>
                <span className="text-gray-500 text-sm">Request referrals</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

Know someone getting married? 💍

🎁 *Refer & Earn:*
Refer a friend and get ₹{{2}} off on your next booking!

Your friend also gets {{3}}% discount on their first booking.

Share our number: +91 97252 95692

Thank you for spreading the word! 🙏`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name, 2=ReferralBonus, 3=FriendDiscount</p>
              </div>
            </details>
          </div>

          {/* ==================== MARKETING TEMPLATES ==================== */}
          <div className="space-y-4">
            <h4 className="font-bold text-lg border-b pb-2 flex items-center gap-2">
              📢 Marketing Templates (4)
            </h4>

            {/* 1. new_arrivals */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="bg-purple-100 text-purple-700">Marketing</Badge>
                  <span className="font-medium">new_arrivals</span>
                </div>
                <span className="text-gray-500 text-sm">New products added</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

🆕 New Arrivals at Safawala!

Check out our latest collection:
{{2}}

🎉 *Launch Offer:*
{{3}}% off on new arrivals!

Visit us today!

📞 Contact: +91 97252 95692`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name, 2=ProductList, 3=DiscountPercent</p>
              </div>
            </details>

            {/* 2. seasonal_collection */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="bg-purple-100 text-purple-700">Marketing</Badge>
                  <span className="font-medium">seasonal_collection</span>
                </div>
                <span className="text-gray-500 text-sm">Wedding season offers</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

💒 Wedding Season Special!

Get ready for the season with our exclusive collection!

🎁 *Season Offers:*
• {{2}}% off on packages
• Free accessories worth ₹{{3}}
• Early booking bonus!

Valid until: {{4}}

Book now!

📞 Contact: +91 97252 95692`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name, 2=DiscountPercent, 3=FreeGiftValue, 4=ValidDate</p>
              </div>
            </details>

            {/* 3. special_discount */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="bg-purple-100 text-purple-700">Marketing</Badge>
                  <span className="font-medium">special_discount</span>
                </div>
                <span className="text-gray-500 text-sm">Special offers</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

🎉 Special Offer Just For You!

💰 *Get {{2}}% OFF*
On your next booking!

Use code: {{3}}
Valid until: {{4}}

Don't miss this limited-time offer!

📞 Contact: +91 97252 95692`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name, 2=DiscountPercent, 3=CouponCode, 4=ValidDate</p>
              </div>
            </details>

            {/* 4. festive_wishes */}
            <details className="border rounded-lg">
              <summary className="p-4 cursor-pointer hover:bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge className="bg-purple-100 text-purple-700">Marketing</Badge>
                  <span className="font-medium">festive_wishes</span>
                </div>
                <span className="text-gray-500 text-sm">Festival greetings</span>
              </summary>
              <div className="p-4 border-t bg-gray-50">
                <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap mb-2">
{`Dear {{1}},

🎊 {{2}} Mubarak!

Wishing you and your family a joyous celebration!

🎁 *Festive Special:*
{{3}}% off on all bookings this {{4}}!

Celebrate in style with Safawala!

📞 Contact: +91 97252 95692`}
                </div>
                <p className="text-xs text-gray-600"><strong>Params:</strong> 1=Name, 2=FestivalName, 3=DiscountPercent, 4=FestivalName</p>
              </div>
            </details>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
            <h5 className="font-semibold text-green-800 mb-2">✅ Template Summary</h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-green-700">
              <div>📋 Booking: 8</div>
              <div>💳 Payment: 8</div>
              <div>📦 Delivery: 6</div>
              <div>🔄 Return: 6</div>
              <div>📄 Invoice: 4</div>
              <div>💬 Quotes: 4</div>
              <div>👤 Customer: 6</div>
              <div>📢 Marketing: 4</div>
            </div>
            <p className="text-sm text-green-700 mt-2 font-medium">Total: 46 Templates</p>
          </div>
        </CardContent>
      </Card>

      {/* Auto Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Auto Notifications
          </CardTitle>
          <CardDescription>
            Automatically send WhatsApp messages on business events
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Booking Confirmation</Label>
                <p className="text-sm text-gray-500">Send when a new booking is created</p>
              </div>
              <Switch
                checked={settings.booking_confirmation}
                onCheckedChange={(checked) => setSettings({ ...settings, booking_confirmation: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Payment Received</Label>
                <p className="text-sm text-gray-500">Send when payment is recorded</p>
              </div>
              <Switch
                checked={settings.payment_received}
                onCheckedChange={(checked) => setSettings({ ...settings, payment_received: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Delivery Reminder</Label>
                <p className="text-sm text-gray-500">Send before scheduled delivery</p>
              </div>
              <Switch
                checked={settings.delivery_reminder}
                onCheckedChange={(checked) => setSettings({ ...settings, delivery_reminder: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Return Reminder</Label>
                <p className="text-sm text-gray-500">Send before return due date</p>
              </div>
              <Switch
                checked={settings.return_reminder}
                onCheckedChange={(checked) => setSettings({ ...settings, return_reminder: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Invoice Sent</Label>
                <p className="text-sm text-gray-500">Send invoice PDF to customer</p>
              </div>
              <Switch
                checked={settings.invoice_sent}
                onCheckedChange={(checked) => setSettings({ ...settings, invoice_sent: checked })}
              />
            </div>
          </div>

          <Separator />

          {/* Reminder Timing */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Reminder Timing
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Delivery Reminder (hours before)</Label>
                <Input
                  type="number"
                  min={1}
                  max={72}
                  value={settings.delivery_reminder_hours}
                  onChange={(e) => setSettings({ ...settings, delivery_reminder_hours: parseInt(e.target.value) || 24 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Return Reminder (hours before)</Label>
                <Input
                  type="number"
                  min={1}
                  max={72}
                  value={settings.return_reminder_hours}
                  onChange={(e) => setSettings({ ...settings, return_reminder_hours: parseInt(e.target.value) || 24 })}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Business Hours */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Business Hours Only</Label>
                <p className="text-sm text-gray-500">Only send messages during business hours</p>
              </div>
              <Switch
                checked={settings.business_hours_only}
                onCheckedChange={(checked) => setSettings({ ...settings, business_hours_only: checked })}
              />
            </div>

            {settings.business_hours_only && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input
                    type="time"
                    value={settings.business_start_time}
                    onChange={(e) => setSettings({ ...settings, business_start_time: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input
                    type="time"
                    value={settings.business_end_time}
                    onChange={(e) => setSettings({ ...settings, business_end_time: e.target.value })}
                  />
                </div>
              </div>
            )}
          </div>

          <Button onClick={handleSaveSettings} disabled={saving} className="w-full">
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Save Notification Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
