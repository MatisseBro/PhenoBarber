"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from "next/link";
import { fmt, formatDate, whatsappLink } from "@/lib/utils";
import { FORMULE_LABELS } from "@/lib/constants";
import type { Reservation, StatusType, FormulaType } from "@/lib/types";
import type { RdvBooking, RdvStatus } from "@/lib/rdv-types";
import ScheduleManager from "@/components/ScheduleManager";
import ConfirmDialog from "@/components/ConfirmDialog";
import { buildCsv } from "@/lib/csv";

const STATUS_LABELS: Record<StatusType, string> = {
  pending: "En attente",
  confirmed: "Confirmé",
  cancelled: "Annulé",
};

function exportCSV(reservations: Reservation[]) {
  const headers = [
    "ID",
    "Date",
    "Nom",
    "Email",
    "Téléphone",
    "Formule",
    "Pack",
    "Début",
    "Fin",
    "Total TTC",
    "Acompte",
    "Statut",
    "Notes",
  ];
  const rows = reservations.map((r) => [
    r.id,
    new Date(r.createdAt).toLocaleDateString("fr-FR"),
    r.nom,
    r.email,
    r.telephone,
    r.formule,
    r.pack,
    r.dateDebut,
    r.dateFin ?? "",
    r.totalTTC.toFixed(2) + " €",
    r.acompte.toFixed(2) + " €",
    r.status,
    r.notes ?? "",
  ]);
  const csv = buildCsv([headers, ...rows]);
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pheno-reservations-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function StatusBadge({ status }: { status: StatusType }) {
  const icon = status === "pending" ? "⏳" : status === "confirmed" ? "✓" : "✕";
  return (
    <span className={`badge badge-${status}`}>
      {icon} {STATUS_LABELS[status]}
    </span>
  );
}

interface ReservationCardProps {
  reservation: Reservation;
  onStatusChange: (id: string, status: StatusType) => void;
}

function ReservationCard({
  reservation: r,
  onStatusChange,
}: ReservationCardProps) {
  const waMsg = `Bonjour ${r.nom}, votre réservation PHENO&CO du ${r.dateDebut} (${FORMULE_LABELS[r.formule]}) est ${r.status === "confirmed" ? "confirmée" : "en attente"}. Total : ${fmt(r.totalTTC)} - Acompte : ${fmt(r.acompte)}. Réf : ${r.id}`;

  return (
    <div className="res-card">
      <div className="res-head">
        <div>
          <div className="res-name">{r.nom}</div>
          <div className="res-contact">
            <a href={`mailto:${r.email}`}>{r.email}</a>
            {" · "}
            <a href={`tel:${r.telephone}`}>{r.telephone}</a>
          </div>
        </div>
        <StatusBadge status={r.status} />
      </div>

      <div className="res-details">
        <div>
          <div className="res-detail-label">Formule</div>
          <div className="res-detail-value">{FORMULE_LABELS[r.formule]}</div>
        </div>
        <div>
          <div className="res-detail-label">Pack</div>
          <div className="res-detail-value capitalize">{r.pack}</div>
        </div>
        <div>
          <div className="res-detail-label">Date</div>
          <div className="res-detail-value">
            {r.dateDebut}
            {r.dateFin ? ` → ${r.dateFin}` : ""}
            {r.heureDebut ? ` · ${r.heureDebut}–${r.heureFin}` : ""}
          </div>
        </div>
        <div>
          <div className="res-detail-label">Statut pro</div>
          <div className="res-detail-value capitalize">
            {r.statutPro.replace("-", " ")}
          </div>
        </div>
        <div>
          <div className="res-detail-label">Expérience</div>
          <div className="res-detail-value">{r.experience} ans</div>
        </div>
        <div>
          <div className="res-detail-label">Spécialités</div>
          <div className="res-detail-value">{r.specialites.join(", ")}</div>
        </div>
      </div>

      <div className="res-pricing">
        <div className="res-price-item">
          <div className="rp-label">HT</div>
          <div className="rp-value">{fmt(r.totalHT)}</div>
        </div>
        <div className="res-price-item">
          <div className="rp-label">TVA</div>
          <div className="rp-value">{fmt(r.tva)}</div>
        </div>
        <div className="res-price-item total">
          <div className="rp-label">Total TTC</div>
          <div className="rp-value">{fmt(r.totalTTC)}</div>
        </div>
        <div className="res-price-item deposit">
          <div className="rp-label">Acompte</div>
          <div className="rp-value">{fmt(r.acompte)}</div>
        </div>
        <div className="res-meta">
          Réf. {r.id}
          <br />
          {formatDate(r.createdAt)}
        </div>
      </div>

      {r.notes && (
        <div className="res-notes">
          <span className="res-detail-label">Notes</span>
          <p className="res-notes-text">{r.notes}</p>
        </div>
      )}

      <div className="res-actions">
        {r.status !== "confirmed" && (
          <button
            className="btn btn-success btn-sm"
            onClick={() => onStatusChange(r.id, "confirmed")}
          >
            ✓ Confirmer
          </button>
        )}
        {r.status !== "cancelled" && (
          <button
            className="btn btn-danger btn-sm"
            onClick={() => onStatusChange(r.id, "cancelled")}
          >
            ✕ Annuler
          </button>
        )}
        {r.status === "cancelled" && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => onStatusChange(r.id, "pending")}
          >
            ↩ Remettre en attente
          </button>
        )}
        <a
          href={whatsappLink(r.telephone, waMsg)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-wa btn-sm"
        >
          💬 WhatsApp
        </a>
      </div>
    </div>
  );
}

