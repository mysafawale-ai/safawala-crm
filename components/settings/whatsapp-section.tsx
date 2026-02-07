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

      {/* Template Status & Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Message Templates
          </CardTitle>
          <CardDescription>
            Copy these templates to create them in your WATI dashboard. Use exact template names.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template Status Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {[
              { name: 'booking_confirmation', label: 'Booking Confirmation' },
              { name: 'payment_received', label: 'Payment Received' },
              { name: 'delivery_reminder', label: 'Delivery Reminder' },
              { name: 'return_reminder', label: 'Return Reminder' },
              { name: 'invoice_sent', label: 'Invoice Sent' },
              { name: 'payment_reminder', label: 'Payment Reminder' },
            ].map((template) => (
              <div key={template.name} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="text-sm font-medium">{template.label}</span>
                {getTemplateStatus(template.name)}
              </div>
            ))}
          </div>

          <Separator />

          {/* Template Content to Copy */}
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">📋 Templates to Create in WATI</h4>
            <p className="text-sm text-gray-600">
              Go to WATI Dashboard → Templates → Create New Template. Use these exact names and content.
            </p>

            {/* Template 1: booking_confirmation */}
            <div className="border rounded-lg p-4 space-y-3 bg-green-50">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-semibold">1. booking_confirmation</h5>
                  <span className="text-xs text-gray-500">Category: UTILITY | Language: English</span>
                </div>
                <Badge variant="outline" className="bg-white">Required</Badge>
              </div>
              <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap">
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
              <div className="text-xs text-gray-600">
                <strong>Parameters:</strong> {'{'}{'{'} 1 {'}'}{'}'}=Customer Name, {'{'}{'{'} 2 {'}'}{'}'}=Booking ID, {'{'}{'{'} 3 {'}'}{'}'}=Event Date, {'{'}{'{'} 4 {'}'}{'}'}=Items, {'{'}{'{'} 5 {'}'}{'}'}=Total Amount, {'{'}{'{'} 6 {'}'}{'}'}=Payment Status
              </div>
            </div>

            {/* Template 2: payment_received */}
            <div className="border rounded-lg p-4 space-y-3 bg-green-50">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-semibold">2. payment_received</h5>
                  <span className="text-xs text-gray-500">Category: UTILITY | Language: English</span>
                </div>
                <Badge variant="outline" className="bg-white">Required</Badge>
              </div>
              <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap">
{`Dear {{1}},

Thank you! Your payment has been received. ✅

💳 *Payment Details:*
• Amount: ₹{{2}}
• Booking ID: {{3}}
• Payment Date: {{4}}
• Method: {{5}}

📄 *Balance: ₹{{6}}*

Receipt will be shared separately.

📞 Contact: +91 97252 95692`}
              </div>
              <div className="text-xs text-gray-600">
                <strong>Parameters:</strong> {'{'}{'{'} 1 {'}'}{'}'}=Customer Name, {'{'}{'{'} 2 {'}'}{'}'}=Amount Paid, {'{'}{'{'} 3 {'}'}{'}'}=Booking ID, {'{'}{'{'} 4 {'}'}{'}'}=Payment Date, {'{'}{'{'} 5 {'}'}{'}'}=Payment Method, {'{'}{'{'} 6 {'}'}{'}'}=Balance Amount
              </div>
            </div>

            {/* Template 3: delivery_reminder */}
            <div className="border rounded-lg p-4 space-y-3 bg-blue-50">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-semibold">3. delivery_reminder</h5>
                  <span className="text-xs text-gray-500">Category: UTILITY | Language: English</span>
                </div>
                <Badge variant="outline" className="bg-white">Required</Badge>
              </div>
              <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap">
{`Dear {{1}},

Reminder: Your items are scheduled for delivery! 📦

📋 *Delivery Details:*
• Booking ID: {{2}}
• Delivery Date: {{3}}
• Delivery Time: {{4}}
• Address: {{5}}

📦 *Items:*
{{6}}

Please ensure someone is available to receive.

📞 Contact: +91 97252 95692`}
              </div>
              <div className="text-xs text-gray-600">
                <strong>Parameters:</strong> {'{'}{'{'} 1 {'}'}{'}'}=Customer Name, {'{'}{'{'} 2 {'}'}{'}'}=Booking ID, {'{'}{'{'} 3 {'}'}{'}'}=Delivery Date, {'{'}{'{'} 4 {'}'}{'}'}=Delivery Time, {'{'}{'{'} 5 {'}'}{'}'}=Delivery Address, {'{'}{'{'} 6 {'}'}{'}'}=Items List
              </div>
            </div>

            {/* Template 4: return_reminder */}
            <div className="border rounded-lg p-4 space-y-3 bg-orange-50">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-semibold">4. return_reminder</h5>
                  <span className="text-xs text-gray-500">Category: UTILITY | Language: English</span>
                </div>
                <Badge variant="outline" className="bg-white">Required</Badge>
              </div>
              <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap">
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
              <div className="text-xs text-gray-600">
                <strong>Parameters:</strong> {'{'}{'{'} 1 {'}'}{'}'}=Customer Name, {'{'}{'{'} 2 {'}'}{'}'}=Booking ID, {'{'}{'{'} 3 {'}'}{'}'}=Return Date, {'{'}{'{'} 4 {'}'}{'}'}=Return Time, {'{'}{'{'} 5 {'}'}{'}'}=Items List
              </div>
            </div>

            {/* Template 5: invoice_sent */}
            <div className="border rounded-lg p-4 space-y-3 bg-purple-50">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-semibold">5. invoice_sent</h5>
                  <span className="text-xs text-gray-500">Category: UTILITY | Language: English</span>
                </div>
                <Badge variant="outline" className="bg-white">Required</Badge>
              </div>
              <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap">
{`Dear {{1}},

Your invoice has been generated! 📄

📄 *Invoice Details:*
• Invoice No: {{2}}
• Date: {{3}}
• Amount: ₹{{4}}
• Due Date: {{5}}

💳 *Payment Options:*
• UPI: safawala@paytm
• Bank Transfer Available

📎 Invoice PDF attached.

📞 Contact: +91 97252 95692`}
              </div>
              <div className="text-xs text-gray-600">
                <strong>Parameters:</strong> {'{'}{'{'} 1 {'}'}{'}'}=Customer Name, {'{'}{'{'} 2 {'}'}{'}'}=Invoice Number, {'{'}{'{'} 3 {'}'}{'}'}=Invoice Date, {'{'}{'{'} 4 {'}'}{'}'}=Total Amount, {'{'}{'{'} 5 {'}'}{'}'}=Due Date
              </div>
            </div>

            {/* Template 6: payment_reminder */}
            <div className="border rounded-lg p-4 space-y-3 bg-red-50">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-semibold">6. payment_reminder</h5>
                  <span className="text-xs text-gray-500">Category: UTILITY | Language: English</span>
                </div>
                <Badge variant="outline" className="bg-white">Required</Badge>
              </div>
              <div className="bg-white p-3 rounded border text-sm font-mono whitespace-pre-wrap">
{`Dear {{1}},

Friendly reminder about your pending payment! 💳

📋 *Booking Details:*
• Booking ID: {{2}}
• Event Date: {{3}}
• Days Until Event: {{4}}

💰 *Payment Due:*
• Total Amount: ₹{{5}}
• Paid: ₹{{6}}
• Balance Due: ₹{{7}}

Please clear the balance before the event.

💳 *Payment Options:*
• UPI: safawala@paytm
• Bank Transfer Available

📞 Contact: +91 97252 95692`}
              </div>
              <div className="text-xs text-gray-600">
                <strong>Parameters:</strong> {'{'}{'{'} 1 {'}'}{'}'}=Customer Name, {'{'}{'{'} 2 {'}'}{'}'}=Booking ID, {'{'}{'{'} 3 {'}'}{'}'}=Event Date, {'{'}{'{'} 4 {'}'}{'}'}=Days Until Event, {'{'}{'{'} 5 {'}'}{'}'}=Total Amount, {'{'}{'{'} 6 {'}'}{'}'}=Amount Paid, {'{'}{'{'} 7 {'}'}{'}'}=Balance Due
              </div>
            </div>

          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
            <h5 className="font-semibold text-yellow-800 mb-2">⚠️ Important Notes:</h5>
            <ul className="text-sm text-yellow-700 space-y-1 list-disc list-inside">
              <li>Use EXACT template names shown above (lowercase with underscores)</li>
              <li>Select "UTILITY" as the category for all templates</li>
              <li>WhatsApp takes 24-48 hours to approve templates</li>
              <li>Parameters must be in order: {`{{1}}, {{2}}, {{3}}`} etc.</li>
              <li>After approval, click "Refresh" above to update status</li>
            </ul>
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
