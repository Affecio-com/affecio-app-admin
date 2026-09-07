"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AffecioButton } from "@/components/affecio/AffecioButton";

interface AffecioConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function AffecioConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  isLoading = false,
}: AffecioConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <AffecioButton variant="secondary" onClick={() => onOpenChange(false)}>
            {cancelLabel}
          </AffecioButton>
          <AffecioButton variant="primary" onClick={onConfirm} disabled={isLoading}>
            {confirmLabel}
          </AffecioButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