const RDV_STATUS_LABELS: Record<RdvStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmé",
  cancelled: "Annulé",
};

const CAT_LABELS: Record<string, string> = { homme: "Homme", femme: "Femme", enfant: "Enfant" };

type AdminTab = "rdv" | "clients" | "location" | "schedule";

interface AdminClient {
  id: string;
  nom: string;
  email: string | null;
  telephone: string | null;
  rdv_count: number;
  location_count: number;
  last_rdv_at?: string | null;
  created_at: string;
}

interface ClientImportResult {
  imported: number;
  updated: number;
  skipped: number;
  errors?: Array<{ line: number; message: string }>;
}

interface ClientImportError {
  message: string;
  details?: Array<{ line: number; message: string }>;
}

function DashboardIcon({ name }: { name: "agenda" | "clients" | "location" | "schedule" | "search" | "menu" | "download" | "home" | "logout" }) {
  const paths = {
    agenda: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" /></>,
    clients: <><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    location: <><path d="M6 21v-7M18 21v-7M4 10h16l-2-7H6l-2 7Z" /><path d="M5 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0M9 21v-5h6v5" /></>,
    schedule: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    download: <><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></>,
    home: <><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></>,
    logout: <><path d="M10 17l5-5-5-5M15 12H3" /><path d="M15 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4" /></>,
  };
  return <svg className="dashboard-icon" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>;
}

function fmtDur(m: number) {
  if (m <= 0) return "";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60), r = m % 60;
  return r > 0 ? `${h}h${r < 10 ? "0" : ""}${r}` : `${h}h`;
}

