"use client"

import { useState, useEffect } from "react"
import { PortalPageHeader, PortalSectionLabel } from "@/components/portal/portal-shared"
import { PortalIcon } from "@/components/portal/portal-icons"

const COLOR = "#6366f1"

const LETTER_TYPES = [
  { key: "offer",       label: "Offer Letter",        icon: "handshake",   color: "#22c55e" },
  { key: "joining",     label: "Joining Letter",       icon: "award",       color: "#3b82f6" },
  { key: "experience",  label: "Experience Letter",    icon: "star",        color: "#8b5cf6" },
  { key: "salary",      label: "Salary Increment",     icon: "trending-up", color: "#f97316" },
  { key: "warning",     label: "Warning Letter",       icon: "alert-triangle", color: "#ef4444" },
  { key: "termination", label: "Termination Letter",   icon: "ban",         color: "#dc2626" },
  { key: "noc",         label: "No Objection (NOC)",   icon: "file-check",  color: "#14b8a6" },
  { key: "appointment", label: "Appointment Letter",   icon: "clipboard",   color: "#eab308" },
  { key: "relieving",   label: "Relieving Letter",     icon: "log-out",     color: "#94a3b8" },
]

function getTemplate(type: string, data: any): string {
  const today = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
  const franchise = data.franchise || "Safawala"

  const base = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>${type.toUpperCase()} LETTER</title>
<style>
  body { font-family: Arial, sans-serif; max-width: 700px; margin: 40px auto; color: #1e293b; font-size: 14px; line-height: 1.7; padding: 0 20px; }
  .letterhead { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; border-bottom: 3px solid ${COLOR}; padding-bottom: 16px; }
  .brand { color: ${COLOR}; font-size: 22px; font-weight: 900; }
  .brand-sub { font-size: 11px; color: #94a3b8; margin-top: 2px; }
  .ref { text-align: right; font-size: 11px; color: #94a3b8; }
  .title { font-size: 16px; font-weight: 900; text-transform: uppercase; text-decoration: underline; text-align: center; margin: 24px 0; letter-spacing: 1px; color: ${COLOR}; }
  .section { margin: 16px 0; }
  .field { background: #f8fafc; border-left: 3px solid ${COLOR}; padding: 10px 14px; margin: 12px 0; border-radius: 0 8px 8px 0; font-weight: 600; }
  .footer { margin-top: 48px; }
  .sig-line { margin-top: 48px; border-top: 1px solid #e2e8f0; padding-top: 8px; width: 200px; }
  .sig-label { font-size: 11px; color: #94a3b8; }
  .print-btn { display: block; margin: 30px auto; padding: 12px 40px; background: ${COLOR}; color: white; border: none; border-radius: 8px; font-size: 14px; font-weight: 700; cursor: pointer; }
  @media print { .print-btn { display: none; } body { margin: 0; } }
</style>
</head>
<body>
<div class="letterhead">
  <div>
    <div class="brand">${franchise}</div>
    <div class="brand-sub">Fashion Rental & Styling</div>
  </div>
  <div class="ref">
    <div>Date: ${today}</div>
    <div>Ref: ${franchise.toUpperCase().replace(/\s/g,"-")}-${Date.now().toString().slice(-6)}</div>
  </div>
</div>`

  const footer = `
<div class="footer">
  <p>Yours Sincerely,</p>
  <div class="sig-line"></div>
  <p style="margin:0;font-weight:700">${data.signatory || "HR Manager"}</p>
  <p class="sig-label">${franchise} — Human Resources</p>
</div>
<button class="print-btn" onclick="window.print()">Print / Download PDF</button>
</body></html>`

  const templates: Record<string, string> = {
    offer: `${base}
<div class="title">Offer Letter</div>
<p>Dear <strong>${data.name || "Candidate Name"}</strong>,</p>
<p>We are pleased to offer you the position of <strong>${data.position || "Staff Member"}</strong> in the <strong>${data.department || ""}</strong> department at <strong>${franchise}</strong>.</p>
<div class="section">
  <p><strong>Terms & Conditions:</strong></p>
  <div class="field">📅 Date of Joining: ${data.joining_date || "To be confirmed"}</div>
  <div class="field">💰 Gross Salary: ₹${data.salary || "—"} per month</div>
  <div class="field">🕐 Probation Period: ${data.probation || "3 months"}</div>
  <div class="field">📍 Location: ${data.location || "As assigned"}</div>
</div>
<p>Please confirm your acceptance of this offer by signing and returning a copy of this letter. This offer is subject to satisfactory verification of your documents.</p>
<p>We look forward to welcoming you to the Safawala family.</p>
${footer}`,

    joining: `${base}
<div class="title">Joining Letter</div>
<p>Dear <strong>${data.name || "Employee Name"}</strong>,</p>
<p>We are delighted to confirm that you have joined <strong>${franchise}</strong> as <strong>${data.position || "Staff Member"}</strong> in the <strong>${data.department || ""}</strong> department, effective <strong>${data.joining_date || today}</strong>.</p>
<div class="section">
  <div class="field">🆔 Employee ID: ${data.employee_id || "EMP-" + Date.now().toString().slice(-4)}</div>
  <div class="field">💰 Monthly Salary: ₹${data.salary || "—"}</div>
  <div class="field">📍 Reporting To: ${data.reporting_to || "Branch Manager"}</div>
  <div class="field">🕐 Working Hours: ${data.working_hours || "10:00 AM – 7:00 PM, Mon–Sat"}</div>
</div>
<p>Please carry this letter as proof of employment. We wish you a successful and rewarding journey with us.</p>
${footer}`,

    experience: `${base}
<div class="title">Experience Letter</div>
<p>To Whom It May Concern,</p>
<p>This is to certify that <strong>${data.name || "Employee Name"}</strong> was employed with <strong>${franchise}</strong> as <strong>${data.position || "Staff Member"}</strong> in the <strong>${data.department || ""}</strong> department from <strong>${data.from_date || "—"}</strong> to <strong>${data.to_date || today}</strong>.</p>
<p>During this tenure, ${data.gender === "female" ? "she" : "he"} demonstrated <strong>${data.performance || "satisfactory performance and professional conduct"}</strong>. We found ${data.gender === "female" ? "her" : "him"} to be a reliable, hardworking and dedicated team member.</p>
<p>We wish ${data.gender === "female" ? "her" : "him"} all the best in future endeavours.</p>
${footer}`,

    salary: `${base}
<div class="title">Salary Increment Letter</div>
<p>Dear <strong>${data.name || "Employee Name"}</strong>,</p>
<p>We are pleased to inform you that in recognition of your performance and contribution to <strong>${franchise}</strong>, your salary has been revised effective <strong>${data.effective_date || today}</strong>.</p>
<div class="section">
  <div class="field">💰 Previous Salary: ₹${data.old_salary || "—"} per month</div>
  <div class="field">💰 Revised Salary: ₹${data.new_salary || "—"} per month</div>
  <div class="field">📈 Increment: ₹${data.increment || "—"} (${data.percent || "—"}%)</div>
</div>
<p>Your revised salary will be reflected in your next payslip. We appreciate your dedication and look forward to your continued contribution.</p>
${footer}`,

    warning: `${base}
<div class="title">Warning Letter</div>
<p>Dear <strong>${data.name || "Employee Name"}</strong>,</p>
<p>This letter serves as a formal warning regarding <strong>${data.reason || "conduct/performance issues"}</strong> observed on <strong>${data.incident_date || today}</strong>.</p>
<div class="section">
  <p><strong>Details of Incident:</strong></p>
  <p>${data.details || "Please describe the specific incident or behaviour that led to this warning."}</p>
</div>
<p>You are advised to <strong>${data.improvement || "immediately improve your conduct and performance"}</strong>. Failure to comply may result in further disciplinary action including termination of employment.</p>
<p>Please acknowledge receipt of this letter by signing below.</p>
<div style="margin-top:32px;display:flex;gap:60px">
  <div><div class="sig-line"></div><p class="sig-label">HR Manager Signature</p></div>
  <div><div class="sig-line"></div><p class="sig-label">Employee Acknowledgement</p></div>
</div>
${footer}`,

    termination: `${base}
<div class="title">Termination Letter</div>
<p>Dear <strong>${data.name || "Employee Name"}</strong>,</p>
<p>After careful consideration, <strong>${franchise}</strong> has decided to terminate your employment effective <strong>${data.effective_date || today}</strong>.</p>
<div class="section">
  <div class="field">📅 Last Working Day: ${data.last_day || today}</div>
  <div class="field">💰 Full & Final Settlement: ${data.settlement_date || "To be processed within 30 days"}</div>
</div>
<p><strong>Reason:</strong> ${data.reason || "As discussed in prior meetings."}</p>
<p>Please return all company property including uniform, tools, and access cards on or before your last working day. All dues will be settled as per company policy.</p>
${footer}`,

    noc: `${base}
<div class="title">No Objection Certificate</div>
<p>To Whom It May Concern,</p>
<p>This is to certify that <strong>${data.name || "Employee Name"}</strong>, employed as <strong>${data.position || "Staff Member"}</strong> at <strong>${franchise}</strong>, has applied for a <strong>${data.purpose || "visa / loan / passport verification"}</strong>.</p>
<p>We have <strong>no objection</strong> to ${data.gender === "female" ? "her" : "him"} applying for the same. ${data.name || "The employee"} is currently employed with us on a full-time basis.</p>
<div class="section">
  <div class="field">🆔 Employee ID: ${data.employee_id || "—"}</div>
  <div class="field">📅 Date of Joining: ${data.joining_date || "—"}</div>
  <div class="field">💰 Monthly Salary: ₹${data.salary || "—"}</div>
</div>
<p>This certificate is issued on request and without any liability to our organization.</p>
${footer}`,

    appointment: `${base}
<div class="title">Appointment Letter</div>
<p>Dear <strong>${data.name || "Candidate Name"}</strong>,</p>
<p>With reference to your application and subsequent interview, we are pleased to appoint you as <strong>${data.position || "Staff Member"}</strong> in the <strong>${data.department || ""}</strong> department at <strong>${franchise}</strong>.</p>
<div class="section">
  <div class="field">📅 Date of Appointment: ${data.joining_date || today}</div>
  <div class="field">💰 CTC: ₹${data.salary || "—"} per month</div>
  <div class="field">🕐 Probation: ${data.probation || "3 months"}</div>
  <div class="field">📍 Work Location: ${data.location || "As assigned"}</div>
  <div class="field">📋 Leave Entitlement: ${data.leaves || "12 casual + 12 earned leaves per year"}</div>
</div>
<p>You are required to report to duty on the date of appointment with all original documents for verification. Please sign the duplicate copy of this letter as a token of acceptance.</p>
${footer}`,

    relieving: `${base}
<div class="title">Relieving Letter</div>
<p>To Whom It May Concern,</p>
<p>This is to certify that <strong>${data.name || "Employee Name"}</strong> has been relieved from the services of <strong>${franchise}</strong> with effect from <strong>${data.to_date || today}</strong>.</p>
<p>${data.name || "The employee"} served as <strong>${data.position || "Staff Member"}</strong> in the <strong>${data.department || ""}</strong> department from <strong>${data.from_date || "—"}</strong> to <strong>${data.to_date || today}</strong>.</p>
<p>All dues have been settled and ${data.gender === "female" ? "she" : "he"} is free to join any other organization. We wish ${data.gender === "female" ? "her" : "him"} all the best for future endeavours.</p>
${footer}`,
  }

  return templates[type] ?? base + `<p>Letter content</p>${footer}`
}

const FIELD_SETS: Record<string, { key: string; label: string; type?: string; required?: boolean }[]> = {
  offer:       [{ key: "name", label: "Candidate Name", required: true }, { key: "position", label: "Position" }, { key: "department", label: "Department" }, { key: "joining_date", label: "Date of Joining", type: "date" }, { key: "salary", label: "Salary (₹/month)" }, { key: "probation", label: "Probation Period" }],
  joining:     [{ key: "name", label: "Employee Name", required: true }, { key: "position", label: "Position" }, { key: "department", label: "Department" }, { key: "joining_date", label: "Date of Joining", type: "date" }, { key: "salary", label: "Salary" }, { key: "employee_id", label: "Employee ID" }, { key: "reporting_to", label: "Reporting To" }],
  experience:  [{ key: "name", label: "Employee Name", required: true }, { key: "position", label: "Designation" }, { key: "department", label: "Department" }, { key: "from_date", label: "From Date", type: "date" }, { key: "to_date", label: "To Date", type: "date" }, { key: "performance", label: "Performance Note" }, { key: "gender", label: "Gender (male/female)" }],
  salary:      [{ key: "name", label: "Employee Name", required: true }, { key: "old_salary", label: "Previous Salary (₹)" }, { key: "new_salary", label: "Revised Salary (₹)" }, { key: "increment", label: "Increment Amount (₹)" }, { key: "percent", label: "Increment %" }, { key: "effective_date", label: "Effective Date", type: "date" }],
  warning:     [{ key: "name", label: "Employee Name", required: true }, { key: "reason", label: "Reason" }, { key: "incident_date", label: "Incident Date", type: "date" }, { key: "details", label: "Details of Incident" }, { key: "improvement", label: "Expected Improvement" }],
  termination: [{ key: "name", label: "Employee Name", required: true }, { key: "effective_date", label: "Effective Date", type: "date" }, { key: "last_day", label: "Last Working Day", type: "date" }, { key: "reason", label: "Reason" }],
  noc:         [{ key: "name", label: "Employee Name", required: true }, { key: "position", label: "Designation" }, { key: "purpose", label: "Purpose (visa/loan/etc)" }, { key: "employee_id", label: "Employee ID" }, { key: "joining_date", label: "Date of Joining", type: "date" }, { key: "salary", label: "Monthly Salary (₹)" }, { key: "gender", label: "Gender (male/female)" }],
  appointment: [{ key: "name", label: "Candidate Name", required: true }, { key: "position", label: "Position" }, { key: "department", label: "Department" }, { key: "joining_date", label: "Date of Appointment", type: "date" }, { key: "salary", label: "CTC (₹/month)" }, { key: "probation", label: "Probation Period" }],
  relieving:   [{ key: "name", label: "Employee Name", required: true }, { key: "position", label: "Designation" }, { key: "department", label: "Department" }, { key: "from_date", label: "From Date", type: "date" }, { key: "to_date", label: "Last Working Day", type: "date" }, { key: "gender", label: "Gender (male/female)" }],
}

export default function LettersPage() {
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [fields, setFields] = useState<Record<string, string>>({})
  const [staffList, setStaffList] = useState<any[]>([])
  const [franchise, setFranchise] = useState("Safawala")

  useEffect(() => {
    fetch("/api/users?limit=100").then(r => r.json()).then(d => setStaffList(d.data ?? []))
    const raw = localStorage.getItem("safawala_user")
    if (raw) {
      try {
        const u = JSON.parse(raw)
        if (u.franchise_name) setFranchise(u.franchise_name)
      } catch {}
    }
  }, [])

  function prefillFromStaff(staffId: string) {
    const s = staffList.find(s => s.id === staffId)
    if (!s) return
    setFields(prev => ({
      ...prev,
      name: s.name ?? prev.name,
      position: s.role ?? prev.position,
      department: s.department ?? prev.department,
      salary: s.base_salary ? String(s.base_salary) : prev.salary,
    }))
  }

  function generate() {
    if (!selectedType) return
    const html = getTemplate(selectedType, { ...fields, franchise })
    const win = window.open("", "_blank")
    if (win) { win.document.write(html); win.document.close() }
  }

  const fieldSet = selectedType ? (FIELD_SETS[selectedType] ?? []) : []
  const selectedMeta = LETTER_TYPES.find(l => l.key === selectedType)

  return (
    <div style={{ fontFamily: "'Inter','Segoe UI',sans-serif", paddingBottom: 40 }}>
      <PortalPageHeader title="HR Letters" subtitle="Generate & print professional letters" color={COLOR} backHref="/portal/hr" />

      {/* Letter type grid */}
      {!selectedType && (
        <>
          <PortalSectionLabel label="Select Letter Type" />
          <div style={{ padding: "0 16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {LETTER_TYPES.map(l => (
              <button key={l.key} onClick={() => { setSelectedType(l.key); setFields({}) }}
                style={{ padding: "16px 12px", borderRadius: 18, border: `2px solid ${l.color}20`, background: `${l.color}10`, cursor: "pointer", fontFamily: "inherit", textAlign: "center", color: l.color }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
                  <PortalIcon name={l.icon} size={26} />
                </div>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: l.color }}>{l.label}</p>
              </button>
            ))}
          </div>
        </>
      )}

      {/* Letter form */}
      {selectedType && selectedMeta && (
        <div style={{ padding: "0 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, padding: "12px 0" }}>
            <button onClick={() => setSelectedType(null)} style={{ width: 36, height: 36, borderRadius: 12, border: "1px solid #e2e8f0", background: "white", cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>
              ←
            </button>
            <div>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: "#1e1208", display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: selectedMeta.color }}><PortalIcon name={selectedMeta.icon} size={18} /></span>
              {selectedMeta.label}
            </p>
              <p style={{ margin: 0, fontSize: 10, color: "rgba(80,55,30,0.45)", fontWeight: 500 }}>Fill details below to generate</p>
            </div>
          </div>

          {/* Prefill from staff */}
          {staffList.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "rgba(80,55,30,0.5)", display: "block", marginBottom: 4 }}>Quick Fill from Staff</label>
              <select onChange={e => prefillFromStaff(e.target.value)} style={{ width: "100%", height: 44, borderRadius: 12, border: "1.5px solid #e2e8f0", padding: "0 14px", fontSize: 13, fontFamily: "inherit", outline: "none", background: "white" }}>
                <option value="">Select existing staff to prefill…</option>
                {staffList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.department})</option>)}
              </select>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {fieldSet.map(f => (
              <div key={f.key}>
                <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "rgba(80,55,30,0.5)", display: "block", marginBottom: 4 }}>{f.label}{f.required ? " *" : ""}</label>
                <input type={f.type ?? "text"} value={fields[f.key] ?? ""} onChange={e => setFields(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: "100%", height: 44, borderRadius: 12, border: `1.5px solid ${f.required && !fields[f.key] ? "#fca5a5" : "#e2e8f0"}`, padding: "0 14px", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
              </div>
            ))}

            <div>
              <label style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5, color: "rgba(80,55,30,0.5)", display: "block", marginBottom: 4 }}>Signatory Name</label>
              <input type="text" value={fields.signatory ?? ""} onChange={e => setFields(p => ({ ...p, signatory: e.target.value }))} placeholder="HR Manager / Branch Manager"
                style={{ width: "100%", height: 44, borderRadius: 12, border: "1.5px solid #e2e8f0", padding: "0 14px", fontSize: 13, fontFamily: "inherit", outline: "none", boxSizing: "border-box" }} />
            </div>

            <button onClick={generate}
              style={{ width: "100%", height: 52, borderRadius: 16, border: "none", background: selectedMeta.color, color: "white", fontSize: 15, fontWeight: 800, cursor: "pointer", fontFamily: "inherit", marginTop: 8, letterSpacing: 0.3, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              <PortalIcon name="printer" size={18} />
              Generate {selectedMeta.label}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
