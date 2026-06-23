import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function POST(request: Request, { params }: { params: { userId: string } }) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { userId } = params
    const body = await request.json()
    const { amount, title, type } = body // type = 'credit' | 'debit'

    if (!userId || !amount || !title || !type) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Get current user session for created_by
    const { data: { session } } = await supabase.auth.getSession()

    // 1. Get or Create the ledger
    let { data: ledger, error: ledgerError } = await supabase
      .from("staff_ledgers")
      .select("*")
      .eq("user_id", userId)
      .single()

    if (ledgerError && ledgerError.code !== "PGRST116") {
      throw ledgerError
    }

    if (!ledger) {
      // Create new ledger
      const { data: newLedger, error: createError } = await supabase
        .from("staff_ledgers")
        .insert({
          user_id: userId,
          base_salary: 0,
          utilized_credit: 0,
          credit_limit: 25000
        })
        .select()
        .single()
      
      if (createError) throw createError
      ledger = newLedger
    }

    // 2. Calculate new utilized credit
    let newUtilizedCredit = ledger.utilized_credit
    const amt = parseFloat(amount)

    if (type === "debit") {
      // Giving advance -> Utilizing credit
      newUtilizedCredit += amt
      
      if (newUtilizedCredit > ledger.credit_limit) {
        return NextResponse.json({ success: false, error: `Limit Exceeded. Available: ₹${ledger.credit_limit - ledger.utilized_credit}` }, { status: 400 })
      }
    } else if (type === "credit") {
      // Payout / Repayment -> Freeing up credit
      newUtilizedCredit = Math.max(0, newUtilizedCredit - amt)
    }

    // 3. Update the ledger
    const { error: updateError } = await supabase
      .from("staff_ledgers")
      .update({ utilized_credit: newUtilizedCredit })
      .eq("id", ledger.id)

    if (updateError) throw updateError

    // 4. Insert transaction
    const { data: transaction, error: txError } = await supabase
      .from("staff_ledger_transactions")
      .insert({
        ledger_id: ledger.id,
        title: title,
        amount: amt,
        type: type,
        created_by: session?.user?.id || null
      })
      .select()
      .single()

    if (txError) throw txError

    return NextResponse.json({ success: true, data: transaction, newUtilizedCredit })
  } catch (error: any) {
    console.error(`Error adding transaction for user ${params.userId}:`, error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
