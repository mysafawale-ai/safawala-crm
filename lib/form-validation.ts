export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export const validatePhone = (phone: string): boolean => {
  // Support Indian phone numbers with or without country code
  const phoneRegex = /^(\+91|91)?[6-9]\d{9}$/
  return phoneRegex.test(phone.replace(/\s+/g, ""))
}

export const validatePincode = (pincode: string): boolean => {
  return /^\d{6}$/.test(pincode)
}

export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0
}

export const getValidationError = (
  field: string,
  value: string,
  type: "required" | "email" | "phone" | "pincode",
): string | null => {
  switch (type) {
    case "required":
      return validateRequired(value) ? null : `${field} is required`
    case "email":
      return validateEmail(value) ? null : "Please enter a valid email address"
    case "phone":
      return validatePhone(value) ? null : "Please enter a valid phone number"
    case "pincode":
      return validatePincode(value) ? null : "Please enter a valid 6-digit pincode"
    default:
      return null
  }
}
