import { useMemo, useState } from "react";
import { CalendarDays, Check, Fuel, Gauge, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatCurrency, rentalDays, vehicles, type Vehicle, type VehicleType } from "@/lib/rental-data";

const categories: Array<{ value: "all" | VehicleType; label: string }> = [
  { value: "all", label: "All" }, { value: "suv", label: "SUV" }, { value: "sedan", label: "Sedan" }, { value: "muv", label: "MUV" }, { value: "hatchback", label: "Hatch" },
];

type FleetExplorerProps = { compact?: boolean; initialStart?: string; initialEnd?: string };

export function FleetExplorer({ compact = false, initialStart = "2026-10-01", initialEnd = "2026-10-05" }: FleetExplorerProps) {
  const [category, setCategory] = useState<"all" | VehicleType>("all");
  const [selected, setSelected] = useState<Vehicle | null>(null);
  const [startDate, setStartDate] = useState(initialStart);
  const [endDate, setEndDate] = useState(initialEnd);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const days = rentalDays(startDate, endDate);
  const visible = useMemo(() => vehicles.filter((vehicle) => category === "all" || vehicle.type === category), [category]);

  function confirmBooking(formData: FormData) {
    if (!selected || days === 0) { setError("Please choose a valid return date."); return; }
    const name = String(formData.get("name") ?? "").trim();
    const phone = String(formData.get("phone") ?? "").trim();
    if (name.length < 3 || !/^\d{10}$/.test(phone)) { setError("Enter your full name and a valid 10-digit phone number."); return; }
    const booking = { reference: `VLC-${Math.floor(1000 + Math.random() * 9000)}`, customer: name, phone, vehicle: selected.name, registration: selected.registration, startDate, endDate, status: "Reserved", total: selected.dailyRate * days, paid: 0, paymentStatus: "Pending" };
    sessionStorage.setItem("velocity-demo-booking", JSON.stringify(booking));
    setError(""); setSubmitted(true);
  }

  return (
    <>
      {!compact && (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="eyebrow">(A) Live availability</p><h2 className="mt-2 font-display text-3xl text-ink sm:text-4xl">Browse the fleet</h2><p className="mt-2 text-sm text-muted">Delhi NCR · transparent rates · basic insurance included</p></div>
          <div className="flex flex-wrap gap-2" aria-label="Vehicle category filters">
            {categories.map((item) => <Button key={item.value} variant="outline" onClick={() => setCategory(item.value)} className={category === item.value ? "border-ink bg-ink text-paper hover:bg-ink hover:text-paper" : "border-line bg-transparent text-muted hover:border-brand hover:bg-panel hover:text-ink"}>{item.label}</Button>)}
          </div>
        </div>
      )}
      {compact && <div className="mb-5 flex flex-wrap gap-2">{categories.slice(0, 4).map((item) => <Button key={item.value} size="sm" variant="outline" onClick={() => setCategory(item.value)} className={category === item.value ? "border-ink bg-ink text-paper hover:bg-ink hover:text-paper" : "border-line bg-transparent text-muted hover:border-brand hover:bg-panel hover:text-ink"}>{item.label}</Button>)}</div>}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {visible.map((vehicle) => (
          <article key={vehicle.id} className="lift flex min-w-0 flex-col overflow-hidden rounded-card border border-line bg-panel">
            <div className="relative aspect-[4/3] overflow-hidden bg-paper"><img src={vehicle.image} alt={`${vehicle.name} available for rent`} width={944} height={704} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" /><span className={vehicle.status === "available" ? "status-badge bg-ok/15 text-ok" : "status-badge bg-brand/15 text-brand"}>{vehicle.status === "available" ? "Available" : "Maintenance"}</span></div>
            <div className="flex flex-1 flex-col p-4">
              <div className="flex items-center justify-between gap-2"><span className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted">{vehicle.type}</span><span className="font-mono text-[10px] text-muted">{vehicle.registration}</span></div>
              <h3 className="mt-2 truncate text-base font-semibold text-ink">{vehicle.name}</h3>
              <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-[10px] text-muted"><span className="flex items-center gap-1"><Users className="size-3" />{vehicle.seats} seats</span><span className="flex items-center gap-1"><Fuel className="size-3" />{vehicle.fuel}</span><span>{vehicle.transmission}</span><span className="flex items-center gap-1"><Gauge className="size-3" />{vehicle.odometer.toLocaleString("en-IN")} km</span></div>
              <div className="mt-auto flex items-end justify-between gap-3 pt-5"><p className="text-lg font-semibold text-ink">{formatCurrency(vehicle.dailyRate)}<span className="font-mono text-[10px] font-normal text-muted">/day</span></p><Button disabled={vehicle.status !== "available"} onClick={() => { setSelected(vehicle); setSubmitted(false); setError(""); }} variant="outline" size="sm" className="border-line bg-transparent text-ink hover:border-brand hover:bg-brand hover:text-brand-ink">{vehicle.status === "available" ? "Book" : "Unavailable"}</Button></div>
            </div>
          </article>
        ))}
      </div>
      <Dialog open={selected !== null} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-card border-line bg-panel text-ink sm:max-w-2xl">
          {selected && !submitted && <><DialogHeader><p className="eyebrow">Reserve your ride</p><DialogTitle className="font-display text-3xl">{selected.name}</DialogTitle><DialogDescription className="text-muted">Complete the details below. This frontend demo won’t charge you.</DialogDescription></DialogHeader><div className="grid gap-6 md:grid-cols-[1fr_1.1fr]"><img src={selected.image} alt={selected.name} width={944} height={704} className="aspect-[4/3] w-full rounded-card object-cover" /><form action={confirmBooking} className="space-y-4"><div className="grid grid-cols-2 gap-3"><label className="field-label">Pickup date<Input name="start" type="date" value={startDate} min="2026-09-21" onChange={(event) => setStartDate(event.target.value)} className="field-input" /></label><label className="field-label">Return date<Input name="end" type="date" value={endDate} min={startDate} onChange={(event) => setEndDate(event.target.value)} className="field-input" /></label></div><label className="field-label">Full name<Input name="name" placeholder="Aarav Sharma" className="field-input" /></label><label className="field-label">Phone number<Input name="phone" inputMode="numeric" maxLength={10} placeholder="10-digit mobile number" className="field-input" /></label><label className="field-label">Payment method<select name="payment" className="field-input h-9"><option>UPI at pickup</option><option>Card at pickup</option><option>Cash at pickup</option></select></label><div className="rounded-brand border border-line bg-paper p-3 text-sm"><div className="flex justify-between text-muted"><span>{days || 0} day{days === 1 ? "" : "s"} × {formatCurrency(selected.dailyRate)}</span><span className="text-ink">{formatCurrency(selected.dailyRate * days)}</span></div><div className="mt-2 flex justify-between border-t border-line pt-2 font-semibold"><span>Total</span><span className="text-brand">{formatCurrency(selected.dailyRate * days)}</span></div></div>{error && <p role="alert" className="text-sm text-danger">{error}</p>}<Button type="submit" className="w-full bg-brand text-brand-ink hover:bg-brand/90">Confirm reservation</Button></form></div></>}
          {selected && submitted && <div className="py-8 text-center"><span className="mx-auto grid size-14 place-items-center rounded-full bg-ok/15 text-ok"><Check className="size-7" /></span><p className="eyebrow mt-5">Booking confirmed</p><DialogTitle className="mt-2 font-display text-4xl">YOU’RE READY TO ROLL</DialogTitle><DialogDescription className="mx-auto mt-3 max-w-md text-muted">Your {selected.name} is reserved. Open My Bookings to view your latest demo reservation.</DialogDescription><div className="mx-auto mt-6 grid max-w-sm grid-cols-2 gap-3 text-left"><div className="rounded-brand border border-line bg-paper p-3"><CalendarDays className="mb-2 size-4 text-brand" /><p className="text-xs text-muted">Rental period</p><p className="mt-1 text-sm">{startDate} → {endDate}</p></div><div className="rounded-brand border border-line bg-paper p-3"><MapPin className="mb-2 size-4 text-brand" /><p className="text-xs text-muted">Pickup hub</p><p className="mt-1 text-sm">Connaught Place</p></div></div><Button onClick={() => setSelected(null)} className="mt-6 bg-brand text-brand-ink hover:bg-brand/90">Done</Button></div>}
        </DialogContent>
      </Dialog>
    </>
  );
}