function exportRdvCSV(bookings: RdvBooking[]) {
  const headers = ["ID", "Date création", "Nom", "Email", "Téléphone", "Catégorie", "Prestation", "Dégradé", "Options", "Prix", "Durée", "Date RDV", "Heure", "Statut"];
  const rows = bookings.map(b => [
    b.id,
    new Date(b.createdAt).toLocaleDateString("fr-FR"),
    b.nom, b.email, b.telephone,
    CAT_LABELS[b.categorie] ?? b.categorie,
    b.prestationLabel,
    b.degradeLabel ?? "",
    b.optionsLabels.join(", "),
    b.totalPrice > 0 ? `${b.totalPrice} €` : "Sur devis",
    fmtDur(b.totalDuration),
    b.date, b.slot, b.status,
  ]);
  const csv = buildCsv([headers, ...rows]);
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `pheno-rdv-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

interface RdvCardProps {
  booking: RdvBooking;
  onStatusChange: (id: string, status: RdvStatus) => void;
}

function RdvBookingCard({ booking: b, onStatusChange }: RdvCardProps) {
  const icon = b.status === "pending" ? "⏳" : b.status === "confirmed" ? "✓" : "✕";
  const waMsg = `Bonjour ${b.nom}, votre RDV PHENO&CO du ${b.date} à ${b.slot} (${b.prestationLabel}) est ${b.status === "confirmed" ? "confirmé" : "en attente"}.`;
  return (
    <div className="res-card">
      <div className="res-head">
        <div>
          <div className="res-name">{b.nom}</div>
          <div className="res-contact">
            <a href={`mailto:${b.email}`}>{b.email}</a>
            {" · "}
            <a href={`tel:${b.telephone}`}>{b.telephone}</a>
          </div>
        </div>
        <span className={`badge badge-${b.status}`}>{icon} {RDV_STATUS_LABELS[b.status]}</span>
      </div>

      <div className="res-details">
        <div>
          <div className="res-detail-label">Date & heure</div>
          <div className="res-detail-value">{b.date} à {b.slot}</div>
        </div>
        <div>
          <div className="res-detail-label">Profil</div>
          <div className="res-detail-value">{CAT_LABELS[b.categorie] ?? b.categorie}</div>
        </div>
        <div>
          <div className="res-detail-label">Prestation</div>
          <div className="res-detail-value">{b.prestationLabel}</div>
        </div>
        {b.degradeLabel && (
          <div>
            <div className="res-detail-label">Type dégradé</div>
            <div className="res-detail-value">{b.degradeLabel}</div>
          </div>
        )}
        {b.optionsLabels.length > 0 && (
          <div>
            <div className="res-detail-label">Options</div>
            <div className="res-detail-value">{b.optionsLabels.join(", ")}</div>
          </div>
        )}
        <div>
          <div className="res-detail-label">Durée estimée</div>
          <div className="res-detail-value">{fmtDur(b.totalDuration) || "Sur devis"}</div>
        </div>
      </div>

      <div className="res-pricing">
        <div className="res-price-item total">
          <div className="rp-label">Prix estimé</div>
          <div className="rp-value">{b.totalPrice > 0 ? `${b.totalPrice} €` : "Sur devis"}</div>
        </div>
        <div className="res-meta">
          Réf. {b.id.slice(0, 8)}…<br />
          {formatDate(b.createdAt)}
        </div>
      </div>

      <div className="res-actions">
        {b.status !== "confirmed" && (
          <button className="btn btn-success btn-sm" onClick={() => onStatusChange(b.id, "confirmed")}>✓ Confirmer</button>
        )}
        {b.status !== "cancelled" && (
          <button className="btn btn-danger btn-sm" onClick={() => onStatusChange(b.id, "cancelled")}>✕ Annuler</button>
        )}
        {b.status === "cancelled" && (
          <button className="btn btn-ghost btn-sm" onClick={() => onStatusChange(b.id, "pending")}>↩ Remettre</button>
        )}
        <a href={whatsappLink(b.telephone, waMsg)} target="_blank" rel="noopener noreferrer" className="btn btn-wa btn-sm">
          💬 WhatsApp
        </a>
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [adminToday, setAdminToday] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [pwd, setPwd] = useState("");
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>("rdv");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [rdvBookings, setRdvBookings] = useState<RdvBooking[]>([]);
  const [clients, setClients] = useState<AdminClient[]>([]);
  const [clientTotal, setClientTotal] = useState(0);
  const [clientPage, setClientPage] = useState(0);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientActivity, setClientActivity] = useState<"all" | "rdv" | "location" | "inactive">("all");
  const [clientSort, setClientSort] = useState<"recent" | "name" | "rdv">("recent");
  const [importingClients, setImportingClients] = useState(false);
  const [clientImportResult, setClientImportResult] = useState<ClientImportResult | null>(null);
  const [clientImportError, setClientImportError] = useState<ClientImportError | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const [filterStatus, setFilterStatus] = useState<StatusType | "all">("all");
  const [filterFormule, setFilterFormule] = useState<FormulaType | "all">("all");
  const [rdvFilterStatus, setRdvFilterStatus] = useState<RdvStatus | "all">("all");
  const [rdvDateFilter, setRdvDateFilter] = useState<"all" | "today" | "tomorrow" | "upcoming">("all");
  const [rdvPage, setRdvPage] = useState(0);
  const [locPage, setLocPage] = useState(0);
  const [cancelTarget, setCancelTarget] = useState<{ kind: "rdv" | "location"; id: string } | null>(null);
  const PER_PAGE = 10;
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "error";
  } | null>(null);

  const loadReservations = useCallback(async () => {
    const res = await fetch("/api/reservations");
    if (res.ok) setReservations(await res.json());
  }, []);

  const loadRdvBookings = useCallback(async () => {
    const res = await fetch("/api/rdv");
    if (res.ok) setRdvBookings(await res.json());
  }, []);

  const loadClients = useCallback(async (q = "", page = 0, activity = "all", sort = "recent") => {
    setClientsLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), activity, sort });
      if (q.trim().length >= 2) params.set("q", q.trim());
      const res = await fetch(`/api/admin/clients?${params}`);
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients ?? []);
        setClientTotal(data.total ?? 0);
      }
    } finally {
      setClientsLoading(false);
    }
  }, []);

  async function importClientsCsv(file: File) {
    if (!file.name.toLowerCase().endsWith(".csv")) {
      const message = "Sélectionnez un fichier au format CSV.";
      setClientImportError({ message }); showToast(message, "error"); return;
    }
    if (file.size > 1_000_000) {
      const message = "Le fichier dépasse la limite de 1 Mo.";
      setClientImportError({ message }); showToast(message, "error"); return;
    }
    setImportingClients(true);
    setClientImportResult(null);
    setClientImportError(null);
    try {
      const bytes = await file.arrayBuffer();
      let csvText = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
      if (csvText.includes("�")) csvText = new TextDecoder("windows-1252").decode(bytes);
      const response = await fetch("/api/admin/clients", {
        method: "POST",
        headers: { "Content-Type": "text/csv; charset=utf-8" },
        body: csvText,
      });
      const result = await response.json().catch(() => ({ error: "Réponse du serveur illisible." }));
      if (!response.ok) {
        setClientImportError({ message: result.error || "Import impossible.", details: result.errors });
        throw new Error(result.error || "Import impossible.");
      }
      setClientImportResult(result);
      setClientPage(0);
      await loadClients(searchQuery, 0, clientActivity, clientSort);
      showToast(`${result.imported} client(s) ajouté(s), ${result.updated} mis à jour`, "success");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Import CSV impossible.";
      setClientImportError(current => current ?? { message });
      showToast(message, "error");
    } finally {
      setImportingClients(false);
      if (csvInputRef.current) csvInputRef.current.value = "";
    }
  }

  useEffect(() => {
    setAdminToday(new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "Europe/Paris",
    }).format(new Date()));

    fetch("/api/admin/check").then((r) => {
      if (r.ok) {
        setLoggedIn(true);
        loadReservations();
        loadRdvBookings();
      }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [loadReservations, loadRdvBookings]);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    setPwdError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: pwd }),
      });
      if (res.ok) {
        setLoggedIn(true);
        loadReservations();
        loadRdvBookings();
      } else {
        const data = await res.json().catch(() => ({}));
        if (res.status === 429) {
          setPwdError(data.error ?? "Trop de tentatives. Réessayez plus tard.");
        } else if (res.status === 503) {
          setPwdError("Service indisponible. Vérifiez la configuration serveur.");
        } else {
          setPwdError("Mot de passe incorrect");
        }
        setPwd("");
      }
    } catch {
      setPwdError("Erreur réseau. Vérifiez votre connexion.");
      setPwd("");
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setLoggedIn(false);
    setReservations([]);
    setRdvBookings([]);
    setClients([]);
    setClientTotal(0);
  }

  async function changeStatus(id: string, status: StatusType) {
    const res = await fetch(`/api/reservations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) { showToast("Erreur lors de la mise à jour", "error"); return; }
    await loadReservations();
    const msg =
      status === "confirmed"
        ? "Réservation confirmée"
        : status === "cancelled"
          ? "Réservation annulée"
          : "Statut mis à jour";
    showToast(msg, "success");
  }

  async function changeRdvStatus(id: string, status: RdvStatus) {
    const res = await fetch(`/api/rdv/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) { showToast("Erreur lors de la mise à jour", "error"); return; }
    await loadRdvBookings();
    const msg = status === "confirmed" ? "RDV confirmé" : status === "cancelled" ? "RDV annulé" : "Statut mis à jour";
    showToast(msg, "success");
  }

  function requestReservationStatus(id: string, status: StatusType) {
    if (status === "cancelled") { setCancelTarget({ kind: "location", id }); return; }
    void changeStatus(id, status);
  }

  function requestRdvStatus(id: string, status: RdvStatus) {
    if (status === "cancelled") { setCancelTarget({ kind: "rdv", id }); return; }
    void changeRdvStatus(id, status);
  }

  async function confirmCancellation() {
    if (!cancelTarget) return;
    if (cancelTarget.kind === "rdv") await changeRdvStatus(cancelTarget.id, "cancelled");
    else await changeStatus(cancelTarget.id, "cancelled");
    setCancelTarget(null);
  }

  function showToast(msg: string, type: "success" | "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase("fr");
    return reservations
      .filter((r) => filterStatus === "all" || r.status === filterStatus)
      .filter((r) => filterFormule === "all" || r.formule === filterFormule)
      .filter((r) => !query || `${r.nom} ${r.email} ${r.telephone}`.toLocaleLowerCase("fr").includes(query));
  }, [reservations, filterStatus, filterFormule, searchQuery]);

  useEffect(() => { setLocPage(0); }, [filterStatus, filterFormule]);

  const filteredRdv = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const query = searchQuery.trim().toLocaleLowerCase("fr");
    return rdvBookings
      .filter(b => rdvFilterStatus === "all" || b.status === rdvFilterStatus)
      .filter(b => !query || `${b.nom} ${b.email} ${b.telephone} ${b.prestationLabel}`.toLocaleLowerCase("fr").includes(query))
      .filter(b => {
        if (rdvDateFilter === "today") return b.date === today;
        if (rdvDateFilter === "tomorrow") return b.date === tomorrow;
        if (rdvDateFilter === "upcoming") return b.date >= today;
        return true;
      })
      .sort((a, b) => a.date === b.date ? a.slot.localeCompare(b.slot) : a.date.localeCompare(b.date));
  }, [rdvBookings, rdvFilterStatus, rdvDateFilter, searchQuery]);

  useEffect(() => {
    if (!loggedIn || activeTab !== "clients") return;
    const timer = setTimeout(() => loadClients(searchQuery, clientPage, clientActivity, clientSort), 250);
    return () => clearTimeout(timer);
  }, [loggedIn, activeTab, searchQuery, clientPage, clientActivity, clientSort, loadClients]);

  useEffect(() => { setClientPage(0); }, [searchQuery, clientActivity, clientSort]);

  useEffect(() => { setRdvPage(0); }, [rdvFilterStatus, rdvDateFilter]);

  const rdvPageCount = Math.ceil(filteredRdv.length / PER_PAGE);
  const locPageCount = Math.ceil(filtered.length / PER_PAGE);
  const rdvVisible = filteredRdv.slice(rdvPage * PER_PAGE, (rdvPage + 1) * PER_PAGE);
  const locVisible = filtered.slice(locPage * PER_PAGE, (locPage + 1) * PER_PAGE);

  const rdvStats = useMemo(() => ({
    total: rdvBookings.length,
    pending: rdvBookings.filter(b => b.status === "pending").length,
    confirmed: rdvBookings.filter(b => b.status === "confirmed").length,
    cancelled: rdvBookings.filter(b => b.status === "cancelled").length,
  }), [rdvBookings]);

  const stats = useMemo(
    () => ({
      total: reservations.length,
      pending: reservations.filter((r) => r.status === "pending").length,
      confirmed: reservations.filter((r) => r.status === "confirmed").length,
      cancelled: reservations.filter((r) => r.status === "cancelled").length,
    }),
    [reservations],
  );

  if (loading) {
    return (
      <div className="admin-login">
        <span
          className="spinner"
          style={{ width: 32, height: 32, borderWidth: 3 }}
        />
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div className="admin-login">
        <div className="login-card">
          <h1>PHENO&CO</h1>
          <p>Espace administration - accès réservé</p>
          <form onSubmit={login}>
            <div className="form-group">
              <label className="form-label">Mot de passe</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPwd ? "text" : "password"}
                  className={`form-input${pwdError ? " error" : ""}`}
                  placeholder="Mot de passe"
                  value={pwd}
                  onChange={(e) => {
                    setPwd(e.target.value);
                    setPwdError(null);
                  }}
                  autoFocus
                  style={{ paddingRight: "2.8rem" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((v) => !v)}
                  style={{
                    position: "absolute",
                    right: "0.75rem",
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--muted)",
                    fontSize: "1rem",
                    padding: 0,
                    lineHeight: 1,
                  }}
                  aria-label={showPwd ? "Masquer" : "Afficher"}
                >
                  {showPwd ? "🙈" : "👁"}
                </button>
              </div>
              {pwdError && (
                <p className="form-error">⚠ {pwdError}</p>
              )}
            </div>
            <button
              type="submit"
              className="btn btn-primary btn-full login-submit"
            >
              Accéder au tableau de bord
            </button>
          </form>
          <div className="login-back">
            <Link href="/" className="back-link">
              ← Retour au formulaire
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const tabMeta: Record<AdminTab, { eyebrow: string; title: string; subtitle: string }> = {
    rdv: { eyebrow: "Agenda", title: "Rendez-vous coiffure", subtitle: "Pilotez les rendez-vous du salon et leur statut." },
    clients: { eyebrow: "Répertoire", title: "Clients", subtitle: "Retrouvez les coordonnées et l’historique de vos clients." },
    location: { eyebrow: "Fauteuils", title: "Demandes de location", subtitle: "Gérez les demandes des professionnels du salon." },
    schedule: { eyebrow: "Organisation", title: "Créneaux & horaires", subtitle: "Définissez les ouvertures, fermetures et indisponibilités." },
  };
  const currentMeta = tabMeta[activeTab];
  return (
    <main
      className="admin-dashboard"
      style={{
        '--dashboard-bg':      '#0c1525',
        '--dashboard-sidebar': '#0a1220',
        '--dashboard-surface': '#121f33',
        '--dashboard-raised':  '#192940',
        '--dashboard-line':    '#29384e',
        '--dashboard-gold':    '#ddbc75',
        '--dashboard-ink':     '#f3f5fa',
        '--dashboard-muted':   '#a6b3c5',
        '--dashboard-green':   '#a7d6c4',
        '--dashboard-red':     '#ffb5ac',
      } as React.CSSProperties}
    >
      {cancelTarget && (
        <ConfirmDialog
          title={cancelTarget.kind === "rdv" ? "Annuler ce rendez-vous ?" : "Annuler cette demande ?"}
          description={cancelTarget.kind === "rdv"
            ? "Le rendez-vous sera marqué comme annulé. Il restera visible dans l’agenda avec son historique."
            : "La demande de location sera marquée comme annulée. Elle restera visible dans l’administration avec son historique."}
          confirmLabel="Confirmer l’annulation"
          onConfirm={confirmCancellation}
          onCancel={() => setCancelTarget(null)}
        />
      )}
      <div className={`toast${toast ? ` show ${toast.type}` : ""}`}>
        <div className="toast-title">
          {toast?.type === "success" ? "✓" : "⚠"} {toast?.msg}
        </div>
      </div>

      <button className={`dashboard-scrim${sidebarOpen ? " is-open" : ""}`} aria-label="Fermer le menu" onClick={() => setSidebarOpen(false)} />
      <aside className={`dashboard-sidebar${sidebarOpen ? " is-open" : ""}`}>
        <Link href="/" className="dashboard-brand">
          <span className="dashboard-brand-mark">P<span>&amp;</span></span>
          <span><strong>PHENO&amp;CO</strong><small>Espace administrateur</small></span>
        </Link>
        <p className="dashboard-nav-title">Votre salon</p>
        <nav className="dashboard-nav" aria-label="Navigation du tableau de bord">
          {([
            { key: "rdv", label: "Agenda", icon: "agenda", count: rdvStats.total },
            { key: "clients", label: "Clients", icon: "clients", count: clientTotal || undefined },
            { key: "location", label: "Location fauteuil", icon: "location", count: stats.total },
            { key: "schedule", label: "Créneaux & horaires", icon: "schedule" },
          ] as { key: AdminTab; label: string; icon: "agenda" | "clients" | "location" | "schedule"; count?: number }[]).map(item => (
            <button
              key={item.key}
              className={`dashboard-nav-item${activeTab === item.key ? " is-active" : ""}`}
              onClick={() => { setActiveTab(item.key); setSidebarOpen(false); }}
              aria-current={activeTab === item.key ? "page" : undefined}
            >
              <DashboardIcon name={item.icon} />
              <span>{item.label}</span>
              {item.count !== undefined && <small>{item.count}</small>}
            </button>
          ))}
        </nav>
        <div className="dashboard-side-bottom">
          <Link href="/" className="dashboard-nav-item"><DashboardIcon name="home" /><span>Voir le site</span></Link>
          <button className="dashboard-profile" onClick={logout}>
            <span className="dashboard-avatar">P&amp;</span>
            <span><strong>PHENO&amp;CO</strong><small>Déconnexion</small></span>
            <DashboardIcon name="logout" />
          </button>
          <p className="dashboard-version">Dashboard connecté · v2</p>
        </div>
      </aside>

      <div className="dashboard-app">
        <header className="dashboard-topbar">
          <button className="dashboard-menu-button" onClick={() => setSidebarOpen(true)} aria-label="Ouvrir le menu"><DashboardIcon name="menu" /></button>
          <label className="dashboard-search">
            <DashboardIcon name="search" />
            <input aria-label="Rechercher dans les clients et réservations" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Rechercher un client, un téléphone…" />
          </label>
          <div className="dashboard-top-actions">
            <span className="dashboard-connection"><i /> Base connectée</span>
            {activeTab !== "schedule" && activeTab !== "clients" && (
              <button className="dashboard-button dashboard-button-ghost" onClick={() => activeTab === "rdv" ? exportRdvCSV(filteredRdv) : exportCSV(filtered)}>
                <DashboardIcon name="download" /> Exporter CSV
              </button>
            )}
          </div>
        </header>

        <div className="dashboard-content">
          <div className="dashboard-page-head">
            <div>
              <p className="dashboard-eyebrow">{currentMeta.eyebrow}</p>
              <h1>{currentMeta.title}</h1>
              <p className="dashboard-subtitle">{currentMeta.subtitle}</p>
            </div>
            <div className="dashboard-page-date"><span>Aujourd&apos;hui</span><strong>{adminToday}</strong></div>
          </div>

        {/* ── RDV COUPE TAB ── */}
        {activeTab === "rdv" && (
          <>
            <div className="stats-grid">
              {[
                { label: "Total", value: rdvStats.total, color: "var(--yellow)" },
                { label: "En attente", value: rdvStats.pending, color: "var(--yellow)" },
                { label: "Confirmés", value: rdvStats.confirmed, color: "var(--success)" },
                { label: "Annulés", value: rdvStats.cancelled, color: "var(--error)" },
              ].map(s => (
                <div key={s.label} className="stat-card">
                  <div className="stat-number" style={{ color: s.color }}>{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="filter-bar" style={{ flexDirection: "column", alignItems: "stretch", gap: ".65rem" }}>
              <div style={{ display: "flex", gap: ".4rem", flexWrap: "wrap" }}>
                {([
                  { key: "all",      label: "Tous" },
                  { key: "today",    label: "Aujourd'hui" },
                  { key: "tomorrow", label: "Demain" },
                  { key: "upcoming", label: "À venir" },
                ] as const).map(f => (
                  <button
                    key={f.key}
                    onClick={() => setRdvDateFilter(f.key)}
                    style={{
                      padding: ".3rem .8rem",
                      borderRadius: 99,
                      border: `1.5px solid ${rdvDateFilter === f.key ? "var(--yellow)" : "rgba(255,255,255,.12)"}`,
                      background: rdvDateFilter === f.key ? "rgba(253,224,71,.12)" : "transparent",
                      color: rdvDateFilter === f.key ? "var(--yellow)" : "rgba(255,255,255,.45)",
                      fontWeight: rdvDateFilter === f.key ? 700 : 400,
                      fontSize: ".8rem",
                      cursor: "pointer",
                      transition: "all .15s",
                      letterSpacing: ".02em",
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
                <select className="form-select filter-select" value={rdvFilterStatus} onChange={e => setRdvFilterStatus(e.target.value as RdvStatus | "all")}>
                  <option value="all">Tous les statuts</option>
                  <option value="pending">En attente</option>
                  <option value="confirmed">Confirmé</option>
                  <option value="cancelled">Annulé</option>
                </select>
                <span className="filter-count">{filteredRdv.length} résultat{filteredRdv.length !== 1 ? "s" : ""}</span>
              </div>
            </div>

            {filteredRdv.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <p>Aucun rendez-vous trouvé.</p>
              </div>
            ) : (
              <>
                <div className="res-list">
                  {rdvVisible.map(b => (
                    <RdvBookingCard key={b.id} booking={b} onStatusChange={requestRdvStatus} />
                  ))}
                </div>
                {rdvPageCount > 1 && (
                  <div className="pagination">
                    <button className="btn btn-ghost btn-sm" disabled={rdvPage === 0} onClick={() => setRdvPage(p => p - 1)}>← Précédent</button>
                    <span className="page-info">{rdvPage + 1} / {rdvPageCount}</span>
                    <button className="btn btn-ghost btn-sm" disabled={rdvPage >= rdvPageCount - 1} onClick={() => setRdvPage(p => p + 1)}>Suivant →</button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── CLIENTS TAB ── */}
        {activeTab === "clients" && (
          <section className="dashboard-panel">
            <div className="dashboard-panel-head">
              <div>
                <h2>Répertoire clients</h2>
                <p>{clientTotal} client{clientTotal !== 1 ? "s" : ""} enregistré{clientTotal !== 1 ? "s" : ""}</p>
              </div>
              <div className="dashboard-panel-actions">
                <span className="dashboard-panel-tag">Page {clientPage + 1}</span>
                <input
                  ref={csvInputRef}
                  className="dashboard-file-input"
                  type="file"
                  accept=".csv,text/csv"
                  onChange={event => { const file = event.target.files?.[0]; if (file) importClientsCsv(file); }}
                />
                <button className="dashboard-button dashboard-import-button" disabled={importingClients} onClick={() => csvInputRef.current?.click()}>
                  <DashboardIcon name="download" /> {importingClients ? "Import…" : "Importer un CSV"}
                </button>
              </div>
            </div>
            <div className="dashboard-client-tools">
              <div className="dashboard-filter-chips" role="group" aria-label="Filtrer les clients">
                {([
                  { key: "all", label: "Tous" },
                  { key: "rdv", label: "Avec RDV" },
                  { key: "location", label: "Avec location" },
                  { key: "inactive", label: "Inactifs 90 jours" },
                ] as const).map(filter => (
                  <button key={filter.key} className={clientActivity === filter.key ? "is-active" : ""} onClick={() => setClientActivity(filter.key)}>{filter.label}</button>
                ))}
              </div>
              <label className="dashboard-sort-label">Trier par
                <select value={clientSort} onChange={event => setClientSort(event.target.value as typeof clientSort)}>
                  <option value="recent">Dernière visite</option>
                  <option value="name">Nom A–Z</option>
                  <option value="rdv">Nombre de RDV</option>
                </select>
              </label>
            </div>
            <div className="dashboard-import-help">
              <strong>Format accepté :</strong> Nom complet (ou Prénom + Nom), Téléphone, Email. Colonnes facultatives : RDV, Locations, Dernier RDV. Maximum 1 000 lignes.
            </div>
            {clientImportResult && (
              <div className="dashboard-import-result">
                <strong>Import terminé</strong>
                <span>{clientImportResult.imported} ajouté{clientImportResult.imported !== 1 ? "s" : ""}</span>
                <span>{clientImportResult.updated} mis à jour</span>
                <span>{clientImportResult.skipped} ignoré{clientImportResult.skipped !== 1 ? "s" : ""}</span>
                {clientImportResult.errors?.length ? <small>Première erreur : ligne {clientImportResult.errors[0].line}, {clientImportResult.errors[0].message.toLowerCase()}.</small> : null}
              </div>
            )}
            {clientImportError && (
              <div className="dashboard-import-error" role="alert">
                <strong>Import impossible</strong>
                <p>{clientImportError.message}</p>
                {clientImportError.details?.length ? (
                  <small>Ligne {clientImportError.details[0].line} : {clientImportError.details[0].message}</small>
                ) : null}
                <button type="button" onClick={() => setClientImportError(null)} aria-label="Fermer le message">×</button>
              </div>
            )}
            {clientsLoading ? (
              <div className="dashboard-table-empty"><span className="spinner" /> Chargement des clients…</div>
            ) : clients.length === 0 ? (
              <div className="dashboard-table-empty">Aucun client trouvé.</div>
            ) : (
              <div className="dashboard-table-scroll">
                <table className="dashboard-client-table">
                  <thead><tr><th>Client</th><th>Contact</th><th>Rendez-vous</th><th>Locations</th><th>Dernière visite</th></tr></thead>
                  <tbody>
                    {clients.map(client => (
                      <tr key={client.id}>
                        <td><div className="dashboard-client-name"><span>{client.nom?.slice(0, 2).toUpperCase() || "CL"}</span><strong>{client.nom || "Client"}</strong></div></td>
                        <td>
                          {client.telephone ? <a href={`tel:${client.telephone}`}>{client.telephone}</a> : <span>-</span>}
                          <small>{client.email ? <a href={`mailto:${client.email}`}>{client.email}</a> : <span>-</span>}</small>
                        </td>
                        <td><strong>{client.rdv_count ?? 0}</strong></td>
                        <td><strong>{client.location_count ?? 0}</strong></td>
                        <td>{client.last_rdv_at ? new Date(client.last_rdv_at).toLocaleDateString("fr-FR") : "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {clientTotal > 30 && (
              <div className="pagination dashboard-client-pagination">
                <button className="dashboard-button dashboard-button-ghost" disabled={clientPage === 0} onClick={() => setClientPage(page => page - 1)}>← Précédent</button>
                <span className="page-info">{clientPage + 1} / {Math.ceil(clientTotal / 30)}</span>
                <button className="dashboard-button dashboard-button-ghost" disabled={(clientPage + 1) * 30 >= clientTotal} onClick={() => setClientPage(page => page + 1)}>Suivant →</button>
              </div>
            )}
          </section>
        )}

        {/* ── LOCATION FAUTEUIL TAB ── */}
        {activeTab === "location" && (
          <>
            <div className="stats-grid">
              {[
                { label: "Total", value: stats.total, color: "var(--yellow)" },
                { label: "En attente", value: stats.pending, color: "var(--yellow)" },
                { label: "Confirmées", value: stats.confirmed, color: "var(--success)" },
                { label: "Annulées", value: stats.cancelled, color: "var(--error)" },
              ].map(s => (
                <div key={s.label} className="stat-card">
                  <div className="stat-number" style={{ color: s.color }}>{s.value}</div>
                  <div className="stat-label">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="filter-bar">
              <select className="form-select filter-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value as StatusType | "all")}>
                <option value="all">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="confirmed">Confirmé</option>
                <option value="cancelled">Annulé</option>
              </select>
              <select className="form-select filter-select" value={filterFormule} onChange={e => setFilterFormule(e.target.value as FormulaType | "all")}>
                <option value="all">Toutes les formules</option>
                <option value="horaire">À l&apos;heure</option>
                <option value="demi-journee">Demi-journée</option>
                <option value="journee">Journée</option>
                <option value="semaine">Semaine</option>
                <option value="mois">Mensuel</option>
              </select>
              <span className="filter-count">{filtered.length} résultat{filtered.length !== 1 ? "s" : ""}</span>
            </div>

            {filtered.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <p>Aucune réservation trouvée.</p>
              </div>
            ) : (
              <>
                <div className="res-list">
                  {locVisible.map(r => (
                    <ReservationCard key={r.id} reservation={r} onStatusChange={requestReservationStatus} />
                  ))}
                </div>
                {locPageCount > 1 && (
                  <div className="pagination">
                    <button className="btn btn-ghost btn-sm" disabled={locPage === 0} onClick={() => setLocPage(p => p - 1)}>← Précédent</button>
                    <span className="page-info">{locPage + 1} / {locPageCount}</span>
                    <button className="btn btn-ghost btn-sm" disabled={locPage >= locPageCount - 1} onClick={() => setLocPage(p => p + 1)}>Suivant →</button>
                  </div>
                )}
              </>
            )}
          </>
        )}
        {/* ── CRÉNEAUX TAB ── */}
        {activeTab === "schedule" && <ScheduleManager />}

        </div>
      </div>
    </main>
  );
}
