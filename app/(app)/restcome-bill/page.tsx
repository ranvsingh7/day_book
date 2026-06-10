"use client";

import { useMemo, useState } from "react";
import type { FormEvent } from "react";

import { Button } from "@/components/button";
import { InputField } from "@/components/input-field";
import { formatCurrency, formatDate } from "@/lib/format";

type BillForm = {
  customerName: string;
  customerMobile: string;
  checkInDate: string;
  checkOutDate: string;
  amount: string;
  roomNumber: string;
};

const EMPTY_FORM: BillForm = {
  customerName: "",
  customerMobile: "",
  checkInDate: "",
  checkOutDate: "",
  amount: "",
  roomNumber: "",
};

export default function RestcomeBillPage() {
  const [form, setForm] = useState<BillForm>(EMPTY_FORM);
  const [generated, setGenerated] = useState(false);
  const [billMeta, setBillMeta] = useState<{ number: string; date: string } | null>(null);

  const amountValue = Number.parseFloat(form.amount);
  const hasValidAmount = Number.isFinite(amountValue) && amountValue > 0;
  const isComplete =
    form.customerName &&
    form.customerMobile &&
    form.checkInDate &&
    form.checkOutDate &&
    form.roomNumber &&
    hasValidAmount;

  const stayNights = useMemo(() => {
    if (!form.checkInDate || !form.checkOutDate) {
      return "";
    }

    const checkIn = new Date(form.checkInDate);
    const checkOut = new Date(form.checkOutDate);

    if (Number.isNaN(checkIn.getTime()) || Number.isNaN(checkOut.getTime())) {
      return "";
    }

    const diffDays = Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );

    return diffDays > 0 ? String(diffDays) : "";
  }, [form.checkInDate, form.checkOutDate]);

  const onChangeField = (field: keyof BillForm) => (value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const now = new Date();
    const billNumber = `REST-${now.toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;
    setBillMeta({ number: billNumber, date: now.toISOString() });
    setGenerated(true);
  };

  const onReset = () => {
    setForm(EMPTY_FORM);
    setGenerated(false);
    setBillMeta(null);
  };

  const onPrint = () => {
    window.print();
  };

  return (
    <main className="space-y-4">
      <header className="print-hide">
        <h1 className="text-2xl font-semibold">Restcome Hotel Bill</h1>
        <p className="text-sm text-slate-500">
          Generate a clean bill with customer and stay details.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] print-hide">
        <form onSubmit={onSubmit} className="card-soft space-y-4 rounded-2xl p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label="Customer name"
              value={form.customerName}
              onChange={onChangeField("customerName")}
              placeholder="Customer name"
              containerClassName="sm:col-span-2"
              required
            />
            <InputField
              label="Customer mobile"
              value={form.customerMobile}
              onChange={onChangeField("customerMobile")}
              type="tel"
              placeholder="Mobile number"
              containerClassName="sm:col-span-2"
              required
            />
            <InputField
              label="Check-in date"
              value={form.checkInDate}
              onChange={onChangeField("checkInDate")}
              type="date"
              required
            />
            <InputField
              label="Check-out date"
              value={form.checkOutDate}
              onChange={onChangeField("checkOutDate")}
              type="date"
              required
            />
            <InputField
              label="Room number"
              value={form.roomNumber}
              onChange={onChangeField("roomNumber")}
              placeholder="Room number"
              required
            />
            <InputField
              label="Amount"
              value={form.amount}
              onChange={onChangeField("amount")}
              type="number"
              placeholder="0.00"
              min="0"
              step="0.01"
              required
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={!isComplete}>
              Generate bill
            </Button>
            <Button type="button" variant="outline" onClick={onReset}>
              Clear form
            </Button>
          </div>
        </form>

        <aside className="card-soft space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Hotel Details
            </p>
            <h2 className="text-lg font-semibold text-slate-900">Restcome Hotel</h2>
          </div>
          <div className="space-y-1 text-sm text-slate-600">
            <p>KH. 798, Ambika complex</p>
            <p>Near Fire Station, Sec. 5</p>
            <p>Noida, Uttar Pradesh 201301</p>
            <p>Mobile: 8090103051</p>
          </div>
          <p className="text-xs text-slate-500">
            Use the form to generate a bill preview ready for printing or sharing.
          </p>
        </aside>
      </section>

      <section className="card-soft rounded-2xl border border-slate-200 bg-white p-5 print-area">
        <div className="flex flex-wrap items-center justify-between gap-3 print-hide">
          <h2 className="text-lg font-semibold text-slate-900">Bill Preview</h2>
          <Button type="button" variant="outline" onClick={onPrint} disabled={!generated}>
            Print / PDF
          </Button>
        </div>
        {generated ? (
          <div className="mt-4 space-y-6 text-sm text-slate-700">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                  Hotel Bill
                </p>
                <p className="text-xl font-semibold text-slate-900">Restcome Hotel</p>
                <p className="mt-2 text-sm text-slate-600">KH. 798, Ambika complex</p>
                <p className="text-sm text-slate-600">Near Fire Station, Sec. 5</p>
                <p className="text-sm text-slate-600">Noida, Uttar Pradesh 201301</p>
                <p className="text-sm text-slate-600">Mobile: 8090103051</p>
              </div>
              <div className="min-w-[200px] text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Bill No</p>
                <p className="text-base font-semibold text-slate-900">
                  {billMeta?.number ?? "-"}
                </p>
                <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                  Bill Date
                </p>
                <p className="text-base font-semibold text-slate-900">
                  {billMeta?.date ? formatDate(billMeta.date) : "-"}
                </p>
              </div>
            </div>

            <div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:grid-cols-2">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Guest Name</p>
                <p className="text-base font-semibold text-slate-900">{form.customerName}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Room</p>
                <p className="text-base font-semibold text-slate-900">{form.roomNumber}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Mobile</p>
                <p className="text-base font-semibold text-slate-900">{form.customerMobile}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Check-in</p>
                <p className="text-base font-semibold text-slate-900">
                  {formatDate(form.checkInDate)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Check-out</p>
                <p className="text-base font-semibold text-slate-900">
                  {formatDate(form.checkOutDate)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Stay</p>
                <p className="text-base font-semibold text-slate-900">
                  {stayNights ? `${stayNights} night(s)` : "-"}
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-slate-200">
              <div className="grid grid-cols-[2fr_1fr] gap-4 bg-slate-100 px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                <span>Description</span>
                <span className="text-right">Amount</span>
              </div>
              <div className="grid grid-cols-[2fr_1fr] gap-4 px-4 py-4 text-sm">
                <div>
                  <p className="font-semibold text-slate-900">Accommodation Charges</p>
                  <p className="text-xs text-slate-500">
                    Room {form.roomNumber} • {stayNights ? `${stayNights} night(s)` : "-"}
                  </p>
                </div>
                <p className="text-right font-semibold text-slate-900">
                  {formatCurrency(amountValue)}
                </p>
              </div>
              <div className="grid grid-cols-[2fr_1fr] gap-4 border-t border-slate-200 bg-slate-50 px-4 py-3 text-sm">
                <span className="font-semibold text-slate-700">Total</span>
                <span className="text-right font-semibold text-slate-900">
                  {formatCurrency(amountValue)}
                </span>
              </div>
            </div>

            <div className="flex items-end justify-between gap-6 text-sm text-slate-600">
              <p>Thank you for staying with us.</p>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">
                  Authorized Signature
                </p>
                <div className="mt-6 h-px w-40 bg-slate-300" />
              </div>
            </div>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">
            Fill in the form and click Generate bill to see the preview here.
          </p>
        )}
      </section>
    </main>
  );
}
