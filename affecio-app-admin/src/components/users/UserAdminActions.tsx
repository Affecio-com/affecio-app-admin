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
import { deleteUser, updateUser } from "@/services/users";
import type { AppUserDetail, AccountStatus } from "@/types/user";
import { useAuth } from "@/providers/AuthProvider";

interface UserAdminActionsProps {
  user: AppUserDetail;
}

export function UserAdminActions({ user }: UserAdminActionsProps) {
  const { admin } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    name: user.name,
    email: user.email ?? "",
    phoneNumber: user.phoneNumber,
    gender: user.gender,
    aboutMe: user.aboutMe ?? "",
    adminNotes: user.adminNotes ?? "",
    statusReason: user.statusReason ?? "",
    accountStatus: user.accountStatus as AccountStatus,
  });

  const canWrite = admin && ["super_admin", "admin", "moderator"].includes(admin.role);
  const canDelete = admin && ["super_admin", "admin"].includes(admin.role);

  const updateMutation = useMutation({
    mutationFn: (payload: Parameters<typeof updateUser>[1]) => updateUser(user.id, payload),
    onSuccess: (updated) => {
      void queryClient.setQueryData(["user", user.id], updated);
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditOpen(false);
      setFormError("");
    },
    onError: (err) => setFormError(getApiErrorMessage(err, "Failed to update user.")),
  });

  const statusMutation = useMutation({
    mutationFn: (accountStatus: AccountStatus) =>
      updateUser(user.id, {
        accountStatus,
        statusReason:
          accountStatus === "active"
            ? null
            : accountStatus === "suspended"
              ? "Suspended by admin"
              : "Banned by admin",
      }),
    onSuccess: (updated) => {
      void queryClient.setQueryData(["user", user.id], updated);
      void queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteUser(user.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      router.push("/users");
    },
    onError: (err) => setFormError(getApiErrorMessage(err, "Failed to delete user.")),
  });

  if (!canWrite) return null;

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateMutation.mutate({
      name: form.name.trim(),
      email: form.email.trim() || null,
      phoneNumber: form.phoneNumber.trim(),
      gender: form.gender.trim(),
      aboutMe: form.aboutMe.trim() || null,
      adminNotes: form.adminNotes.trim() || null,
      statusReason: form.statusReason.trim() || null,
      accountStatus: form.accountStatus,
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <AffecioButton variant="secondary" onClick={() => setEditOpen(true)}>
          Edit profile
        </AffecioButton>
        {user.accountStatus !== "suspended" ? (
          <AffecioButton
            variant="secondary"
            disabled={statusMutation.isPending}
            onClick={() => statusMutation.mutate("suspended")}
          >
            Suspend
          </AffecioButton>
        ) : (
          <AffecioButton
            variant="secondary"
            disabled={statusMutation.isPending}
            onClick={() => statusMutation.mutate("active")}
          >
            Reactivate
          </AffecioButton>
        )}
        {user.accountStatus !== "banned" ? (
          <AffecioButton
            variant="danger"
            disabled={statusMutation.isPending}
            onClick={() => statusMutation.mutate("banned")}
          >
            Ban
          </AffecioButton>
        ) : (
          <AffecioButton
            variant="secondary"
            disabled={statusMutation.isPending}
            onClick={() => statusMutation.mutate("active")}
          >
            Unban
          </AffecioButton>
        )}
        {canDelete ? (
          <AffecioButton variant="danger" onClick={() => setDeleteOpen(true)}>
            Delete
          </AffecioButton>
        ) : null}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="border-affecio-border bg-affecio-surface sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit user</DialogTitle>
            <DialogDescription>Update profile fields and admin notes.</DialogDescription>
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
            <select
              value={form.accountStatus}
              onChange={(e) => setForm((f) => ({ ...f, accountStatus: e.target.value as AccountStatus }))}
              className="w-full rounded-md border border-affecio-border bg-affecio-input px-3 py-2 text-sm"
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="banned">Banned</option>
            </select>
            <Input value={form.statusReason} onChange={(e) => setForm((f) => ({ ...f, statusReason: e.target.value }))} placeholder="Status reason" />
            <textarea
              value={form.adminNotes}
              onChange={(e) => setForm((f) => ({ ...f, adminNotes: e.target.value }))}
              placeholder="Internal admin notes"
              rows={3}
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
              This removes {user.name} and all related data (matches, swipes, media, calls). This
              cannot be undone.
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
