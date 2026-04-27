"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Phone } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/button";
import { InputField, TextAreaField } from "@/components/input-field";
import { SelectField } from "@/components/select-field";
import { useDebounce } from "@/hooks/use-debounce";
import type { Contact, ContactCategory } from "@/types/daybook";

const CREATE_NEW_CATEGORY_VALUE = "__create_new_contact_category__";

function categoryNameFromContactCategory(category: Contact["categoryId"]) {
  if (!category) {
    return "-";
  }

  if (typeof category === "string") {
    return category;
  }

  return category.name;
}

function whatsappNumberFromMobile(mobile: string | undefined) {
  const digits = mobile?.replace(/\D/g, "") ?? "";
  if (!digits) {
    return null;
  }

  return digits.startsWith("91") ? digits : `91${digits}`;
}

export default function ContactsPage() {
  const PAGE_SIZE = 20;
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [categories, setCategories] = useState<ContactCategory[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [confirmDeleteContact, setConfirmDeleteContact] = useState<Contact | null>(null);
  const [pending, setPending] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [deletingContact, setDeletingContact] = useState<string | null>(null);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery.trim(), 300);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const fetchingRef = useRef(false);

  const resetForm = () => {
    setName("");
    setMobile("");
    setEmail("");
    setAddress("");
    setNotes("");
    setNewCategoryName("");
  };

  const categoryIdFromContact = (contact: Contact) =>
    typeof contact.categoryId === "string" ? contact.categoryId : contact.categoryId?._id;

  const buildQueryString = useCallback(
    (pageValue: number) => {
      const params = new URLSearchParams();
      params.set("page", String(pageValue));
      params.set("limit", String(PAGE_SIZE));
      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      }
      return params.toString();
    },
    [debouncedSearch]
  );

  const loadContacts = useCallback(
    async (pageValue: number, reset = false) => {
      fetchingRef.current = true;
      if (reset) {
        setLoadingContacts(true);
      } else {
        setLoadingMore(true);
      }

      try {
        const response = await fetch(`/api/contacts?${buildQueryString(pageValue)}`, {
          cache: "no-store",
        });

        if (!response.ok) {
          if (reset) {
            setContacts([]);
          }
          setHasMore(false);
          return;
        }

        const payload = (await response.json()) as {
          contacts: Contact[];
          total: number;
          hasMore?: boolean;
        };

        setContacts((current) => {
          if (reset) {
            return payload.contacts;
          }

          const seen = new Set(current.map((contact) => contact._id));
          const next = payload.contacts.filter((contact) => !seen.has(contact._id));
          return [...current, ...next];
        });

        setHasMore(payload.hasMore ?? pageValue * PAGE_SIZE < payload.total);
      } finally {
        fetchingRef.current = false;
        setLoadingContacts(false);
        setLoadingMore(false);
      }
    },
    [buildQueryString]
  );

  useEffect(() => {
    fetch("/api/contact-categories", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) {
          return null;
        }
        return response.json() as Promise<{ categories: ContactCategory[] }>;
      })
      .then((payload) => {
        const nextCategories = payload?.categories ?? [];
        setCategories(nextCategories);
        if (nextCategories.length > 0) {
          setCategoryId((current) => current || nextCategories[0]._id);
        }
      });
  }, []);

  useEffect(() => {
    setPage(1);
    setHasMore(true);
    void loadContacts(1, true);
  }, [debouncedSearch, loadContacts]);

  useEffect(() => {
    if (page === 1) {
      return;
    }
    void loadContacts(page);
  }, [page, loadContacts]);

  const categoryOptions = useMemo(
    () => [
      ...categories.map((category) => ({ value: category._id, label: category.name })),
      { value: CREATE_NEW_CATEGORY_VALUE, label: "+ Create new category" },
    ],
    [categories]
  );

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !hasMore) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry.isIntersecting) {
          return;
        }

        if (fetchingRef.current || loadingContacts || loadingMore) {
          return;
        }

        setPage((current) => current + 1);
      },
      { rootMargin: "200px" }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadingContacts, loadingMore]);

  const createCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error("Enter category name");
      return;
    }

    setCreatingCategory(true);
    try {
      const response = await fetch("/api/contact-categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        toast.error(payload?.error ?? "Unable to create category");
        return;
      }

      const payload = (await response.json()) as { category: ContactCategory };
      setCategories((current) => [...current, payload.category].sort((a, b) => a.name.localeCompare(b.name)));
      setCategoryId(payload.category._id);
      setNewCategoryName("");
      toast.success("Contact category created");
    } finally {
      setCreatingCategory(false);
    }
  };

  const saveContact = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!categoryId || categoryId === CREATE_NEW_CATEGORY_VALUE) {
      toast.error("Select a contact category");
      return;
    }

    setPending(true);
    try {
      const isEditing = Boolean(editingContact?._id);
      const endpoint = isEditing ? `/api/contacts/${editingContact?._id}` : "/api/contacts";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          mobile,
          email,
          address,
          notes,
          categoryId,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        toast.error(payload?.error ?? "Unable to save contact");
        return;
      }

      toast.success(isEditing ? "Contact updated" : "Contact saved");
      resetForm();
      setCreateOpen(false);
      setEditingContact(null);
      setPage(1);
      setHasMore(true);
      await loadContacts(1, true);
    } finally {
      setPending(false);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setEditingContact(null);
    if (categories.length > 0) {
      setCategoryId(categories[0]._id);
    }
    setCreateOpen(true);
  };

  const openEditModal = (contact: Contact) => {
    setEditingContact(contact);
    setName(contact.name || "");
    setMobile(contact.mobile || "");
    setEmail(contact.email || "");
    setAddress(contact.address || "");
    setNotes(contact.notes || "");
    setCategoryId(categoryIdFromContact(contact));
    setNewCategoryName("");
    setCreateOpen(true);
  };

  const closeModal = () => {
    setCreateOpen(false);
    setEditingContact(null);
    setNewCategoryName("");
  };

  const openDeleteModal = (contact: Contact) => {
    setConfirmDeleteContact(contact);
  };

  const closeDeleteModal = () => {
    if (!deletingContact) {
      setConfirmDeleteContact(null);
    }
  };

  const deleteContact = async (id: string) => {
    setDeletingContact(id);
    try {
      const response = await fetch(`/api/contacts/${id}`, { method: "DELETE" });
      if (!response.ok) {
        toast.error("Unable to delete contact");
        return;
      }

      toast.success("Contact deleted");
      setContacts((current) => current.filter((contact) => contact._id !== id));
      setConfirmDeleteContact(null);
    } finally {
      setDeletingContact(null);
    }
  };

  return (
    <main className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Contacts</h1>
          <p className="text-sm text-slate-500">
            Store and organize all contacts category wise.
          </p>
        </div>
        <Button type="button" variant="secondary" size="md" onClick={openCreateModal}>
          Create Contact
        </Button>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <InputField
          label="Search"
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by name, mobile, or category"
        />
      </section>

      {createOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <section className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingContact ? "Edit Contact" : "Create Contact"}
              </h2>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={closeModal}
              >
                Close
              </Button>
            </div>

            <form
              onSubmit={saveContact}
              className="grid max-h-[75vh] gap-4 overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-2"
            >
              <InputField
                label="Name"
                value={name}
                onChange={setName}
                placeholder="Full name"
                required
              />
              <InputField
                label="Mobile"
                value={mobile}
                onChange={setMobile}
                placeholder="10-15 digit mobile"
                required
              />

              <InputField
                label="Email"
                value={email}
                onChange={setEmail}
                placeholder="Optional email"
                type="email"
              />

              <SelectField
                label="Category"
                value={categoryId}
                onChange={setCategoryId}
                options={categoryOptions}
                placeholder="Select category"
                searchable
                searchPlaceholder="Search category..."
                required
              />

              {categoryId === CREATE_NEW_CATEGORY_VALUE ? (
                <div className="md:col-span-2 grid gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:grid-cols-[1fr_auto] sm:items-end">
                  <InputField
                    label="New Category"
                    value={newCategoryName}
                    onChange={setNewCategoryName}
                    placeholder="Enter new contact category"
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={() => void createCategory()}
                    disabled={creatingCategory}
                  >
                    {creatingCategory ? "Creating..." : "Create Category"}
                  </Button>
                </div>
              ) : null}

              <InputField
                label="Address"
                value={address}
                onChange={setAddress}
                placeholder="Optional address"
                containerClassName="md:col-span-2"
              />

              <TextAreaField
                label="Notes"
                value={notes}
                onChange={setNotes}
                placeholder="Optional notes"
                rows={2}
                containerClassName="md:col-span-2"
              />

              <div className="md:col-span-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={pending}
                >
                  {pending
                    ? "Saving..."
                    : editingContact
                      ? "Update Contact"
                      : "Save Contact"}
                </Button>
              </div>
            </form>
          </section>
        </div>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-4">
        <h2 className="text-lg font-semibold">Saved Contacts</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {loadingContacts ? (
            <p className="text-sm text-slate-500">Loading contacts...</p>
          ) : contacts.length === 0 ? (
            <p className="text-sm text-slate-500">No contacts found.</p>
          ) : null}
          {contacts.map((contact) => (
            <article
              key={contact._id}
              className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-base font-semibold text-slate-900">{contact.name}</h3>
                  <p className="text-sm text-slate-600">{contact.mobile}</p>
                </div>
                <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                  {categoryNameFromContactCategory(contact.categoryId)}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <a
                  href={`tel:${contact.mobile}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 px-2 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50"
                >
                  <Phone size={14} />
                  Call
                </a>
                {whatsappNumberFromMobile(contact.mobile) ? (
                  <a
                    href={`https://wa.me/${whatsappNumberFromMobile(contact.mobile)}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-emerald-300 px-2 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50"
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle size={14} />
                    WhatsApp
                  </a>
                ) : null}
                <Button
                  type="button"
                  size="xs"
                  variant="outline"
                  onClick={() => openEditModal(contact)}
                >
                  Edit
                </Button>
                <button
                  type="button"
                  onClick={() => openDeleteModal(contact)}
                  disabled={deletingContact === contact._id}
                  className="inline-flex cursor-pointer items-center gap-1 rounded-lg border border-rose-300 px-2 py-1 text-xs font-medium text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
                >
                  {deletingContact === contact._id ? "Deleting..." : "Delete"}
                </button>
              </div>
            </article>
          ))}
          <div ref={loadMoreRef} className="h-6" />
        </div>
        {loadingMore ? (
          <p className="mt-3 text-sm text-slate-500">Loading more contacts...</p>
        ) : null}
      </section>

      {confirmDeleteContact ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4">
          <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-xl">
            <h2 className="text-lg font-semibold text-slate-900">Delete Contact</h2>
            <p className="mt-2 text-sm text-slate-600">
              Are you sure you want to delete {confirmDeleteContact.name}? This action cannot be undone.
            </p>
            <div className="mt-4 flex items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={closeDeleteModal}
                disabled={Boolean(deletingContact)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                size="xs"
                onClick={() => void deleteContact(confirmDeleteContact._id)}
                disabled={deletingContact === confirmDeleteContact._id}
              >
                {deletingContact === confirmDeleteContact._id ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
