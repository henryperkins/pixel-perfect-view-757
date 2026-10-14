import * as Primitive from "@radix-ui/react-alert-dialog";
import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogPortal,
  AlertDialogOverlay,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
export function JournalDeleteDialog({
  entry,
  open,
  pending,
  error,
  onConfirm,
  onCancel,
  onCloseAutoFocus,
}: {
  entry: { id: string; label: string } | null;
  open: boolean;
  pending: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  onCloseAutoFocus: (event: Event) => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    // Disabling the focused submit button otherwise leaves focus on the page.
    if (open && (pending || error)) cancelRef.current?.focus({ preventScroll: true });
  }, [open, pending, error]);

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <AlertDialogPortal>
        <AlertDialogOverlay className="journal-delete-overlay z-[80]" />
        <Primitive.Content className="journal-delete-dialog" onCloseAutoFocus={onCloseAutoFocus}>
          <div className="journal-delete-header">
            <AlertDialogTitle>Delete journal entry?</AlertDialogTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-11 w-11 shrink-0"
              aria-label="Close confirmation"
              onClick={onCancel}
            >
              <X aria-hidden="true" />
            </Button>
          </div>
          <div
            className="journal-delete-body"
            tabIndex={0}
            role="region"
            aria-label="Deletion details"
          >
            <AlertDialogDescription>
              This permanently deletes “{entry?.label}”.{" "}
              {pending
                ? "Deletion is in progress. Closing this confirmation will not cancel it."
                : "You can cancel to keep it."}
            </AlertDialogDescription>
            {error && (
              <p role="alert" className="mt-3 text-sm text-destructive">
                {error} You can try again or close this confirmation.
              </p>
            )}
          </div>
          <div className="journal-delete-actions">
            <AlertDialogCancel asChild>
              <Button ref={cancelRef} type="button" variant="outline" className="min-h-11">
                {pending ? "Close" : "Cancel"}
              </Button>
            </AlertDialogCancel>
            <Button
              type="button"
              variant="destructive"
              className="min-h-12"
              disabled={pending}
              onClick={onConfirm}
            >
              {pending ? "Deleting…" : "Delete entry"}
            </Button>
          </div>
        </Primitive.Content>
      </AlertDialogPortal>
    </AlertDialog>
  );
}
