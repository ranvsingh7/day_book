"use client";

import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/button";
import { InputField, TextAreaField } from "@/components/input-field";
import { SelectField } from "@/components/select-field";
import { formatDate } from "@/lib/format";
import type { CustomerQuery } from "@/types/daybook";

type FollowupFormData = {
  status: CustomerQuery["status"];
  followUpNote: string;
  followUpDate: string;
};

function statusBadge(status: CustomerQuery["status"]) {
  if (status === "resolved") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "in-progress") {
    return "bg-amber-50 text-amber-700";
  }

  return "bg-slate-100 text-slate-700";
}

export default function CustomerQueriesPage() {
  const [queries, setQueries] = useState<CustomerQuery[]>([]);
  const [pending, setPending] = useState(false);
  const [followupPending, setFollowupPending] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const [customerName, setCustomerName] = useState("");
  const [mobile, setMobile] = useState("");
  const [queryText, setQueryText] = useState("");

  const [followupOpen, setFollowupOpen] = useState(false);
  const [activeQuery, setActiveQuery] = useState<CustomerQuery | null>(null);
  const [followupData, setFollowupData] = useState<FollowupFormData>({
    status: "open",
    followUpNote: "",
    followUpDate: "",
  });

  const load = async () => {
    const response = await fetch("/api/customer-queries", { cache: "no-store" });
    if (!response.ok) {
      setQueries([]);
      return;
    }

    const payload = (await response.json()) as { queries: CustomerQuery[] };
    setQueries(payload.queries);
  };

  useEffect(() => {
    let cancelled = false;

    const fetchInitialData = async () => {
      const response = await fetch("/api/customer-queries", { cache: "no-store" });
      if (cancelled) {
        return;
      }

      if (!response.ok) {
        setQueries([]);
        return;
      }

      const payload = (await response.json()) as { queries: CustomerQuery[] };
      setQueries(payload.queries);
    };

    void fetchInitialData();

    return () => {
      cancelled = true;
    };
  }, []);

  const addQuery = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setPending(true);
    try {
      const response = await fetch("/api/customer-queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerName, mobile, queryText }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        toast.error(payload?.error ?? "Unable to save query");
        return;
      }

      toast.success("Customer query saved");
      setCustomerName("");
      setMobile("");
      setQueryText("");
      setCreateOpen(false);
      await load();
    } finally {
      setPending(false);
    }
  };

  const openFollowupModal = (query: CustomerQuery) => {
    setActiveQuery(query);
    setFollowupData({
      status: query.status,
      followUpNote: query.followUpNote || "",
      followUpDate: query.followUpDate ? query.followUpDate.slice(0, 10) : "",
    });
    setFollowupOpen(true);
  };

  const closeFollowupModal = () => {
    setFollowupOpen(false);
    setActiveQuery(null);
    setFollowupData({ status: "open", followUpNote: "", followUpDate: "" });
  };

  const updateFollowup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!activeQuery) {
      return;
    }

    setFollowupPending(true);
    try {
      const response = await fetch(`/api/customer-queries/${activeQuery._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(followupData),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        toast.error(payload?.error ?? "Unable to update follow-up");
        return;
      }

      toast.success("Follow-up updated");
      closeFollowupModal();
      await load();
    } finally {
      setFollowupPending(false);
    }
  };

  return (
    <main className="space-y-4">
      <header>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Customer Queries</h1>
            <p className="text-sm text-slate-500">
              Create customer queries and keep follow-up updates in one place.
            </p>
          </div>
          <Button type="button" variant="primary" size="md" onClick={() => setCreateOpen(true)}>
            Create Query
          </Button>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Query List</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-[980px] w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th className="py-2">Customer</th>
                <th className="py-2">Mobile</th>
                <th className="py-2">Query</th>
                <th className="py-2">Status</th>
                <th className="py-2">Follow-up Note</th>
                <th className="py-2">Next Follow-up</th>
                <th className="py-2">Updated</th>
                <th className="py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {queries.map((query) => (
                <tr key={query._id} className="border-t border-slate-200">
                  <td className="py-2 font-medium text-slate-800">{query.customerName}</td>
                  <td className="py-2">{query.mobile}</td>
                  <td className="max-w-[260px] py-2">
                    <p className="truncate" title={query.queryText}>{query.queryText}</p>
                  </td>
                  <td className="py-2">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusBadge(query.status)}`}>
                      {query.status}
                    </span>
                  </td>
                  <td className="max-w-[220px] py-2">
                    <p className="truncate" title={query.followUpNote || "-"}>{query.followUpNote || "-"}</p>
                  </td>
                  <td className="py-2">{query.followUpDate ? formatDate(query.followUpDate) : "-"}</td>
                  <td className="py-2">{query.lastFollowedUpAt ? formatDate(query.lastFollowedUpAt) : "-"}</td>
                  <td className="py-2 text-right">
                    <Button
                      type="button"
                      size="xs"
                      variant="outline"
                      onClick={() => openFollowupModal(query)}
                    >
                      Update Follow-up
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <section className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Create Customer Query</h3>
              <Button type="button" variant="outline" size="xs" onClick={() => setCreateOpen(false)}>
                Close
              </Button>
            </div>

            <form onSubmit={addQuery} className="grid gap-4 md:grid-cols-2">
              <InputField
                label="Customer Name"
                value={customerName}
                onChange={setCustomerName}
                placeholder="Enter customer name"
                required
              />

              <InputField
                label="Mobile"
                value={mobile}
                onChange={setMobile}
                placeholder="10-15 digit mobile"
                required
              />

              <TextAreaField
                label="Customer Query"
                value={queryText}
                onChange={setQueryText}
                placeholder="Write customer query details"
                rows={3}
                containerClassName="md:col-span-2"
                required
              />

              <div className="md:col-span-2">
                <Button type="submit" variant="primary" size="md" disabled={pending}>
                  {pending ? "Saving..." : "Save Query"}
                </Button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      {followupOpen && activeQuery ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <section className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Update Follow-up</h3>
              <Button type="button" variant="outline" size="xs" onClick={closeFollowupModal}>
                Close
              </Button>
            </div>

            <form onSubmit={updateFollowup} className="grid gap-4">
              <SelectField
                label="Status"
                value={followupData.status}
                onChange={(value) =>
                  setFollowupData((current) => ({
                    ...current,
                    status: value as FollowupFormData["status"],
                  }))
                }
                options={[
                  { value: "open", label: "Open" },
                  { value: "in-progress", label: "In Progress" },
                  { value: "resolved", label: "Resolved" },
                ]}
                required
              />

              <InputField
                label="Next Follow-up Date"
                type="date"
                value={followupData.followUpDate}
                onChange={(value) =>
                  setFollowupData((current) => ({ ...current, followUpDate: value }))
                }
              />

              <TextAreaField
                label="Follow-up Note"
                value={followupData.followUpNote}
                onChange={(value) =>
                  setFollowupData((current) => ({ ...current, followUpNote: value }))
                }
                rows={3}
                placeholder="Write follow-up update"
              />

              <Button type="submit" variant="primary" size="md" disabled={followupPending}>
                {followupPending ? "Updating..." : "Save Follow-up"}
              </Button>
            </form>
          </section>
        </div>
      ) : null}
    </main>
  );
}
