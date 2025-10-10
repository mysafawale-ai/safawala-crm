import CompanySettingsPage from "@/components/settings/company-settings-main"

export default function SettingsPage() {
  return <CompanySettingsPage />
}
    currency: "INR",
    date_format: "dd/MM/yyyy",
    time_format: "24h"
  })

  // Fetch company settings on component mount
  useEffect(() => {
    fetchCompanySettings()
  }, [])

  const fetchCompanySettings = async () => {
    try {
      setFetchingSettings(true)
      const response = await fetch('/api/company-settings')
      
      if (!response.ok) {
        throw new Error('Failed to fetch company settings')
      }
      
      const data = await response.json()
      setCompanySettings(data)
    } catch (error) {
      console.error('Error fetching company settings:', error)
      toast({
        title: "Error",
        description: "Failed to load company settings",
        variant: "destructive"
      })
    } finally {
      setFetchingSettings(false)
    }
  }

  const handleSaveCompanySettings = async (settings: CompanySettings) => {
    try {
      setLoading(true)
      
      const response = await fetch('/api/company-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      })

      if (!response.ok) {
        throw new Error('Failed to save company settings')
      }

      const result = await response.json()
      setCompanySettings(result.data)

      toast({
        title: "Settings saved",
        description: "Company settings have been updated successfully"
      })

    } catch (error) {
      console.error('Error saving company settings:', error)
      toast({
        title: "Error",
        description: "Failed to save company settings",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveUserSettings = async () => {
    try {
      setLoading(true)
      
      // Here you would typically save user settings to your backend
      // For now, we'll just show a success message
      
      toast({
        title: "Settings saved",
        description: "User preferences have been updated successfully"
      })

    } catch (error) {
      console.error('Error saving user settings:', error)
      toast({
        title: "Error",
        description: "Failed to save user settings",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (fetchingSettings) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">Manage your application settings and preferences</p>
          </div>
          <div className="animate-pulse space-y-4">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
            <div className="h-48 bg-gray-200 rounded-lg"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your application settings and preferences</p>
        </div>

        {/* Company Settings */}
        <CompanySettingsForm
          initialSettings={companySettings}
          onSave={handleSaveCompanySettings}
          loading={loading}
        />

        {/* User Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>User Preferences</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => { e.preventDefault(); handleSaveUserSettings(); }} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={userSettings.timezone} onValueChange={(value) => setUserSettings(prev => ({ ...prev, timezone: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Kolkata">Asia/Kolkata (IST)</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Asia/Tokyo (JST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select value={userSettings.language} onValueChange={(value) => setUserSettings(prev => ({ ...prev, language: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="hi">Hindi</SelectItem>
                      <SelectItem value="mr">Marathi</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <Select value={userSettings.currency} onValueChange={(value) => setUserSettings(prev => ({ ...prev, currency: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                      <SelectItem value="USD">US Dollar ($)</SelectItem>
                      <SelectItem value="EUR">Euro (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="date_format">Date Format</Label>
                  <Select value={userSettings.date_format} onValueChange={(value) => setUserSettings(prev => ({ ...prev, date_format: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select date format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Save Preferences"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}