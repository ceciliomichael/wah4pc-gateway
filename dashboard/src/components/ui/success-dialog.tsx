"use client";

import { LuCircleCheckBig } from "react-icons/lu";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface SuccessDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttonText?: string;
}

export function SuccessDialog({
  open,
  onClose,
  title,
  message,
  buttonText = "OK",
}: SuccessDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} size="sm">
      <DialogHeader onClose={onClose}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-green-100">
            <LuCircleCheckBig className="w-5 h-5 text-green-600" />
          </div>
          <DialogTitle>{title}</DialogTitle>
        </div>
      </DialogHeader>

      <DialogContent>
        <p className="text-slate-600">{message}</p>
      </DialogContent>

      <DialogFooter>
        <Button type="button" onClick={onClose}>
          {buttonText}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}
