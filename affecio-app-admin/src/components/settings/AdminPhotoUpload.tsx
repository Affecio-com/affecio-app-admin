"use client";

import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Camera, Trash2 } from "lucide-react";
import { AffecioButton } from "@/components/affecio/AffecioButton";
import { AdminAvatar } from "@/components/admin/AdminAvatar";
import { ApiErrorMessage } from "@/components/shared/ApiErrorMessage";
import { getApiErrorMessage } from "@/lib/api-error";
import { removeAdminPhoto, uploadAdminPhoto } from "@/services/adminAuth";
import { useAuth } from "@/providers/AuthProvider";
import type { AdminUser } from "@/types/admin";

const ACCEPT = "image/jpeg,image/png,image/webp";
const MAX_BYTES = 5 * 1024 * 1024;

function readFileAsBase64(file: File): Promise<{ contentType: string; dataBase64: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Could not read file"));
        return;
      }
      const comma = result.indexOf(",");
      const dataBase64 = comma >= 0 ? result.slice(comma + 1) : result;
      resolve({ contentType: file.type, dataBase64 });
    };
    reader.onerror = () => reject(new Error("Could not read file"));
    reader.readAsDataURL(file);
  });
}

export function AdminPhotoUpload({ admin }: { admin: AdminUser }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { updateAdmin } = useAuth();
  const [error, setError] = useState("");

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (file.size > MAX_BYTES) throw new Error("Photo must be under 5 MB");
      const payload = await readFileAsBase64(file);
      return uploadAdminPhoto(payload);
    },
    onSuccess: (updated) => {
      updateAdmin(updated);
      setError("");
    },
    onError: (err) => setError(getApiErrorMessage(err, "Failed to upload photo.")),
  });

  const removeMutation = useMutation({
    mutationFn: removeAdminPhoto,
    onSuccess: (updated) => {
      updateAdmin(updated);
      setError("");
    },
    onError: (err) => setError(getApiErrorMessage(err, "Failed to remove photo.")),
  });

  const busy = uploadMutation.isPending || removeMutation.isPending;

  return (
    <div className="mb-6 flex flex-col gap-4 border-b border-affecio-border pb-6 sm:flex-row sm:items-center">
      <AdminAvatar admin={admin} size="lg" />
      <div className="flex-1">
        <p className="text-sm font-medium text-affecio-text">Profile photo</p>
        <p className="mt-0.5 text-xs text-affecio-muted">
          Shown on tickets, escalations, audit logs, and team lists. JPEG, PNG, or WebP — max 5 MB.
        </p>
        {error ? (
          <div className="mt-2">
            <ApiErrorMessage message={error} />
          </div>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <AffecioButton
            variant="secondary"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            <Camera className="h-4 w-4" />
            {uploadMutation.isPending ? "Uploading…" : "Upload photo"}
          </AffecioButton>
          {admin.photoUrl ? (
            <AffecioButton variant="secondary" disabled={busy} onClick={() => removeMutation.mutate()}>
              <Trash2 className="h-4 w-4" />
              Remove
            </AffecioButton>
          ) : null}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) uploadMutation.mutate(file);
          }}
        />
      </div>
    </div>
  );
}
