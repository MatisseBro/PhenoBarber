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
    <div className="ad-dialog-backdrop" onMouseDown={event => {
      if (event.target === event.currentTarget && !working) onCancel();
    }}>
      <section className="ad-dialog" role="dialog" aria-modal="true" aria-labelledby="ad-dialog-title" aria-describedby="ad-dialog-description">
        <span className={`ad-dialog-mark${destructive ? " is-danger" : ""}`} aria-hidden="true">{destructive ? "!" : "✓"}</span>
        <h2 id="ad-dialog-title">{title}</h2>
        <p id="ad-dialog-description">{description}</p>
        {error && <p className="ad-dialog-error" role="alert">Une erreur est survenue. Vérifie ta connexion et réessaie.</p>}
        <div className="ad-dialog-actions">
          <button ref={cancelRef} type="button" className="ad-button ad-button-ghost" onClick={onCancel} disabled={working}>Retour</button>
          <button type="button" className={`ad-button${destructive ? " ad-dialog-confirm-danger" : " ad-dialog-confirm"}`} onClick={confirm} disabled={working}>
            {working ? "En cours…" : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
