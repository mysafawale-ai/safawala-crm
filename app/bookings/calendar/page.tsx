import { BookingCalendar } from "@/components/bookings/booking-calendar"

// This page relies on client-side Supabase and should not be statically prerendered
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function BookingCalendarPage() {
  return (
    <div className="container mx-auto p-6">
      <BookingCalendar />
    </div>
  )
}
