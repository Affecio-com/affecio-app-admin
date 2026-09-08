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
import { createUser } from "@/services/users";

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateUserDialog({ open, onOpenChange }: CreateUserDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState("");
  const [form, setForm] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    gender: "",
    birthday: "",
    lookingFor: "",
    aboutMe: "",
  });

  const mutation = useMutation({
    mutationFn: createUser,
    onSuccess: (user) => {
      void queryClient.invalidateQueries({ queryKey: ["users"] });
      onOpenChange(false);
      setForm({ name: "", phoneNumber: "", email: "", gender: "", birthday: "", lookingFor: "", aboutMe: "" });
      setFormError("");
      router.push(`/users/${user.id}`);
    },
    onError: (err) => setFormError(getApiErrorMessage(err, "Failed to create user.")),
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (!form.name.trim() || !form.phoneNumber.trim() || !form.gender.trim() || !form.birthday.trim()) {
      setFormError("Name, phone, gender, and birthday are required.");
      return;
    }
    mutation.mutate({
      name: form.name.trim(),
      phoneNumber: form.phoneNumber.trim(),
      email: form.email.trim() || null,
      gender: form.gender.trim(),
      birthday: form.birthday,
      lookingFor: form.lookingFor
        ? form.lookingFor.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      aboutMe: form.aboutMe.trim() || null,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-affecio-border bg-affecio-surface sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create app user</DialogTitle>
          <DialogDescription>Register a new user in the Affecio app database.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Input placeholder="Full name *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
          <Input placeholder="Phone number *" value={form.phoneNumber} onChange={(e) => setForm((f) => ({ ...f, phoneNumber: e.target.value }))} />
          <Input type="email" placeholder="Email (optional)" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <Input placeholder="Gender *" value={form.gender} onChange={(e) => setForm((f) => ({ ...f, gender: e.target.value }))} />
          <Input type="date" placeholder="Birthday *" value={form.birthday} onChange={(e) => setForm((f) => ({ ...f, birthday: e.target.value }))} />
          <Input placeholder="Looking for (comma-separated)" value={form.lookingFor} onChange={(e) => setForm((f) => ({ ...f, lookingFor: e.target.value }))} />
          <textarea
            placeholder="About me (optional)"
            value={form.aboutMe}
            onChange={(e) => setForm((f) => ({ ...f, aboutMe: e.target.value }))}
            rows={3}
            className="w-full rounded-md border border-affecio-border bg-affecio-input px-3 py-2 text-sm text-affecio-text placeholder:text-affecio-muted focus:outline-none focus:ring-1 focus:ring-white/20"
          />
          {formError ? <ApiErrorMessage message={formError} /> : null}
          <DialogFooter>
            <AffecioButton type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </AffecioButton>
            <AffecioButton type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? "Creating…" : "Create user"}
            </AffecioButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
