"use client";

import { LuTriangleAlert } from "react-icons/lu";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DeleteConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting: boolean;
  title: string;
  message: string;
}

export function DeleteConfirmDialog({
  open,
  onClose,
  onConfirm,
  isDeleting,
  title,
  message,
}: DeleteConfirmDialogProps) {
  const handleClose = () => {
    if (!isDeleting) {
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} size="sm">
      <DialogHeader onClose={handleClose} showCloseButton={!isDeleting}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-red-100">
            <LuTriangleAlert className="w-5 h-5 text-red-600" />
          </div>
          <DialogTitle>{title}</DialogTitle>
        </div>
      </DialogHeader>

      <DialogContent>
        <p className="text-slate-600">{message}</p>
      </DialogContent>

      <DialogFooter>
        <Button
          type="button"
          variant="secondary"
          onClick={handleClose}
          disabled={isDeleting}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={onConfirm}
          isLoading={isDeleting}
        >
          Delete
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
