"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AffecioButton } from "@/components/affecio/AffecioButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ApiErrorMessage } from "@/components/shared/ApiErrorMessage";
import { getApiErrorMessage } from "@/lib/api-error";
import { getUsers } from "@/services/users";
import { createSupportTicket, type SupportTicketCategory, type SupportTicketPriority } from "@/services/support";
import { AppUserCell, type AppUserCellUser } from "@/components/users/AppUserCell";
import { useDebounce } from "@/hooks/useDebounce";

interface CreateTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultUser?: AppUserCellUser | null;
}

export function CreateTicketDialog({ open, onOpenChange, defaultUser }: CreateTicketDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const debounced = useDebounce(search, 300);
  const [form, setForm] = useState({
    userId: defaultUser?.id ?? "",
    subject: "",
    category: "account" as SupportTicketCategory,
    priority: "medium" as SupportTicketPriority,
    body: "",
    asUser: true,
  });

  useEffect(() => {
    if (open) {
      setForm({
        userId: defaultUser?.id ?? "",
        subject: "",
        category: "account",
        priority: "medium",
        body: "",
        asUser: true,
      });
      setSearch("");
      setError("");
    }
  }, [open, defaultUser?.id]);

  const usersQuery = useQuery({
    queryKey: ["users", "ticket-search", debounced],
    queryFn: () => getUsers({ page: 1, pageSize: 8, search: debounced || undefined }),
    enabled: open && !defaultUser,
  });

  const mutation = useMutation({
    mutationFn: createSupportTicket,
    onSuccess: (ticket) => {
      void queryClient.invalidateQueries({ queryKey: ["support"] });
      void queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
      onOpenChange(false);
      router.push(`/support/${ticket.id}`);
    },
    onError: (err) => setError(getApiErrorMessage(err, "Failed to create ticket.")),
  });

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.userId || !form.subject.trim() || !form.body.trim()) {
      setError("Select a member, then add a subject and first message.");
      return;
    }
    setError("");
    mutation.mutate(form);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New support ticket</DialogTitle>
          <DialogDescription>
            Log a member complaint or start a live chat thread on their behalf.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          {defaultUser ? (
            <div className="rounded-lg border border-affecio-border px-3 py-2">
              <AppUserCell user={defaultUser} link={false} subtitle />
            </div>
          ) : (
            <>
              <Input
                placeholder="Search member by name, email, or phone"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <div className="max-h-40 overflow-y-auto rounded-lg border border-affecio-border">
                {(usersQuery.data?.data ?? []).map((user) => (
                  <button
                    type="button"
                    key={user.id}
                    onClick={() => setForm((f) => ({ ...f, userId: user.id }))}
                    className={`flex w-full px-3 py-2 text-left hover:bg-affecio-input ${form.userId === user.id ? "bg-affecio-input" : ""}`}
                  >
                    <AppUserCell user={user} link={false} subtitle />
                  </button>
                ))}
              </div>
            </>
          )}
          <Input
            placeholder="Subject *"
            value={form.subject}
            onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as SupportTicketCategory }))}
              className="h-10 rounded-lg border border-affecio-border bg-affecio-surface px-3 text-sm"
            >
              <option value="account">Account</option>
              <option value="safety">Safety</option>
              <option value="matching">Matching</option>
              <option value="billing">Billing</option>
              <option value="technical">Technical</option>
              <option value="other">Other</option>
            </select>
            <select
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value as SupportTicketPriority }))}
              className="h-10 rounded-lg border border-affecio-border bg-affecio-surface px-3 text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <textarea
            placeholder="First message *"
            rows={4}
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            className="w-full rounded-lg border border-affecio-border bg-affecio-surface px-3 py-2 text-sm"
          />
          <label className="flex items-center gap-2 text-sm text-affecio-muted">
            <input
              type="checkbox"
              checked={form.asUser}
              onChange={(e) => setForm((f) => ({ ...f, asUser: e.target.checked }))}
            />
            First message is from the member (complaint)
          </label>
          {error ? <ApiErrorMessage message={error} /> : null}
          <DialogFooter>
            <AffecioButton type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </AffecioButton>
            <AffecioButton type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating…" : "Open ticket"}
            </AffecioButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
