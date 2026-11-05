"use client";

import { useEffect, useRef, useState } from "react";

interface ConfirmDialogProps {
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  description,
  confirmLabel,
  destructive = true,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const onCancelRef = useRef(onCancel);
  const workingRef = useRef(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState(false);
  onCancelRef.current = onCancel;

  useEffect(() => {
    cancelRef.current?.focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !workingRef.current) onCancelRef.current();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function confirm() {
    if (working) return;
    workingRef.current = true;
    setWorking(true);
    try {
      await onConfirm();
    } catch {
      setError(true);
    } finally {
      workingRef.current = false;
      setWorking(false);
    }
  }

  return (
    <div className="dashboard-dialog-backdrop" onMouseDown={event => {
      if (event.target === event.currentTarget && !working) onCancel();
    }}>
      <section className="dashboard-dialog" role="dialog" aria-modal="true" aria-labelledby="dashboard-dialog-title" aria-describedby="dashboard-dialog-description">
        <span className={`dashboard-dialog-mark${destructive ? " is-danger" : ""}`} aria-hidden="true">{destructive ? "!" : "✓"}</span>
        <h2 id="dashboard-dialog-title">{title}</h2>
        <p id="dashboard-dialog-description">{description}</p>
        {error && <p className="dashboard-dialog-error" role="alert">Une erreur est survenue. Vérifie ta connexion et réessaie.</p>}
        <div className="dashboard-dialog-actions">
          <button ref={cancelRef} type="button" className="dashboard-button dashboard-button-ghost" onClick={onCancel} disabled={working}>Retour</button>
          <button type="button" className={`dashboard-button${destructive ? " dashboard-dialog-confirm-danger" : " dashboard-dialog-confirm"}`} onClick={confirm} disabled={working}>
            {working ? "En cours…" : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
