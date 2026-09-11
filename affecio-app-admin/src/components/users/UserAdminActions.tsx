"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { addUserNote, deleteUser, enforceUser, updateUser } from "@/services/users";
import type { AppUserDetail, EnforceAction } from "@/types/user";
import { useAuth } from "@/providers/AuthProvider";
import { caseNoteRoles, enforceRoles, hasRole, profileEditRoles, userDeleteRoles } from "@/config/access";

interface UserAdminActionsProps {
  user: AppUserDetail;
}

const ENFORCE_OPTIONS: { action: EnforceAction; label: string; danger?: boolean }[] = [
  { action: "warn", label: "Warn" },
  { action: "restrict", label: "Restrict discovery" },
  { action: "shadowban", label: "Shadowban" },
  { action: "suspend", label: "Suspend" },
  { action: "ban", label: "Ban", danger: true },
  { action: "restore", label: "Restore" },
];

export function UserAdminActions({ user }: UserAdminActionsProps) {
  const { admin } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [enforceAction, setEnforceAction] = useState<EnforceAction | null>(null);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    name: user.name,
    email: user.email ?? "",
    phoneNumber: user.phoneNumber,
    gender: user.gender,
    aboutMe: user.aboutMe ?? "",
  });

  const canEdit = hasRole(admin?.role, profileEditRoles);
  const canEnforce = hasRole(admin?.role, enforceRoles);
  const canNote = hasRole(admin?.role, caseNoteRoles);
  const canDelete = hasRole(admin?.role, userDeleteRoles);

  function onUpdated(updated: AppUserDetail) {
    void queryClient.setQueryData(["user", user.id], updated);
    void queryClient.invalidateQueries({ queryKey: ["users"] });
    setFormError("");
    setEditOpen(false);
    setNoteOpen(false);
    setEnforceAction(null);
    setReason("");
    setNote("");
  }

  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateUser>[1]) => updateUser(user.id, payload),
    onSuccess: onUpdated,
    onError: (err) => setFormError(getApiErrorMessage(err, "Failed to update user.")),
  });

  const enforceMutation = useMutation({
    mutationFn: () => enforceUser(user.id, { action: enforceAction!, reason: reason.trim() }),
    onSuccess: onUpdated,
    onError: (err) => setFormError(getApiErrorMessage(err, "Failed to apply action.")),
  });

  const noteMutation = useMutation({
    mutationFn: () => addUserNote(user.id, note.trim()),
    onSuccess: onUpdated,
    onError: (err) => setFormError(getApiErrorMessage(err, "Failed to add note.")),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteUser(user.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      router.push("/users");
    },
    onError: (err) => setFormError(getApiErrorMessage(err, "Failed to delete user.")),
  });

  if (!canEdit && !canEnforce && !canNote && !canDelete) return null;

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateMutation.mutate({
      name: form.name.trim(),
      email: form.email.trim() || null,
      phoneNumber: form.phoneNumber.trim(),
      gender: form.gender.trim(),
      aboutMe: form.aboutMe.trim() || null,
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-end gap-2">
        {canNote ? (
          <AffecioButton variant="secondary" onClick={() => setNoteOpen(true)}>
            Add case note
          </AffecioButton>
        ) : null}
        {canEdit ? (
          <AffecioButton variant="secondary" onClick={() => setEditOpen(true)}>
            Edit profile
          </AffecioButton>
        ) : null}
        {canEnforce
          ? ENFORCE_OPTIONS.filter((option) =>
              option.action === "restore" ? user.accountStatus !== "active" : true,
            ).map((option) => (
              <AffecioButton
                key={option.action}
                variant={option.danger ? "danger" : "secondary"}
                onClick={() => {
                  setEnforceAction(option.action);
                  setReason("");
                  setFormError("");
                }}
              >
                {option.label}
              </AffecioButton>
            ))
          : null}
        {canDelete ? (
          <AffecioButton variant="danger" onClick={() => setDeleteOpen(true)}>
            Delete
          </AffecioButton>
        ) : null}
      </div>

      <Dialog open={Boolean(enforceAction)} onOpenChange={(open) => !open && setEnforceAction(null)}>
        <DialogContent className="border-affecio-border bg-affecio-surface sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="capitalize">{enforceAction?.replace(/_/g, " ")} account</DialogTitle>
            <DialogDescription>
              Trust & Safety action on {user.name}. This is logged on the case timeline and visible to
              support.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Policy reason (required)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          {formError ? <ApiErrorMessage message={formError} /> : null}
          <DialogFooter>
            <AffecioButton type="button" variant="secondary" onClick={() => setEnforceAction(null)}>
              Cancel
            </AffecioButton>
            <AffecioButton
              variant={enforceAction === "ban" ? "danger" : "primary"}
              disabled={!reason.trim() || enforceMutation.isPending}
              onClick={() => enforceMutation.mutate()}
            >
              {enforceMutation.isPending ? "Applying…" : "Confirm"}
            </AffecioButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={noteOpen} onOpenChange={setNoteOpen}>
        <DialogContent className="border-affecio-border bg-affecio-surface sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add case note</DialogTitle>
            <DialogDescription>
              Internal only. Use this for identity checks, what the member said, and what you already tried.
            </DialogDescription>
          </DialogHeader>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={4}
            placeholder="Note"
            className="w-full rounded-md border border-affecio-border bg-affecio-input px-3 py-2 text-sm"
          />
          {formError ? <ApiErrorMessage message={formError} /> : null}
          <DialogFooter>
            <AffecioButton type="button" variant="secondary" onClick={() => setNoteOpen(false)}>
              Cancel
            </AffecioButton>
            <AffecioButton disabled={!note.trim() || noteMutation.isPending} onClick={() => noteMutation.mutate()}>
              {noteMutation.isPending ? "Saving…" : "Save note"}
            </AffecioButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="border-affecio-border bg-affecio-surface sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>Correct member-facing profile fields. Enforcement stays on the case actions.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-3">
            <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Name" />
            <Input value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="Email" />
            <Input value={form.phoneNumber} onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))} placeholder="Phone" />
            <Input value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))} placeholder="Gender" />
            <textarea
              value={form.aboutMe}
              onChange={(e) => setForm((f) => ({ ...f, aboutMe: e.target.value }))}
              placeholder="About me"
              rows={2}
              className="w-full rounded-md border border-affecio-border bg-affecio-input px-3 py-2 text-sm"
            />
            {formError ? <ApiErrorMessage message={formError} /> : null}
            <DialogFooter>
              <AffecioButton type="button" variant="secondary" onClick={() => setEditOpen(false)}>
                Cancel
              </AffecioButton>
              <AffecioButton type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Saving…" : "Save changes"}
              </AffecioButton>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="border-affecio-border bg-affecio-surface sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete user permanently?</DialogTitle>
            <DialogDescription>
              This removes {user.name} and related data. Prefer Ban unless legal/ops requires erasure.
            </DialogDescription>
          </DialogHeader>
          {formError ? <ApiErrorMessage message={formError} /> : null}
          <DialogFooter>
            <AffecioButton type="button" variant="secondary" onClick={() => setDeleteOpen(false)}>
              Cancel
            </AffecioButton>
            <AffecioButton
              variant="danger"
              disabled={deleteMutation.isPending}
              onClick={() => deleteMutation.mutate()}
            >
              {deleteMutation.isPending ? "Deleting…" : "Delete user"}
            </AffecioButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
