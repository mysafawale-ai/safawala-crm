"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { ToastService } from '@/lib/toast-service'
import { 
  User, 
  Upload, 
  Camera,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Calendar,
  Save,
  Loader2,
  FileSignature,
  Edit3,
  AlertCircle
} from 'lucide-react'

interface UserProfile {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  role: string
  designation: string
  department: string
  employee_id?: string
  date_of_joining?: string
  address: string
  city: string
  state: string
  postal_code: string
  emergency_contact_name?: string
  emergency_contact_phone?: string
  bio?: string
  profile_photo_url?: string
  signature_url?: string
}

interface ProfileSectionProps {
  franchiseId: string
  userId?: string
}

export function ProfileSection({ franchiseId, userId }: ProfileSectionProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [fileUploading, setFileUploading] = useState<{ [key: string]: boolean }>({})
  const { toast } = useToast()

  const [profileForm, setProfileForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: '',
    designation: '',
    department: '',
    employee_id: '',
    date_of_joining: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    bio: '',
    profile_photo_url: '',
    signature_url: ''
  })

  useEffect(() => {
    if (franchiseId) {
      fetchProfile()
    } else {
      setLoading(false)
      ToastService.warning({
        title: 'Missing Franchise ID',
        description: 'Unable to load profile without franchise information. Please contact support.'
      })
    }
  }, [franchiseId, userId])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      
      if (!franchiseId) {
        throw new Error('Franchise ID is required to load profile')
      }
      
      const params = new URLSearchParams({ franchise_id: franchiseId })
      if (userId) params.append('user_id', userId)
      
      const response = await fetch(`/api/settings/profile?${params}`)
      
      if (response.ok) {
        const result = await response.json()
        if (result.data) {
          setProfile(result.data)
          setProfileForm({
            first_name: result.data.first_name || '',
            last_name: result.data.last_name || '',
            email: result.data.email || '',
            phone: result.data.phone || '',
            role: result.data.role || '',
            designation: result.data.designation || '',
            department: result.data.department || '',
            employee_id: result.data.employee_id || '',
            date_of_joining: result.data.date_of_joining || '',
            address: result.data.address || '',
            city: result.data.city || '',
            state: result.data.state || '',
            postal_code: result.data.postal_code || '',
            emergency_contact_name: result.data.emergency_contact_name || '',
            emergency_contact_phone: result.data.emergency_contact_phone || '',
            bio: result.data.bio || '',
            profile_photo_url: result.data.profile_photo_url || '',
            signature_url: result.data.signature_url || ''
          })
        }
      } else if (response.status === 500) {
        // Handle database table missing gracefully
        console.warn('Profile table may not exist, using default empty form')
        ToastService.warning({
          title: 'Profile Setup Required',
          description: 'Profile table needs to be created. Please contact your administrator.'
        })
      } else {
        await ToastService.handleApiError(response, 'load profile data')
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      ToastService.operations.loadFailed('Unable to connect to server')
    } finally {
      setLoading(false)
    }
  }

  const handleFormChange = (field: string, value: any) => {
    setProfileForm(prev => ({ ...prev, [field]: value }))
  }

  const validateFile = (file: File, type: 'profile' | 'signature') => {
    const maxSize = 2 * 1024 * 1024 // 2MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    
    if (file.size > maxSize) {
      return 'File size must be less than 2MB'
    }
    
    if (!allowedTypes.includes(file.type)) {
      return 'Only JPEG, PNG, and WebP images are allowed'
    }
    
    if (type === 'signature') {
      // Additional validation for signature
      if (file.size < 1024) {
        return 'Signature file seems too small, please use a higher quality image'
      }
    }
    
    return null
  }

  const handleFileUpload = (field: 'profile_photo_url' | 'signature_url', file: File) => {
    const fileType = field === 'profile_photo_url' ? 'profile' : 'signature'
    const validationError = validateFile(file, fileType)
    
    if (validationError) {
      ToastService.error(validationError)
      return
    }
    
    setFileUploading(prev => ({ ...prev, [field]: true }))
    
    const reader = new FileReader()
    reader.onload = (event) => {
      handleFormChange(field, event.target?.result as string)
      setFileUploading(prev => ({ ...prev, [field]: false }))
      ToastService.success(`${fileType === 'profile' ? 'Profile photo' : 'Signature'} uploaded successfully`)
    }
    reader.onerror = () => {
      setFileUploading(prev => ({ ...prev, [field]: false }))
      ToastService.error('Failed to read file. Please try again.')
    }
    reader.readAsDataURL(file)
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    // Required field validation
    if (!profileForm.first_name?.trim()) {
      errors.first_name = 'First name is required'
    } else if (profileForm.first_name.length > 50) {
      errors.first_name = 'First name must be less than 50 characters'
    }
    
    if (!profileForm.last_name?.trim()) {
      errors.last_name = 'Last name is required'
    } else if (profileForm.last_name.length > 50) {
      errors.last_name = 'Last name must be less than 50 characters'
    }
    
    // Email validation
    if (!profileForm.email?.trim()) {
      errors.email = 'Email is required'
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(profileForm.email)) {
        errors.email = 'Please enter a valid email address'
      }
    }
    
    // Phone validation
    if (!profileForm.phone?.trim()) {
      errors.phone = 'Phone number is required'
    } else {
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
      const cleanPhone = profileForm.phone.replace(/\s+/g, '')
      if (!phoneRegex.test(cleanPhone)) {
        errors.phone = 'Please enter a valid phone number'
      }
    }
    
    // Role validation
    if (!profileForm.role) {
      errors.role = 'Role is required'
    }
    
    // Date validation
    if (profileForm.date_of_joining) {
      const joiningDate = new Date(profileForm.date_of_joining)
      const today = new Date()
      if (joiningDate > today) {
        errors.date_of_joining = 'Joining date cannot be in the future'
      }
    }
    
    // Postal code validation
    if (profileForm.postal_code && !/^\d{5,10}$/.test(profileForm.postal_code)) {
      errors.postal_code = 'Please enter a valid postal code'
    }
    
    // Bio character limit
    if (profileForm.bio && profileForm.bio.length > 500) {
      errors.bio = 'Bio must be less than 500 characters'
    }
    
    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSaveProfile = async () => {
    // Clear previous validation errors
    setValidationErrors({})
    
    // Validate franchise ID first
    if (!franchiseId) {
      console.error('[Profile] Cannot save: No franchise ID')
      ToastService.error('Cannot save profile: Missing franchise ID. Please contact support.')
      return
    }
    
    // Validate form
    if (!validateForm()) {
      console.error('[Profile] Validation failed:', validationErrors)
      ToastService.error('Please fix the validation errors before saving')
      return
    }
    
    try {
      setSaving(true)
      const method = profile ? 'PUT' : 'POST'
      const body = profile 
        ? { ...profileForm, id: profile.id, franchise_id: franchiseId }
        : { ...profileForm, franchise_id: franchiseId }

      // Debug logging
      console.log('[Profile] Save attempt:', {
        method,
        franchiseId,
        hasProfile: !!profile,
        profileId: profile?.id,
        formDataKeys: Object.keys(profileForm),
        bodyKeys: Object.keys(body)
      })

      const response = await fetch('/api/settings/profile', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('[Profile] Saved successfully:', result)
        ToastService.operations.settingsSaved()
        fetchProfile()
      } else {
        const errorData = await response.json()
        console.error('[Profile] Save failed:', { status: response.status, error: errorData })
        ToastService.error(`Failed to save profile. ${errorData.error || 'Unknown error'}`)
      }
    } catch (error: any) {
      console.error('[Profile] Error saving:', error)
      ToastService.operations.settingsSaveFailed('Unable to connect to server')
    } finally {
      setSaving(false)
    }
  }

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase()
  }

  const renderFieldError = (fieldName: string) => {
    if (validationErrors[fieldName]) {
      return (
        <div className="flex items-center gap-1 text-red-600 text-sm mt-1">
          <AlertCircle className="h-3 w-3" />
          <span>{validationErrors[fieldName]}</span>
        </div>
      )
    }
    return null
  }

  const getFieldClassName = (fieldName: string, baseClassName: string = '') => {
    return `${baseClassName} ${
      validationErrors[fieldName] 
        ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
    }`
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Photo Section */}
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={profileForm.profile_photo_url} />
                <AvatarFallback className="text-lg bg-blue-100 text-blue-700">
                  {getInitials(profileForm.first_name, profileForm.last_name) || <User className="h-8 w-8" />}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2">
                <Label htmlFor="profile_photo" className="cursor-pointer">
                  <div className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors">
                    <Camera className="h-4 w-4" />
                  </div>
                  <Input
                    id="profile_photo"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload('profile_photo_url', file)
                    }}
                  />
                </Label>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold">
                {profileForm.first_name} {profileForm.last_name}
              </h3>
              <p className="text-gray-600">{profileForm.designation}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">{profileForm.role}</Badge>
                {profileForm.department && (
                  <Badge variant="secondary">{profileForm.department}</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={profileForm.first_name}
                onChange={(e) => handleFormChange('first_name', e.target.value)}
                placeholder="John"
                className={getFieldClassName('first_name')}
                maxLength={50}
              />
              {renderFieldError('first_name')}
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={profileForm.last_name}
                onChange={(e) => handleFormChange('last_name', e.target.value)}
                placeholder="Doe"
                className={getFieldClassName('last_name')}
                maxLength={50}
              />
              {renderFieldError('last_name')}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={profileForm.email}
                  onChange={(e) => handleFormChange('email', e.target.value)}
                  placeholder="john@safawala.com"
                  className={getFieldClassName('email', 'pl-10')}
                />
              </div>
              {renderFieldError('email')}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="phone"
                  value={profileForm.phone}
                  onChange={(e) => handleFormChange('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className={getFieldClassName('phone', 'pl-10')}
                />
              </div>
              {renderFieldError('phone')}
            </div>
          </div>

          {/* Professional Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={profileForm.role} onValueChange={(value) => handleFormChange('role', value)}>
                <SelectTrigger className={getFieldClassName('role')}>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
              {renderFieldError('role')}
            </div>
            <div className="space-y-2">
              <Label htmlFor="designation">Designation</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="designation"
                  value={profileForm.designation}
                  onChange={(e) => handleFormChange('designation', e.target.value)}
                  placeholder="General Manager"
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                value={profileForm.department}
                onChange={(e) => handleFormChange('department', e.target.value)}
                placeholder="Operations"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee_id">Employee ID</Label>
              <Input
                id="employee_id"
                value={profileForm.employee_id}
                onChange={(e) => handleFormChange('employee_id', e.target.value)}
                placeholder="EMP001"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date_of_joining">Date of Joining</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="date_of_joining"
                  type="date"
                  value={profileForm.date_of_joining}
                  onChange={(e) => handleFormChange('date_of_joining', e.target.value)}
                  className={getFieldClassName('date_of_joining', 'pl-10')}
                  max={new Date().toISOString().split('T')[0]} // Prevent future dates
                />
              </div>
              {renderFieldError('date_of_joining')}
            </div>
          </div>

          {/* Address Information */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Address Information
            </h4>
            
            <div className="space-y-2">
              <Label htmlFor="address">Street Address</Label>
              <Textarea
                id="address"
                value={profileForm.address}
                onChange={(e) => handleFormChange('address', e.target.value)}
                placeholder="123 Main Street, Building Name"
                rows={2}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={profileForm.city}
                  onChange={(e) => handleFormChange('city', e.target.value)}
                  placeholder="Mumbai"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={profileForm.state}
                  onChange={(e) => handleFormChange('state', e.target.value)}
                  placeholder="Maharashtra"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="postal_code">Postal Code</Label>
                <Input
                  id="postal_code"
                  value={profileForm.postal_code}
                  onChange={(e) => handleFormChange('postal_code', e.target.value)}
                  placeholder="400001"
                  className={getFieldClassName('postal_code')}
                  maxLength={10}
                />
                {renderFieldError('postal_code')}
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="space-y-4">
            <h4 className="font-medium">Emergency Contact</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_name">Contact Name</Label>
                <Input
                  id="emergency_contact_name"
                  value={profileForm.emergency_contact_name}
                  onChange={(e) => handleFormChange('emergency_contact_name', e.target.value)}
                  placeholder="Emergency contact name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergency_contact_phone">Contact Phone</Label>
                <Input
                  id="emergency_contact_phone"
                  value={profileForm.emergency_contact_phone}
                  onChange={(e) => handleFormChange('emergency_contact_phone', e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label htmlFor="bio">Bio / About</Label>
            <Textarea
              id="bio"
              value={profileForm.bio}
              onChange={(e) => handleFormChange('bio', e.target.value)}
              placeholder="Brief description about yourself..."
              rows={3}
              className={getFieldClassName('bio')}
              maxLength={500}
            />
            <div className="flex justify-between items-center">
              {renderFieldError('bio')}
              <span className="text-xs text-gray-500">
                {profileForm.bio?.length || 0}/500 characters
              </span>
            </div>
          </div>

          {/* Signature Upload */}
          <div className="space-y-4">
            <h4 className="font-medium flex items-center gap-2">
              <FileSignature className="h-4 w-4" />
              Digital Signature
            </h4>
            
            <div className="flex items-center gap-4">
              {profileForm.signature_url ? (
                <div className="relative">
                  <img 
                    src={profileForm.signature_url} 
                    alt="Digital Signature" 
                    className="w-32 h-16 object-contain border rounded bg-white"
                  />
                  <Label htmlFor="signature_upload" className="absolute -top-2 -right-2 cursor-pointer">
                    <div className="bg-blue-600 text-white p-1 rounded-full hover:bg-blue-700 transition-colors">
                      <Edit3 className="h-3 w-3" />
                    </div>
                  </Label>
                </div>
              ) : (
                <Label htmlFor="signature_upload" className="cursor-pointer">
                  <div className="w-32 h-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center hover:border-blue-400 transition-colors">
                    <div className="text-center">
                      <Upload className="h-6 w-6 mx-auto text-gray-400 mb-1" />
                      <p className="text-xs text-gray-500">Upload Signature</p>
                    </div>
                  </div>
                </Label>
              )}
              
              <Input
                id="signature_upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload('signature_url', file)
                }}
              />
              
              <div className="text-sm text-gray-500">
                <p>Upload your digital signature</p>
                <p className="text-xs">Recommended: PNG with transparent background</p>
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveProfile} disabled={saving} className="flex items-center gap-2">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}