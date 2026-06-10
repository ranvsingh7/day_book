"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/button";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { InputField } from "@/components/input-field";
import { SelectField } from "@/components/select-field";
import type { ElectricityMeter, ElectricityReading } from "@/types/daybook";

type MeterFormState = {
  name: string;
  meterNumber: string;
  customerName: string;
  startReading: string;
  startDate: string;
};

type ReadingFormState = {
  meterId: string;
  readingMonth: string;
  reading: string;
};

function getLocalDateInputValue(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function getLocalMonthInputValue(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 7);
}

const defaultMeterState = (): MeterFormState => ({
  name: "",
  meterNumber: "",
  customerName: "",
  startReading: "",
  startDate: getLocalDateInputValue(),
});

const defaultReadingState = (meterId = ""): ReadingFormState => ({
  meterId,
  readingMonth: getLocalMonthInputValue(),
  reading: "",
});

export default function ElectricityBillPage() {
  const [meters, setMeters] = useState<ElectricityMeter[]>([]);
  const [readings, setReadings] = useState<ElectricityReading[]>([]);
  const [loadingMeters, setLoadingMeters] = useState(false);
  const [loadingReadings, setLoadingReadings] = useState(false);
  const [savingMeter, setSavingMeter] = useState(false);
  const [savingReading, setSavingReading] = useState(false);
  const [meterModalOpen, setMeterModalOpen] = useState(false);
  const [editMeterId, setEditMeterId] = useState<string | null>(null);
  const [editingReadingId, setEditingReadingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<
    | { type: "meter"; id: string; label: string }
    | { type: "reading"; id: string; meterId: string }
    | null
  >(null);
  const [deletePending, setDeletePending] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loadingRole, setLoadingRole] = useState(true);
  const [meterForm, setMeterForm] = useState<MeterFormState>(defaultMeterState);
  const [readingForm, setReadingForm] = useState<ReadingFormState>(() =>
    defaultReadingState("")
  );

  const selectedMeter = useMemo(
    () => meters.find((meter) => meter._id === readingForm.meterId) ?? null,
    [meters, readingForm.meterId]
  );

  const loadRole = async () => {
    setLoadingRole(true);
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      if (!response.ok) {
        setIsAdmin(false);
        return;
      }

      const payload = (await response.json()) as { user: { role: "admin" | "user" } };
      setIsAdmin(payload.user.role === "admin");
    } finally {
      setLoadingRole(false);
    }
  };

  const loadMeters = async () => {
    setLoadingMeters(true);
    try {
      const response = await fetch("/api/electricity-meters", { cache: "no-store" });
      if (!response.ok) {
        setMeters([]);
        return;
      }

      const payload = (await response.json()) as { meters: ElectricityMeter[] };
      setMeters(payload.meters);
      if (!readingForm.meterId && payload.meters.length > 0) {
        setReadingForm((current) => ({ ...current, meterId: payload.meters[0]._id }));
      }
    } finally {
      setLoadingMeters(false);
    }
  };

  const loadReadings = async (meterId: string) => {
    if (!meterId) {
      setReadings([]);
      return;
    }

    setLoadingReadings(true);
    try {
      const response = await fetch(`/api/electricity-meters/${meterId}/readings`, {
        cache: "no-store",
      });
      if (!response.ok) {
        setReadings([]);
        return;
      }

      const payload = (await response.json()) as { readings: ElectricityReading[] };
      setReadings(payload.readings);
    } finally {
      setLoadingReadings(false);
    }
  };

  useEffect(() => {
    void loadMeters();
    void loadRole();
  }, []);

  useEffect(() => {
    void loadReadings(readingForm.meterId);
  }, [readingForm.meterId]);

  const handleCreateMeter = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!meterForm.name.trim()) {
      toast.error("Meter name is required");
      return;
    }

    if (!meterForm.meterNumber.trim()) {
      toast.error("Meter number is required");
      return;
    }

    if (!meterForm.customerName.trim()) {
      toast.error("Customer name is required");
      return;
    }

    const startReading = Number(meterForm.startReading);
    if (!Number.isFinite(startReading) || startReading < 0) {
      toast.error("Start reading must be 0 or higher");
      return;
    }

    setSavingMeter(true);
    try {
      const endpoint = editMeterId
        ? `/api/electricity-meters/${editMeterId}`
        : "/api/electricity-meters";
      const response = await fetch(endpoint, {
        method: editMeterId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: meterForm.name,
          meterNumber: meterForm.meterNumber,
          customerName: meterForm.customerName,
          startReading,
          startDate: meterForm.startDate,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { meter?: ElectricityMeter; error?: string }
        | null;

      if (!response.ok) {
        toast.error(payload?.error ?? "Unable to create meter");
        return;
      }

      toast.success(editMeterId ? "Meter updated" : "Meter created");
      setMeterForm(defaultMeterState());
      setMeterModalOpen(false);
      setEditMeterId(null);
      await loadMeters();
      if (payload?.meter?._id) {
        setReadingForm((current) => ({
          ...current,
          meterId: payload.meter?._id ?? current.meterId,
        }));
      }
    } finally {
      setSavingMeter(false);
    }
  };

  const handleAddReading = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!readingForm.meterId) {
      toast.error("Select a meter");
      return;
    }

    if (!readingForm.readingMonth) {
      toast.error("Month is required");
      return;
    }

    const readingValue = Number(readingForm.reading);
    if (!Number.isFinite(readingValue) || readingValue < 0) {
      toast.error("Reading must be 0 or higher");
      return;
    }

    setSavingReading(true);
    try {
      const endpoint = editingReadingId
        ? `/api/electricity-meters/${readingForm.meterId}/readings/${editingReadingId}`
        : `/api/electricity-meters/${readingForm.meterId}/readings`;
      const response = await fetch(endpoint, {
        method: editingReadingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          readingMonth: readingForm.readingMonth,
          reading: readingValue,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        toast.error(payload?.error ?? "Unable to save reading");
        return;
      }

      toast.success(editingReadingId ? "Reading updated" : "Reading saved");
      setReadingForm((current) => ({
        ...current,
        reading: "",
        readingMonth: getLocalMonthInputValue(),
      }));
      setEditingReadingId(null);
      await loadReadings(readingForm.meterId);
      await loadMeters();
    } finally {
      setSavingReading(false);
    }
  };

  const openNewMeterModal = () => {
    setMeterForm(defaultMeterState());
    setEditMeterId(null);
    setMeterModalOpen(true);
  };

  const openEditMeterModal = (meter: ElectricityMeter) => {
    setMeterForm({
      name: meter.name,
      meterNumber: meter.meterNumber,
      customerName: meter.customerName,
      startReading: String(meter.startReading),
      startDate: meter.startDate ? meter.startDate.slice(0, 10) : getLocalDateInputValue(),
    });
    setEditMeterId(meter._id);
    setMeterModalOpen(true);
  };

  const startEditReading = (reading: ElectricityReading) => {
    setReadingForm({
      meterId: reading.meterId,
      readingMonth: reading.readingMonth,
      reading: String(reading.reading),
    });
    setEditingReadingId(reading._id);
  };

  const cancelEditReading = () => {
    setEditingReadingId(null);
    setReadingForm((current) => ({
      ...current,
      reading: "",
      readingMonth: getLocalMonthInputValue(),
    }));
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }

    setDeletePending(true);
    try {
      if (deleteTarget.type === "meter") {
        const response = await fetch(`/api/electricity-meters/${deleteTarget.id}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as { error?: string } | null;
          toast.error(payload?.error ?? "Unable to delete meter");
          return;
        }

        toast.success("Meter deleted");
        if (readingForm.meterId === deleteTarget.id) {
          setReadingForm(defaultReadingState(""));
          setReadings([]);
        }
        await loadMeters();
        return;
      }

      const response = await fetch(
        `/api/electricity-meters/${deleteTarget.meterId}/readings/${deleteTarget.id}`,
        { method: "DELETE" }
      );

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        toast.error(payload?.error ?? "Unable to delete reading");
        return;
      }

      toast.success("Reading deleted");
      await loadReadings(readingForm.meterId);
      await loadMeters();
    } finally {
      setDeletePending(false);
      setDeleteTarget(null);
    }
  };

  return (
    <main className="space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Electricity Bill</h1>
        <p className="text-sm text-slate-500">
          Create a new meter with initial reading, then update monthly readings.
        </p>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Meters & Readings</h2>
          <p className="text-sm text-slate-500">Manage meters and update monthly readings.</p>
        </div>
        {isAdmin ? (
          <Button type="button" onClick={openNewMeterModal}>
            New Meter
          </Button>
        ) : null}
      </div>

      {!loadingRole && !isAdmin ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          This section is read-only for users. Please ask an admin to edit or delete meters.
        </div>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-[1fr]">
        <form
          onSubmit={handleAddReading}
          className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Monthly Reading</h2>
            <p className="text-sm text-slate-500">
              Select a meter and record the monthly reading.
            </p>
          </div>

          <SelectField
            label="Meter"
            value={readingForm.meterId}
            onChange={(value) => setReadingForm((current) => ({ ...current, meterId: value }))}
            options={meters.map((meter) => ({
              value: meter._id,
              label: `${meter.name} • ${meter.meterNumber}`,
            }))}
            placeholder={loadingMeters ? "Loading meters..." : "Select a meter"}
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <InputField
              label="Month"
              type="month"
              value={readingForm.readingMonth}
              onChange={(value) => setReadingForm((current) => ({ ...current, readingMonth: value }))}
              required
              disabled={!isAdmin}
            />
            <InputField
              label="Reading"
              type="number"
              value={readingForm.reading}
              onChange={(value) => setReadingForm((current) => ({ ...current, reading: value }))}
              required
              min={0}
              step="0.01"
              inputMode="decimal"
              disabled={!isAdmin}
            />
          </div>

          {selectedMeter ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
              <p className="font-medium text-slate-700">Selected meter</p>
              <p>{selectedMeter.name}</p>
              <p className="text-slate-500">
                Last reading:{" "}
                {selectedMeter.latestReading
                  ? `${selectedMeter.latestReading.reading} (${selectedMeter.latestReading.readingMonth})`
                  : `${selectedMeter.startReading} (start)`}
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2">
            {editingReadingId ? (
              <Button type="button" variant="outline" onClick={cancelEditReading}>
                Cancel Edit
              </Button>
            ) : null}
            <Button
              type="submit"
              disabled={savingReading || !readingForm.meterId || !isAdmin}
            >
              {savingReading
                ? "Saving..."
                : editingReadingId
                  ? "Update Reading"
                  : "Save Reading"}
            </Button>
          </div>
        </form>
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-slate-900">Meters</h2>
            <p className="text-sm text-slate-500">Overview of all registered meters.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="py-2">Name</th>
                  <th className="py-2">Meter No</th>
                  <th className="py-2">Customer</th>
                  <th className="py-2">Start</th>
                  <th className="py-2">Latest</th>
                  {isAdmin ? <th className="py-2 text-right">Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {loadingMeters ? (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="py-4 text-center text-slate-500">
                      Loading meters...
                    </td>
                  </tr>
                ) : meters.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 6 : 5} className="py-4 text-center text-slate-500">
                      No meters yet.
                    </td>
                  </tr>
                ) : (
                  meters.map((meter) => (
                    <tr key={meter._id} className="border-b border-slate-100">
                      <td className="py-2 font-medium text-slate-700">{meter.name}</td>
                      <td className="py-2 text-slate-600">{meter.meterNumber}</td>
                      <td className="py-2 text-slate-600">{meter.customerName}</td>
                      <td className="py-2 text-slate-600">{meter.startReading}</td>
                      <td className="py-2 text-slate-600">
                        {meter.latestReading
                          ? `${meter.latestReading.reading} (${meter.latestReading.readingMonth})`
                          : "-"}
                      </td>
                      {isAdmin ? (
                        <td className="py-2 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditMeterModal(meter)}
                              className="cursor-pointer rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteTarget({
                                  type: "meter",
                                  id: meter._id,
                                  label: meter.name,
                                })
                              }
                              className="cursor-pointer rounded-lg border border-rose-300 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3">
            <h2 className="text-lg font-semibold text-slate-900">Reading History</h2>
            <p className="text-sm text-slate-500">
              {selectedMeter ? `Readings for ${selectedMeter.name}` : "Select a meter to view readings."}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-500">
                  <th className="py-2">Month</th>
                  <th className="py-2">Reading</th>
                  {isAdmin ? <th className="py-2 text-right">Actions</th> : null}
                </tr>
              </thead>
              <tbody>
                {!selectedMeter ? (
                  <tr>
                    <td colSpan={isAdmin ? 3 : 2} className="py-4 text-center text-slate-500">
                      Select a meter to see readings.
                    </td>
                  </tr>
                ) : loadingReadings ? (
                  <tr>
                    <td colSpan={isAdmin ? 3 : 2} className="py-4 text-center text-slate-500">
                      Loading readings...
                    </td>
                  </tr>
                ) : readings.length === 0 ? (
                  <tr>
                    <td colSpan={isAdmin ? 3 : 2} className="py-4 text-center text-slate-500">
                      No readings yet.
                    </td>
                  </tr>
                ) : (
                  readings.map((reading) => (
                    <tr key={reading._id} className="border-b border-slate-100">
                      <td className="py-2 text-slate-600">{reading.readingMonth}</td>
                      <td className="py-2 font-medium text-slate-700">{reading.reading}</td>
                      {isAdmin ? (
                        <td className="py-2 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => startEditReading(reading)}
                              className="cursor-pointer rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDeleteTarget({
                                  type: "reading",
                                  id: reading._id,
                                  meterId: reading.meterId,
                                })
                              }
                              className="cursor-pointer rounded-lg border border-rose-300 px-2 py-1 text-xs text-rose-700 hover:bg-rose-50"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      ) : null}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {meterModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  {editMeterId ? "Edit Meter" : "New Meter"}
                </h2>
                <p className="text-sm text-slate-500">
                  Add meter details along with the starting reading.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setMeterModalOpen(false)}
              >
                Close
              </Button>
            </div>

            <form onSubmit={handleCreateMeter} className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <InputField
                  label="Meter name"
                  value={meterForm.name}
                  onChange={(value) => setMeterForm((current) => ({ ...current, name: value }))}
                  placeholder="Shop Main Meter"
                  required
                />
                <InputField
                  label="Meter number"
                  value={meterForm.meterNumber}
                  onChange={(value) => setMeterForm((current) => ({ ...current, meterNumber: value }))}
                  placeholder="Meter ID"
                  required
                />
                <InputField
                  label="Customer name"
                  value={meterForm.customerName}
                  onChange={(value) => setMeterForm((current) => ({ ...current, customerName: value }))}
                  placeholder="Customer / Owner"
                  required
                />
                <InputField
                  label="Start reading"
                  type="number"
                  value={meterForm.startReading}
                  onChange={(value) => setMeterForm((current) => ({ ...current, startReading: value }))}
                  required
                  min={0}
                  step="0.01"
                  inputMode="decimal"
                />
                <InputField
                  label="Start date"
                  type="date"
                  value={meterForm.startDate}
                  onChange={(value) => setMeterForm((current) => ({ ...current, startDate: value }))}
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setMeterModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={savingMeter}>
                  {savingMeter ? "Saving..." : editMeterId ? "Save Changes" : "Create Meter"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title={deleteTarget?.type === "meter" ? "Delete Meter" : "Delete Reading"}
        message={
          deleteTarget?.type === "meter"
            ? `Delete ${deleteTarget.label}? This will remove all readings.`
            : "Are you sure you want to delete this reading?"
        }
        confirmText="Delete"
        loading={deletePending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </main>
  );
}
