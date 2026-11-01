<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PHENO&CO - Location de Fauteuil | Barbershop Montpellier</title>
  <meta name="description" content="Réservez votre fauteuil chez PHENO&CO, barbershop à Montpellier depuis 2009. Location courte ou longue durée pour coiffeurs et barbiers indépendants.">
  
  <meta property="og:title" content="PHENO&CO - Location de Fauteuil">
  <meta property="og:description" content="Réservez votre fauteuil chez PHENO&CO, barbershop à Montpellier depuis 2009.">
  <meta property="og:type" content="website">
  
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@700&display=swap" rel="stylesheet">
  
  <script src="https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  
  <style>
    :root {
      --primary: #F9C800;
      --primary-hover: #e0b400;
      --background: #0a0a0a;
      --card: #111111;
      --card-border: #222222;
      --foreground: #ffffff;
      --muted: #888888;
      --input-bg: #1a1a1a;
      --border: #333333;
      --success: #22c55e;
      --warning: #eab308;
      --danger: #ef4444;
    }
    
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      font-family: 'DM Sans', sans-serif;
      background-color: var(--background);
      color: var(--foreground);
      line-height: 1.6;
    }
    
    .font-serif { font-family: 'Playfair Display', serif; }
    
    .page-section { display: none; }
    .page-section.active { display: block; }
    
    .hero {
      background-color: #000;
      color: #fff;
      padding: 3rem 1rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    
    .hero-content { max-width: 56rem; width: 100%; }
    
    .logo {
      width: 18rem;
      height: auto;
      margin-top: 0;
      margin-bottom: 1rem;
      opacity: 0.9;
      transition: opacity 0.3s;
      display: block;
      margin-left: auto;
      margin-right: auto;
    }
    
    .logo:hover { opacity: 1; }
    
    .hero h1 {
      font-size: 2.5rem;
      font-weight: 700;
      color: var(--primary);
      text-transform: uppercase;
      letter-spacing: -0.02em;
      margin-top: 0;
    }
    
    .hero .subtitle {
      font-size: 0.875rem;
      text-transform: uppercase;
      letter-spacing: 0.2em;
      font-weight: 500;
      margin-top: 0.25rem;
    }
    
    .hero-buttons {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1rem;
      width: 100%;
      max-width: 48rem;
      margin: 2rem auto 0;
    }
    
    @media (min-width: 768px) {
      .hero-buttons { grid-template-columns: repeat(3, 1fr); }
      .hero h1 { font-size: 3rem; }
    }
    
    .btn {
      width: 100%;
      padding: 1rem 1.5rem;
      font-weight: 700;
      border-radius: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      text-decoration: none;
      transition: all 0.2s;
      border: none;
      cursor: pointer;
      font-size: 1rem;
    }
    
    .btn:hover { transform: translateY(-2px); }
    .btn:active { transform: translateY(0); }
    
    .btn-primary { background-color: var(--primary); color: #000; }
    .btn-primary:hover { background-color: var(--primary-hover); }
    
    .btn-secondary { background-color: #111827; color: #fff; border: 1px solid #374151; }
    .btn-secondary:hover { background-color: #1f2937; }
    
    .btn-whatsapp { background-color: #25D366; color: #fff; }
    .btn-whatsapp:hover { background-color: #20bd5a; }
    
    .btn-outline { background: transparent; border: 1px solid var(--border); color: var(--foreground); }
    .btn-outline:hover { background-color: rgba(255,255,255,0.05); }
    
    .reservation-section { padding: 3rem 1rem; }
    
    .container { max-width: 72rem; margin: 0 auto; }
    .container-sm { max-width: 900px; margin: 0 auto; padding: 3rem 1.5rem; }
    
    .section-header { text-align: center; margin-bottom: 2.5rem; }
    .section-header h2 { font-size: 1.875rem; font-weight: 700; color: var(--primary); margin-bottom: 1rem; }
    .section-header p { color: var(--muted); max-width: 42rem; margin: 0 auto; }
    
    .form-grid { display: grid; grid-template-columns: 1fr; gap: 2rem; }
    @media (min-width: 1024px) { .form-grid { grid-template-columns: 7fr 5fr; } }
    
    .card {
      background-color: var(--card);
      border: 1px solid var(--card-border);
      border-radius: 1rem;
      padding: 1.5rem;
      box-shadow: 0 10px 40px rgba(0,0,0,0.3);
      margin-bottom: 2rem;
    }
    
    @media (min-width: 768px) { .card { padding: 2rem; } }
    
    .card-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    
    .card-header svg { width: 1.5rem; height: 1.5rem; color: var(--primary); }
    .card-header h3 { font-size: 1.25rem; font-weight: 600; }
    
    .form-group { margin-bottom: 1.5rem; }
    .form-label { display: block; font-size: 0.875rem; font-weight: 500; color: var(--muted); margin-bottom: 0.5rem; }
    
    .form-input, .form-select, .form-textarea {
      width: 100%;
      background-color: var(--input-bg);
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      padding: 0.75rem 1rem;
      color: var(--foreground);
      font-size: 1rem;
      font-family: inherit;
      transition: all 0.2s;
    }
    
    .form-input:focus, .form-select:focus, .form-textarea:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 0 2px rgba(249, 200, 0, 0.2);
    }
    
    .form-select {
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23888888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 0.75rem center;
      background-size: 1rem;
      padding-right: 2.5rem;
    }
    
    .form-textarea { min-height: 100px; resize: vertical; }
    .form-input:disabled, .form-select:disabled { opacity: 0.5; cursor: not-allowed; }
    
    .form-row { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
    @media (min-width: 768px) { .form-row { grid-template-columns: 1fr 1fr; } }
    
    .radio-cards { display: grid; grid-template-columns: 1fr; gap: 1rem; }
    @media (min-width: 640px) { .radio-cards { grid-template-columns: 1fr 1fr; } }
    
    .radio-card {
      position: relative;
      cursor: pointer;
      border-radius: 0.75rem;
      border: 1px solid var(--border);
      padding: 1rem;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      transition: all 0.2s;
      background-color: var(--input-bg);
    }
    
    .radio-card:hover { border-color: rgba(249, 200, 0, 0.3); }
    
    .radio-card.selected {
      background-color: rgba(249, 200, 0, 0.1);
      border-color: rgba(249, 200, 0, 0.5);
      box-shadow: 0 0 0 1px rgba(249, 200, 0, 0.2);
    }
    
    .radio-card input[type="radio"] { margin-top: 0.25rem; accent-color: var(--primary); width: 1rem; height: 1rem; }
    .radio-card-content span { display: block; }
    .radio-card-content .title { font-weight: 600; }
    .radio-card-content .desc { font-size: 0.75rem; color: var(--muted); margin-top: 0.25rem; line-height: 1.4; }
    
    .info-box {
      background-color: rgba(255,255,255,0.05);
      border: 1px solid var(--border);
      border-radius: 0.5rem;
      padding: 1rem;
      font-size: 0.875rem;
      color: var(--muted);
    }
    
    .info-box p { margin-bottom: 0.5rem; }
    .info-box p:last-child { margin-bottom: 0; }
    .info-box strong { color: var(--foreground); }
    
    .warning-box {
      background-color: rgba(234, 179, 8, 0.1);
      border: 1px solid rgba(234, 179, 8, 0.2);
      border-radius: 0.5rem;
      padding: 1rem;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      color: #eab308;
      font-size: 0.875rem;
    }
    
    .warning-box svg { width: 1.25rem; height: 1.25rem; flex-shrink: 0; margin-top: 0.125rem; }
    
    .divider { border-top: 1px solid rgba(255,255,255,0.1); margin: 2rem 0; }
    
    .radio-group { display: flex; flex-wrap: wrap; gap: 1rem; }
    .radio-item { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
    .radio-item input[type="radio"] { accent-color: var(--primary); width: 1rem; height: 1rem; }
    .radio-item span { font-size: 0.875rem; }
    
    .checkbox-group { display: flex; flex-direction: column; gap: 0.5rem; }
    
    .checkbox-item {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 0.5rem;
      transition: background-color 0.2s;
    }
    
    .checkbox-item:hover { background-color: rgba(255,255,255,0.05); }
    .checkbox-item input[type="checkbox"] { accent-color: var(--primary); width: 1rem; height: 1rem; margin-top: 0.125rem; }
    .checkbox-item span { font-size: 0.875rem; }
    
    .engagement-box {
      background-color: rgba(249, 200, 0, 0.05);
      border: 1px solid rgba(249, 200, 0, 0.1);
      border-radius: 0.75rem;
      padding: 1rem;
    }
    
    .engagement-box h4 {
      font-size: 1rem;
      font-weight: 600;
      color: var(--primary);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }
    
    .engagement-box h4 svg { width: 1rem; height: 1rem; }
    .engagement-box .checkbox-item { padding: 0.25rem 0; }
    .engagement-box a { color: var(--primary); text-decoration: underline; }
    .engagement-box a:hover { opacity: 0.8; }
    
    .summary { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1.5rem; margin-top: 2rem; }
    .summary h4 { font-size: 1.125rem; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; margin-bottom: 1rem; }
    .summary h4 svg { width: 1.25rem; height: 1.25rem; color: var(--primary); }
    
    .summary-row { display: flex; justify-content: space-between; font-size: 0.875rem; margin-bottom: 0.5rem; }
    .summary-row .label { color: var(--muted); }
    .summary-row .value { font-weight: 500; text-align: right; }
    
    .summary-divider { border-top: 1px solid rgba(255,255,255,0.1); margin: 0.75rem 0; }
    .summary-total { display: flex; justify-content: space-between; font-size: 1.125rem; font-weight: 700; color: var(--primary); padding-top: 0.5rem; }
    
    .summary-deposit { background-color: rgba(249, 200, 0, 0.1); border-radius: 0.5rem; padding: 0.75rem; margin-top: 1rem; }
    .summary-deposit .row { display: flex; justify-content: space-between; font-size: 0.875rem; }
    .summary-deposit .deposit { font-weight: 500; color: #22c55e; }
    .summary-deposit .remaining { font-size: 0.75rem; color: var(--muted); margin-top: 0.25rem; }
    
    .submit-btn {
      width: 100%;
      padding: 1rem 1.5rem;
      border-radius: 0.75rem;
      font-weight: 700;
      font-size: 1.125rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.2s;
      border: none;
      cursor: pointer;
      margin-top: 1.5rem;
      background-color: var(--primary);
      color: #000;
    }
    
    .submit-btn:hover:not(:disabled) { background-color: var(--primary-hover); transform: translateY(-2px); }
    .submit-btn:active:not(:disabled) { transform: translateY(0); }
    .submit-btn:disabled { background-color: #333; color: #666; cursor: not-allowed; }
    .submit-btn svg { width: 1.25rem; height: 1.25rem; }
    
    .success-message {
      margin-top: 1.5rem;
      padding: 1rem;
      background-color: rgba(34, 197, 94, 0.1);
      border: 1px solid rgba(34, 197, 94, 0.3);
      border-radius: 0.75rem;
      display: none;
    }
    
    .success-message.show { display: block; animation: slideIn 0.3s ease-out; }
    
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .success-message h4 { font-weight: 700; color: #22c55e; font-size: 1.125rem; display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; }
    .success-message h4 svg { width: 1.25rem; height: 1.25rem; }
    .success-message p { font-size: 0.875rem; color: #d1d5db; }
    .success-message .warning { font-size: 0.75rem; color: #eab308; margin-top: 0.5rem; display: flex; align-items: center; gap: 0.5rem; }
    .success-message .warning svg { width: 0.75rem; height: 0.75rem; }
    
    .about-section { margin-top: 3rem; }
    .about-section .card-header span { font-size: 1.5rem; }
    .about-section p { color: var(--muted); margin-bottom: 1rem; line-height: 1.7; }
    .about-section p:first-of-type { font-weight: 500; color: var(--foreground); }
    .about-section p:last-child { color: var(--primary); font-weight: 700; padding-top: 0.5rem; margin-bottom: 0; }
    
    .footer {
      background-color: #000;
      padding: 2rem;
      border-top: 1px solid rgba(255,255,255,0.1);
      text-align: center;
      color: var(--muted);
      font-size: 0.875rem;
    }
    
    .footer a { color: var(--muted); text-decoration: none; transition: color 0.2s; }
    .footer a:hover { color: var(--primary); }
    .footer .admin-link { display: block; margin-top: 1rem; font-size: 0.75rem; opacity: 0.2; }
    .footer .admin-link:hover { opacity: 1; }
    
    @media (min-width: 1024px) { .sticky-card { position: sticky; top: 2rem; } }
    
    input[type="date"]::-webkit-calendar-picker-indicator {
      background-color: var(--primary);
      padding: 0.25rem;
      border-radius: 0.25rem;
      cursor: pointer;
    }
    
    .section-title { display: flex; align-items: center; gap: 0.5rem; font-size: 1rem; font-weight: 600; color: var(--primary); margin-bottom: 1rem; }
    .section-title svg { width: 1rem; height: 1rem; }
    
    .toast {
      position: fixed;
      bottom: 2rem;
      right: 2rem;
      background-color: #1f2937;
      border: 1px solid #374151;
      border-radius: 0.5rem;
      padding: 1rem 1.5rem;
      box-shadow: 0 10px 40px rgba(0,0,0,0.5);
      z-index: 1000;
      display: none;
      max-width: 24rem;
    }
    
    .toast.show { display: block; animation: slideIn 0.3s ease-out; }
    .toast.error { border-color: rgba(239, 68, 68, 0.5); }
    .toast h4 { font-weight: 600; margin-bottom: 0.25rem; }
    .toast p { font-size: 0.875rem; color: var(--muted); }
    .toast.error h4 { color: #ef4444; }
    
    /* Admin Styles */
    .admin-header {
      background-color: #000;
      padding: 2rem;
      text-align: center;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    
    .admin-header h1 { font-size: 2rem; color: var(--primary); margin-bottom: 0.5rem; }
    .admin-header p { color: var(--muted); font-size: 0.875rem; }
    
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--primary);
      text-decoration: none;
      font-weight: 500;
      margin-bottom: 1rem;
      transition: opacity 0.2s;
    }
    
    .back-link:hover { opacity: 0.8; }
    
    .admin-container { max-width: 1200px; margin: 0 auto; padding: 2rem 1rem; }
    
    .login-card {
      max-width: 400px;
      margin: 4rem auto;
      background-color: var(--card);
      border: 1px solid var(--card-border);
      border-radius: 1rem;
      padding: 2rem;
      text-align: center;
    }
    
    .login-card h2 { color: var(--primary); margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; }
    .login-card h2 svg { width: 1.5rem; height: 1.5rem; }
    
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
    
    .stat-card {
      background-color: var(--card);
      border: 1px solid var(--card-border);
      border-radius: 0.75rem;
      padding: 1.5rem;
      text-align: center;
    }
    
    .stat-card .number { font-size: 2rem; font-weight: 700; color: var(--primary); }
    .stat-card .label { font-size: 0.875rem; color: var(--muted); margin-top: 0.25rem; }
    
    .filter-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.5rem;
      padding: 1rem;
      background-color: var(--card);
      border: 1px solid var(--card-border);
      border-radius: 0.75rem;
    }
    
    .filter-bar select { flex: 1; min-width: 150px; }
    
    .reservations-list { display: flex; flex-direction: column; gap: 1rem; }
    
    .reservation-card {
      background-color: var(--card);
      border: 1px solid var(--card-border);
      border-radius: 0.75rem;
      padding: 1.5rem;
      transition: border-color 0.2s;
    }
    
    .reservation-card:hover { border-color: rgba(249, 200, 0, 0.3); }
    
    .reservation-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem; }
    .reservation-client h3 { font-size: 1.125rem; font-weight: 600; }
    .reservation-client p { font-size: 0.875rem; color: var(--muted); }
    
    .status-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .status-pending { background-color: rgba(234, 179, 8, 0.2); color: #eab308; }
    .status-confirmed { background-color: rgba(34, 197, 94, 0.2); color: #22c55e; }
    .status-cancelled { background-color: rgba(239, 68, 68, 0.2); color: #ef4444; }
    
    .reservation-details { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem; padding: 1rem; background-color: rgba(255,255,255,0.02); border-radius: 0.5rem; }
    .reservation-details .detail-item { font-size: 0.875rem; }
    .reservation-details .detail-label { color: var(--muted); }
    .reservation-details .detail-value { font-weight: 500; }
    
    .reservation-actions { display: flex; flex-wrap: wrap; gap: 0.5rem; padding-top: 1rem; border-top: 1px solid var(--border); }
    
    .action-btn {
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.875rem;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 0.375rem;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }
    
    .action-btn svg { width: 1rem; height: 1rem; }
    .action-btn.confirm { background-color: rgba(34, 197, 94, 0.2); color: #22c55e; }
    .action-btn.confirm:hover { background-color: rgba(34, 197, 94, 0.3); }
    .action-btn.cancel { background-color: rgba(234, 179, 8, 0.2); color: #eab308; }
    .action-btn.cancel:hover { background-color: rgba(234, 179, 8, 0.3); }
    .action-btn.delete { background-color: rgba(239, 68, 68, 0.2); color: #ef4444; }
    .action-btn.delete:hover { background-color: rgba(239, 68, 68, 0.3); }
    .action-btn.whatsapp { background-color: rgba(37, 211, 102, 0.2); color: #25D366; }
    .action-btn.whatsapp:hover { background-color: rgba(37, 211, 102, 0.3); }
    
    .empty-state { text-align: center; padding: 4rem 2rem; color: var(--muted); }
    .empty-state svg { width: 4rem; height: 4rem; opacity: 0.3; margin-bottom: 1rem; }
    
    /* CGV Styles */
    .cgv-container { max-width: 900px; margin: 0 auto; padding: 3rem 1.5rem; }
    
    .cgv-card {
      background-color: var(--card);
      border: 1px solid var(--card-border);
      border-radius: 1rem;
      padding: 2rem;
      margin-bottom: 2rem;
    }
    
    .cgv-card h2 {
      color: var(--primary);
      font-size: 1.5rem;
      margin-bottom: 1.5rem;
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--border);
    }
    
    .cgv-card h3 { color: var(--foreground); font-size: 1.125rem; margin-top: 1.5rem; margin-bottom: 0.75rem; }
    .cgv-card p { color: var(--muted); margin-bottom: 1rem; line-height: 1.8; }
    .cgv-card ul, .cgv-card ol { color: var(--muted); margin-bottom: 1rem; padding-left: 1.5rem; }
    .cgv-card li { margin-bottom: 0.5rem; }
    .cgv-card strong { color: var(--foreground); }
    
    .highlight {
      background-color: rgba(249, 200, 0, 0.1);
      border-left: 3px solid var(--primary);
      padding: 1rem 1.5rem;
      margin: 1.5rem 0;
      border-radius: 0 0.5rem 0.5rem 0;
    }
    
    .highlight p { margin-bottom: 0; color: var(--foreground); }
    
    .cgv-card table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; }
    .cgv-card th, .cgv-card td { padding: 0.75rem 1rem; text-align: left; border: 1px solid var(--border); }
    .cgv-card th { background-color: rgba(249, 200, 0, 0.1); color: var(--primary); font-weight: 600; }
    .cgv-card td { color: var(--muted); }
  </style>
</head>
<body>

<!-- ==================== PAGE RESERVATION ==================== -->
<div id="page-reservation" class="page-section active">
  
  <section class="hero">
    <div class="hero-content">
      <img src="logo.png" alt="PHENO&CO Logo" class="logo" id="logo">
      
      <div>
        <h1 class="font-serif">PHENO&CO</h1>
        <p class="subtitle">BARBERSHOP DEPUIS 2009</p>
      </div>
      
      <div class="hero-buttons">
        <button onclick="scrollToReservation()" class="btn btn-primary">
          <i data-lucide="calendar"></i>
          Louer un Fauteuil
        </button>
        
        <a href="https://phenoandco.com/" target="_blank" rel="noopener noreferrer" class="btn btn-secondary">
          <i data-lucide="scissors"></i>
          Prendre RDV Coiffure
        </a>
        
        <a href="https://wa.me/message/MZYDVEN32I55L1" target="_blank" rel="noopener noreferrer" class="btn btn-whatsapp">
          <i data-lucide="message-circle"></i>
          Contact WhatsApp
        </a>
      </div>
    </div>
  </section>
  
  <section id="reservation" class="reservation-section">
    <div class="container">
      
      <header class="section-header">
        <h2 class="font-serif">Réserver un fauteuil</h2>
        <p>Choisissez vos dates, votre formule et vos options.<br>Vous recevrez un récapitulatif et la réservation sera confirmée après paiement de l'acompte.</p>
      </header>
      
      <form id="reservationForm" class="form-grid">
        
        <div>
          <div class="card">
            
            <div class="card-header">
              <i data-lucide="clock"></i>
              <h3>Type de location</h3>
            </div>
            
            <div class="form-group">
              <label class="form-label">Durée de location *</label>
              <div class="radio-cards">
                <label class="radio-card selected" id="card-courte">
                  <input type="radio" name="duree" value="courte" checked onchange="updateDuree()">
                  <div class="radio-card-content">
                    <span class="title">Courte durée</span>
                    <span class="desc">Heure, journée<br>Acompte 50%</span>
                  </div>
                </label>
                
                <label class="radio-card" id="card-longue">
                  <input type="radio" name="duree" value="longue" onchange="updateDuree()">
                  <div class="radio-card-content">
                    <span class="title">Semaine & Mensuel</span>
                    <span class="desc">Semaine ou Mois<br>Acompte 25%</span>
                  </div>
                </label>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label" id="formule-label">Formule courte *</label>
                <select id="formuleCourte" name="formuleCourte" class="form-select" onchange="updateFormule()">
                  <option value="heure">À l'heure — 10 € HT</option>
                  <option value="demi">Demi-journée (4h) — 35 € HT</option>
                  <option value="journee">Journée — 65 € HT</option>
                </select>
                <select id="formuleLongue" name="formuleLongue" class="form-select" style="display:none;" onchange="updateFormule()">
                  <option value="semaine">Semaine — 60 € HT / jour</option>
                  <option value="mensuel">Mensuel — 55 € HT / jour</option>
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label">Pack Matériel</label>
                <select id="packMateriel" name="packMateriel" class="form-select" onchange="calculatePrice()">
                  <option value="aucun">Aucun — 0 €</option>
                  <option value="essentiel">Essentiel — 20 € HT/jour</option>
                  <option value="premium">Premium — 30 € HT/jour</option>
                </select>
              </div>
            </div>
            
            <div class="info-box" style="margin-bottom: 1.5rem;">
              <p><strong>Pack Essentiel :</strong> Tondeuses, outils de finition, cape, serviettes</p>
              <p><strong>Pack Premium :</strong> Essentiel + rasoir + serviettes supplémentaires</p>
            </div>
            
            <div class="divider"></div>
            
            <div class="card-header" style="margin-top: 0;">
              <i data-lucide="calendar-days"></i>
              <h3>Dates & Horaires</h3>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Date de début *</label>
                <input type="date" id="dateDebut" name="dateDebut" class="form-input" required onchange="updateHoursForDate(); calculatePrice()">
              </div>
              
              <div class="form-group">
                <label class="form-label">Date de fin</label>
                <input type="date" id="dateFin" name="dateFin" class="form-input" onchange="calculatePrice()">
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Heure de début *</label>
                <select id="heureDebut" name="heureDebut" class="form-select" required onchange="calculatePrice()">
                  <option value="10:00">10:00</option>
                  <option value="10:30">10:30</option>
                  <option value="11:00">11:00</option>
                  <option value="11:30">11:30</option>
                  <option value="12:00">12:00</option>
                  <option value="12:30">12:30</option>
                  <option value="13:00">13:00</option>
                  <option value="13:30">13:30</option>
                  <option value="14:00">14:00</option>
                  <option value="14:30">14:30</option>
                  <option value="15:00">15:00</option>
                  <option value="15:30">15:30</option>
                  <option value="16:00">16:00</option>
                  <option value="16:30">16:30</option>
                  <option value="17:00">17:00</option>
                </select>
              </div>
              
              <div class="form-group">
                <label class="form-label">Heure de fin *</label>
                <select id="heureFin" name="heureFin" class="form-select" required onchange="calculatePrice()">
                  <option value="11:00">11:00</option>
                  <option value="11:30">11:30</option>
                  <option value="12:00">12:00</option>
                  <option value="12:30">12:30</option>
                  <option value="13:00">13:00</option>
                  <option value="13:30">13:30</option>
                  <option value="14:00">14:00</option>
                  <option value="14:30">14:30</option>
                  <option value="15:00">15:00</option>
                  <option value="15:30">15:30</option>
                  <option value="16:00">16:00</option>
                  <option value="16:30">16:30</option>
                  <option value="17:00">17:00</option>
                  <option value="17:30">17:30</option>
                  <option value="18:00">18:00</option>
                </select>
              </div>
            </div>
            
            <div class="warning-box">
              <i data-lucide="info"></i>
              <div>
                <strong>Horaires d'ouverture :</strong><br>
                Mardi-Samedi : 10h-18h | Mercredi : 12h-17h30 (Fermé dimanche et lundi)
              </div>
            </div>
            
            <div class="divider"></div>
            
            <div class="card-header" style="margin-top: 0;">
              <i data-lucide="user"></i>
              <h3>Vos coordonnées</h3>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Nom complet *</label>
                <input type="text" id="nom" name="nom" class="form-input" placeholder="Jean Dupont" required>
              </div>
              
              <div class="form-group">
                <label class="form-label">Email *</label>
                <input type="email" id="email" name="email" class="form-input" placeholder="jean@exemple.com" required>
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Téléphone *</label>
              <input type="tel" id="telephone" name="telephone" class="form-input" placeholder="06 12 34 56 78" required>
            </div>
            
            <div class="divider"></div>
            
            <div class="card-header" style="margin-top: 0;">
              <i data-lucide="briefcase"></i>
              <h3>Profil professionnel</h3>
            </div>
            
            <div class="form-group">
              <label class="form-label">Statut professionnel *</label>
              <div class="radio-group">
                <label class="radio-item">
                  <input type="radio" name="statut" value="auto-entrepreneur" required>
                  <span>Auto-entrepreneur</span>
                </label>
                <label class="radio-item">
                  <input type="radio" name="statut" value="societe">
                  <span>Société (SARL, SAS...)</span>
                </label>
                <label class="radio-item">
                  <input type="radio" name="statut" value="en-cours">
                  <span>En cours d'immatriculation</span>
                </label>
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Années d'expérience *</label>
              <select id="experience" name="experience" class="form-select" required>
                <option value="">Sélectionner...</option>
                <option value="0-3">0 à 3 ans</option>
                <option value="3-5">3 à 5 ans</option>
                <option value="5-10">5 à 10 ans</option>
                <option value="10+">10 ans ou plus</option>
              </select>
            </div>
            
            <div class="form-group">
              <label class="form-label">Spécialité(s)</label>
              <div class="checkbox-group">
                <label class="checkbox-item">
                  <input type="checkbox" name="specialite" value="mixte">
                  <span>Coiffeur mixte (H/F)</span>
                </label>
                <label class="checkbox-item">
                  <input type="checkbox" name="specialite" value="barber">
                  <span>Barber</span>
                </label>
                <label class="checkbox-item">
                  <input type="checkbox" name="specialite" value="afro">
                  <span>Spécialiste afro (tresses, locks...)</span>
                </label>
                <label class="checkbox-item">
                  <input type="checkbox" name="specialite" value="coloriste">
                  <span>Coloriste (mèches, balayage...)</span>
                </label>
                <label class="checkbox-item">
                  <input type="checkbox" name="specialite" value="design">
                  <span>Design & finitions (contours, traits, rasage)</span>
                </label>
              </div>
            </div>
            
            <div class="form-group">
              <label class="form-label">Notes ou demandes particulières</label>
              <textarea id="notes" name="notes" class="form-textarea" placeholder="Précisez vos besoins spécifiques, équipements souhaités, etc."></textarea>
            </div>
            
            <div class="divider"></div>
            
            <div class="engagement-box">
              <h4><i data-lucide="shield-check"></i> Engagements requis</h4>
              
              <div class="checkbox-group">
                <label class="checkbox-item">
                  <input type="checkbox" id="engagement3ans" name="engagement3ans" required>
                  <span>Je confirme avoir au moins 3 ans d'expérience professionnelle *</span>
                </label>
                
                <label class="checkbox-item">
                  <input type="checkbox" id="engagementDiplome" name="engagementDiplome" required>
                  <span>Je possède un CAP/BP Coiffure ou équivalent *</span>
                </label>
                
                <label class="checkbox-item">
                  <input type="checkbox" id="engagementDocuments" name="engagementDocuments" required>
                  <span>Je fournirai les justificatifs demandés (diplôme, SIRET, assurance) *</span>
                </label>
                
                <label class="checkbox-item">
                  <input type="checkbox" id="acceptCGV" name="acceptCGV" required>
                  <span>J'accepte les <a href="#" onclick="showPage('cgv'); return false;">CGV & Contrat de location PHENO&CO</a> *</span>
                </label>
              </div>
            </div>
            
          </div>
        </div>
        
        <div>
          <div class="card sticky-card">
            
            <div class="card-header">
              <i data-lucide="calculator"></i>
              <h3>Récapitulatif</h3>
            </div>
            
            <div class="summary-row">
              <span class="label">Formule</span>
              <span class="value" id="summaryFormule">À l'heure</span>
            </div>
            
            <div class="summary-row">
              <span class="label">Date(s)</span>
              <span class="value" id="summaryDates">-</span>
            </div>
            
            <div class="summary-row">
              <span class="label">Horaires</span>
              <span class="value" id="summaryHoraires">10:00 - 11:00</span>
            </div>
            
            <div class="summary-row">
              <span class="label">Pack matériel</span>
              <span class="value" id="summaryPack">Aucun</span>
            </div>
            
            <div class="summary-divider"></div>
            
            <div class="summary-row">
              <span class="label">Total HT</span>
              <span class="value" id="summaryHT">10,00 €</span>
            </div>
            
            <div class="summary-row">
              <span class="label">TVA (20%)</span>
              <span class="value" id="summaryTVA">2,00 €</span>
            </div>
            
            <div class="summary-total">
              <span>Total TTC</span>
              <span id="summaryTTC">12,00 €</span>
            </div>
            
            <div class="summary-deposit">
              <div class="row">
                <span>Acompte à verser</span>
                <span class="deposit" id="summaryDeposit">6,00 €</span>
              </div>
              <div class="remaining" id="summaryRemaining">Reste à payer sur place : 6,00 €</div>
            </div>
            
            <button type="submit" class="submit-btn" id="submitBtn">
              Envoyer ma demande
              <i data-lucide="arrow-right"></i>
            </button>
            
            <div id="successMessage" class="success-message">
              <h4><i data-lucide="check-circle"></i> Demande envoyée !</h4>
              <p>Nous avons bien reçu votre demande de réservation. Vous recevrez un email de confirmation avec les instructions de paiement.</p>
              <p class="warning" id="emailWarning" style="display: none;">
                <i data-lucide="alert-triangle"></i>
                L'envoi d'email a échoué. Veuillez nous contacter par WhatsApp.
              </p>
            </div>
            
          </div>
          
          <div class="card about-section">
            <div class="card-header">
              <span>✨</span>
              <h3>À propos</h3>
            </div>
            
            <p>PHENO&CO, plus qu'un salon : un espace fondé sur le respect, la bienveillance et l'exigence.</p>
            
            <p>On partage l'énergie et la passion du métier. Chaque coiffeur arrive avec son histoire, son style et son talent, contribuant à maintenir une ambiance conviviale et familiale.</p>
            
            <p>Que vous soyez de passage ou en longue collaboration, l'essentiel reste le même : passion, sérieux et bonne vibe.</p>
            
            <p>À bientôt.</p>
          </div>
        </div>
        
      </form>
      
    </div>
  </section>
  
  <footer class="footer">
    <p>PHENO&CO — Barbershop & Coworking • Montpellier</p>
    <a href="admin.html" class="admin-link">Admin</a>
  </footer>
  
</div>

<!-- ==================== PAGE ADMIN ==================== -->
<div id="page-admin" class="page-section">
  
  <header class="admin-header">
    <a href="#" onclick="showPage('reservation'); return false;" class="back-link">← Retour au site</a>
    <h1 class="font-serif">Back-Office PHENO&CO</h1>
    <p>Gestion des réservations de fauteuils</p>
  </header>
  
  <div class="admin-container">
    
    <div id="adminLogin" class="login-card">
      <h2><i data-lucide="lock"></i> Accès sécurisé</h2>
      <div class="form-group">
        <label class="form-label">Code d'accès</label>
        <input type="password" id="adminCode" class="form-input" placeholder="Entrez le code" onkeypress="if(event.key==='Enter')checkAdminCode()">
      </div>
      <button onclick="checkAdminCode()" class="btn btn-primary" style="margin-top: 1rem;">
        <i data-lucide="log-in"></i> Connexion
      </button>
    </div>
    
    <div id="adminDashboard" style="display: none;">
      
      <div class="stats-grid">
        <div class="stat-card">
          <div class="number" id="statTotal">0</div>
          <div class="label">Total réservations</div>
        </div>
        <div class="stat-card">
          <div class="number" id="statPending">0</div>
          <div class="label">En attente</div>
        </div>
        <div class="stat-card">
          <div class="number" id="statConfirmed">0</div>
          <div class="label">Confirmées</div>
        </div>
        <div class="stat-card">
          <div class="number" id="statCancelled">0</div>
          <div class="label">Annulées</div>
        </div>
      </div>
      
      <div class="filter-bar">
        <select id="filterStatus" class="form-select" onchange="filterReservations()">
          <option value="all">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="confirmed">Confirmées</option>
          <option value="cancelled">Annulées</option>
        </select>
        
        <select id="filterFormule" class="form-select" onchange="filterReservations()">
          <option value="all">Toutes les formules</option>
          <option value="heure">À l'heure</option>
          <option value="demi">Demi-journée</option>
          <option value="journee">Journée</option>
          <option value="semaine">Semaine</option>
          <option value="mensuel">Mensuel</option>
        </select>
        
        <button onclick="exportReservations()" class="btn btn-outline" style="flex: 0;">
          <i data-lucide="download"></i> Exporter
        </button>
      </div>
      
      <div id="reservationsList" class="reservations-list">
        <div class="empty-state">
          <i data-lucide="inbox"></i>
          <p>Aucune réservation pour le moment</p>
        </div>
      </div>
      
    </div>
    
  </div>
  
  <footer class="footer">
    <p>PHENO&CO — Back-Office</p>
    <a href="#" onclick="showPage('reservation'); return false;">← Retour au formulaire</a>
  </footer>
  
</div>

<!-- ==================== PAGE CGV ==================== -->
<div id="page-cgv" class="page-section">
  
  <header class="admin-header">
    <a href="#" onclick="showPage('reservation'); return false;" class="back-link">← Retour au formulaire</a>
    <h1 class="font-serif">CGV & Contrat de Location</h1>
    <p>Conditions générales de location de fauteuil PHENO&CO</p>
  </header>
  
  <div class="cgv-container">
    
    <div class="cgv-card">
      <h2>Article 1 — Objet du Contrat</h2>
      <p>Le présent contrat a pour objet de définir les conditions de mise à disposition d'un poste de travail (fauteuil) au sein du salon de coiffure <strong>PHENO&CO</strong>, situé à Montpellier.</p>
      <p>Le locataire, professionnel de la coiffure indépendant, loue un espace équipé pour exercer son activité auprès de sa propre clientèle, dans le respect du règlement intérieur du salon.</p>
    </div>
    
    <div class="cgv-card">
      <h2>Article 2 — Conditions d'Éligibilité</h2>
      <p>Pour louer un fauteuil chez PHENO&CO, le locataire doit :</p>
      <ul>
        <li>Justifier d'au moins <strong>3 ans d'expérience professionnelle</strong> en coiffure/barbier</li>
        <li>Être titulaire d'un <strong>CAP/BP Coiffure</strong> ou diplôme équivalent reconnu</li>
        <li>Être immatriculé en tant qu'<strong>auto-entrepreneur, société, ou en cours d'immatriculation</strong></li>
        <li>Disposer d'une <strong>assurance responsabilité civile professionnelle</strong> valide</li>
        <li>Fournir les justificatifs correspondants avant la première location</li>
      </ul>
      <div class="highlight">
        <p><strong>Important :</strong> Toute fausse déclaration entraînera l'annulation immédiate de la réservation sans remboursement.</p>
      </div>
    </div>
    
    <div class="cgv-card">
      <h2>Article 3 — Tarification</h2>
      
      <h3>3.1 Location Courte Durée</h3>
      <table>
        <thead>
          <tr>
            <th>Formule</th>
            <th>Tarif HT</th>
            <th>Acompte</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>À l'heure</td>
            <td>10 € HT</td>
            <td>50%</td>
          </tr>
          <tr>
            <td>Demi-journée (4h)</td>
            <td>35 € HT</td>
            <td>50%</td>
          </tr>
          <tr>
            <td>Journée complète</td>
            <td>65 € HT</td>
            <td>50%</td>
          </tr>
        </tbody>
      </table>
      
      <h3>3.2 Location Longue Durée</h3>
      <table>
        <thead>
          <tr>
            <th>Formule</th>
            <th>Tarif HT</th>
            <th>Acompte</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Semaine (5 jours)</td>
            <td>60 € HT / jour (300 € HT/semaine)</td>
            <td>25%</td>
          </tr>
          <tr>
            <td>Mensuel</td>
            <td>55 € HT / jour</td>
            <td>25%</td>
          </tr>
        </tbody>
      </table>
      
      <h3>3.3 Packs Matériel (optionnels)</h3>
      <table>
        <thead>
          <tr>
            <th>Pack</th>
            <th>Contenu</th>
            <th>Tarif HT/jour</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Essentiel</td>
            <td>Tondeuses, outils de finition, cape, serviettes</td>
            <td>20 € HT</td>
          </tr>
          <tr>
            <td>Premium</td>
            <td>Essentiel + rasoir + serviettes supplémentaires</td>
            <td>30 € HT</td>
          </tr>
        </tbody>
      </table>
      
      <p style="margin-top: 1rem;"><strong>TVA :</strong> 20% appliquée à tous les tarifs.</p>
    </div>
    
    <div class="cgv-card">
      <h2>Article 4 — Réservation et Paiement</h2>
      
      <h3>4.1 Processus de réservation</h3>
      <ol>
        <li>Remplir le formulaire de demande en ligne</li>
        <li>Réception d'un email de confirmation avec récapitulatif</li>
        <li>Envoi des justificatifs requis par email</li>
        <li>Réception du lien de paiement pour l'acompte (SumUp)</li>
        <li>Confirmation définitive après réception du paiement</li>
      </ol>
      
      <h3>4.2 Modalités de paiement</h3>
      <ul>
        <li><strong>Acompte :</strong> À régler lors de la confirmation (50% courte durée, 25% longue durée)</li>
        <li><strong>Solde :</strong> À régler sur place, le jour de la prestation</li>
        <li><strong>Moyens acceptés :</strong> Carte bancaire, espèces, virement</li>
      </ul>
    </div>
    
    <div class="cgv-card">
      <h2>Article 5 — Annulation et Remboursement</h2>
      <ul>
        <li><strong>Plus de 48h avant :</strong> Remboursement intégral de l'acompte</li>
        <li><strong>Entre 24h et 48h :</strong> Remboursement de 50% de l'acompte</li>
        <li><strong>Moins de 24h :</strong> Acompte non remboursable</li>
        <li><strong>Non-présentation :</strong> Acompte acquis, facturation possible du solde</li>
      </ul>
      <p>En cas de force majeure dûment justifiée, un report pourra être proposé.</p>
    </div>
    
    <div class="cgv-card">
      <h2>Article 6 — Obligations du Locataire</h2>
      <p>Le locataire s'engage à :</p>
      <ul>
        <li>Respecter les horaires convenus</li>
        <li>Maintenir le poste de travail propre et rangé</li>
        <li>Utiliser le matériel mis à disposition avec soin</li>
        <li>Respecter la clientèle et le personnel du salon</li>
        <li>Ne pas sous-louer le fauteuil à un tiers</li>
        <li>Signaler tout dysfonctionnement ou dégradation</li>
        <li>Respecter le règlement intérieur du salon</li>
      </ul>
    </div>
    
    <div class="cgv-card">
      <h2>Article 7 — Responsabilités</h2>
      <p><strong>PHENO&CO</strong> met à disposition un espace de travail équipé et fonctionnel. Le locataire reste seul responsable :</p>
      <ul>
        <li>De ses prestations auprès de sa clientèle</li>
        <li>De ses obligations fiscales et sociales</li>
        <li>Des dommages causés par lui-même ou sa clientèle</li>
        <li>De son matériel personnel</li>
      </ul>
      <p>PHENO&CO décline toute responsabilité en cas de vol, perte ou dégradation des effets personnels.</p>
    </div>
    
    <div class="cgv-card">
      <h2>Article 8 — Horaires du Salon</h2>
      <table>
        <tbody>
          <tr>
            <td><strong>Mardi, Jeudi, Vendredi, Samedi</strong></td>
            <td>10h00 - 18h00</td>
          </tr>
          <tr>
            <td><strong>Mercredi</strong></td>
            <td>12h00 - 17h30</td>
          </tr>
          <tr>
            <td><strong>Dimanche et Lundi</strong></td>
            <td>Fermé</td>
          </tr>
        </tbody>
      </table>
      <p style="margin-top: 1rem;">Les réservations doivent respecter ces plages horaires. Toute extension doit faire l'objet d'un accord préalable.</p>
    </div>
    
    <div class="cgv-card">
      <h2>Article 9 — Résiliation</h2>
      <p>En cas de non-respect des présentes CGV ou du règlement intérieur, PHENO&CO se réserve le droit de mettre fin à la location sans préavis ni indemnité. Les sommes déjà versées resteront acquises.</p>
    </div>
    
    <div class="cgv-card">
      <h2>Article 10 — Données Personnelles</h2>
      <p>Les données collectées lors de la réservation sont utilisées exclusivement pour la gestion de la location et la communication avec le locataire. Elles ne sont pas transmises à des tiers.</p>
      <p>Conformément au RGPD, le locataire dispose d'un droit d'accès, de rectification et de suppression de ses données. Contact : <strong>location.phenoandco@gmail.com</strong></p>
    </div>
    
    <div class="cgv-card">
      <h2>Article 11 — Droit Applicable</h2>
      <p>Le présent contrat est soumis au droit français. En cas de litige, les parties s'engagent à rechercher une solution amiable. À défaut, les tribunaux de Montpellier seront seuls compétents.</p>
    </div>
    
    <div class="cgv-card" style="text-align: center;">
      <h2>Contact</h2>
      <p style="font-size: 1.125rem; color: var(--foreground);">
        <strong>PHENO&CO</strong><br>
        Barbershop & Coworking — Montpellier<br><br>
        📧 <a href="mailto:location.phenoandco@gmail.com" style="color: var(--primary);">location.phenoandco@gmail.com</a><br>
        📱 WhatsApp : <a href="https://wa.me/message/MZYDVEN32I55L1" target="_blank" style="color: var(--primary);">Nous contacter</a>
      </p>
    </div>
    
  </div>
  
  <footer class="footer">
    <p>PHENO&CO — Barbershop & Coworking • Montpellier</p>
    <a href="#" onclick="showPage('reservation'); return false;">← Retour au formulaire de réservation</a>
  </footer>
  
</div>

<div id="toast" class="toast">
  <h4 id="toastTitle">Notification</h4>
  <p id="toastMessage">Message</p>
</div>

<script>
  // ==================== NAVIGATION ====================
  function showPage(pageName) {
    document.querySelectorAll('.page-section').forEach(section => {
      section.classList.remove('active');
    });
    document.getElementById('page-' + pageName).classList.add('active');
    window.scrollTo(0, 0);
  }
  
  // ==================== EMAILJS INIT ====================
  emailjs.init('uBxESnC6CTyqiNyS6');
  
  // ==================== RESERVATION FUNCTIONS ====================
  function scrollToReservation() {
    document.getElementById('reservation').scrollIntoView({ behavior: 'smooth' });
  }
  
  function updateHoursForDate() {
    const dateDebut = document.getElementById('dateDebut').value;
    if (!dateDebut) return;
    
    const date = new Date(dateDebut);
    const dayOfWeek = date.getDay(); // 0=dimanche, 1=lundi, 2=mardi, 3=mercredi, 4=jeudi, 5=vendredi, 6=samedi
    
    const heureDebutSelect = document.getElementById('heureDebut');
    const heureFinSelect = document.getElementById('heureFin');
    
    let startHour, endHour;
    
    if (dayOfWeek === 0 || dayOfWeek === 1) {
      // Dimanche ou Lundi - fermé
      alert('Attention : Le salon est fermé le dimanche et le lundi. Veuillez choisir un autre jour.');
      return;
    } else if (dayOfWeek === 3) {
      // Mercredi : 12h - 17h30
      startHour = 12;
      endHour = 17.5;
    } else {
      // Mardi, Jeudi, Vendredi, Samedi : 10h - 18h
      startHour = 10;
      endHour = 18;
    }
    
    // Générer les options pour heure de début
    let optionsDebut = '';
    for (let h = startHour; h < endHour; h += 0.5) {
      const hours = Math.floor(h);
      const minutes = (h % 1 === 0) ? '00' : '30';
      const value = `${hours.toString().padStart(2, '0')}:${minutes}`;
      optionsDebut += `<option value="${value}">${value}</option>`;
    }
    heureDebutSelect.innerHTML = optionsDebut;
    
    // Générer les options pour heure de fin
    let optionsFin = '';
    for (let h = startHour + 1; h <= endHour; h += 0.5) {
      const hours = Math.floor(h);
      const minutes = (h % 1 === 0) ? '00' : '30';
      const value = `${hours.toString().padStart(2, '0')}:${minutes}`;
      optionsFin += `<option value="${value}">${value}</option>`;
    }
    heureFinSelect.innerHTML = optionsFin;
  }
  
  function updateDuree() {
    const duree = document.querySelector('input[name="duree"]:checked').value;
    const cardCourte = document.getElementById('card-courte');
    const cardLongue = document.getElementById('card-longue');
    const formuleCourte = document.getElementById('formuleCourte');
    const formuleLongue = document.getElementById('formuleLongue');
    const formuleLabel = document.getElementById('formule-label');
    const heureDebut = document.getElementById('heureDebut');
    const heureFin = document.getElementById('heureFin');
    
    if (duree === 'courte') {
      cardCourte.classList.add('selected');
      cardLongue.classList.remove('selected');
      formuleCourte.style.display = 'block';
      formuleLongue.style.display = 'none';
      formuleLabel.textContent = 'Formule courte *';
      heureDebut.disabled = false;
      heureFin.disabled = false;
    } else {
      cardCourte.classList.remove('selected');
      cardLongue.classList.add('selected');
      formuleCourte.style.display = 'none';
      formuleLongue.style.display = 'block';
      formuleLabel.textContent = 'Formule longue *';
      heureDebut.disabled = true;
      heureFin.disabled = true;
    }
    
    calculatePrice();
  }
  
  function updateFormule() {
    calculatePrice();
  }
  
  function calculatePrice() {
    const duree = document.querySelector('input[name="duree"]:checked').value;
    const formuleCourte = document.getElementById('formuleCourte').value;
    const formuleLongue = document.getElementById('formuleLongue').value;
    const packMateriel = document.getElementById('packMateriel').value;
    const dateDebut = document.getElementById('dateDebut').value;
    const dateFin = document.getElementById('dateFin').value;
    const heureDebut = document.getElementById('heureDebut').value;
    const heureFin = document.getElementById('heureFin').value;
    
    let basePrice = 0;
    let formuleText = '';
    let nbJours = 1;
    let depositRate = 0.5;
    
    if (duree === 'courte') {
      if (dateDebut && dateFin) {
        const d1 = new Date(dateDebut);
        const d2 = new Date(dateFin);
        nbJours = Math.max(1, Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)) + 1);
      }
      switch (formuleCourte) {
        case 'heure':
          const h1 = parseInt(heureDebut.split(':')[0]) + parseInt(heureDebut.split(':')[1]) / 60;
          const h2 = parseInt(heureFin.split(':')[0]) + parseInt(heureFin.split(':')[1]) / 60;
          const heures = Math.max(1, Math.ceil(h2 - h1));
          basePrice = heures * 10 * nbJours;
          formuleText = `À l'heure (${heures}h x ${nbJours}j)`;
          break;
        case 'demi':
          basePrice = 35 * nbJours;
          formuleText = `Demi-journée (4h x ${nbJours}j)`;
          break;
        case 'journee':
          basePrice = 65 * nbJours;
          formuleText = `Journée (${nbJours}j)`;
          break;
      }
      depositRate = 0.5;
    } else {
      if (dateDebut && dateFin) {
        const d1 = new Date(dateDebut);
        const d2 = new Date(dateFin);
        nbJours = Math.max(1, Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24)) + 1);
      }
      
      switch (formuleLongue) {
        case 'semaine':
          basePrice = 60 * nbJours;
          formuleText = `Semaine (${nbJours} jours)`;
          break;
        case 'mensuel':
          basePrice = 55 * nbJours;
          formuleText = `Mensuel (${nbJours} jours)`;
          break;
      }
      depositRate = 0.25;
    }
    
    let packPrice = 0;
    let packText = 'Aucun';
    switch (packMateriel) {
      case 'essentiel':
        packPrice = 20 * nbJours;
        packText = `Essentiel (${nbJours}j)`;
        break;
      case 'premium':
        packPrice = 30 * nbJours;
        packText = `Premium (${nbJours}j)`;
        break;
    }
    
    const totalHT = basePrice + packPrice;
    const tva = totalHT * 0.2;
    const totalTTC = totalHT + tva;
    const deposit = totalTTC * depositRate;
    const remaining = totalTTC - deposit;
    
    document.getElementById('summaryFormule').textContent = formuleText;
    document.getElementById('summaryPack').textContent = packText;
    document.getElementById('summaryHT').textContent = totalHT.toFixed(2) + ' €';
    document.getElementById('summaryTVA').textContent = tva.toFixed(2) + ' €';
    document.getElementById('summaryTTC').textContent = totalTTC.toFixed(2) + ' €';
    document.getElementById('summaryDeposit').textContent = deposit.toFixed(2) + ' €';
    document.getElementById('summaryRemaining').textContent = `Reste à payer sur place : ${remaining.toFixed(2)} €`;
    
    let datesText = '-';
    if (dateDebut) {
      const options = { day: 'numeric', month: 'short' };
      datesText = new Date(dateDebut).toLocaleDateString('fr-FR', options);
      if (dateFin && dateFin !== dateDebut) {
        datesText += ' → ' + new Date(dateFin).toLocaleDateString('fr-FR', options);
      }
    }
    document.getElementById('summaryDates').textContent = datesText;
    
    if (duree === 'courte') {
      document.getElementById('summaryHoraires').textContent = heureDebut + ' - ' + heureFin;
    } else {
      document.getElementById('summaryHoraires').textContent = 'Journée complète';
    }
  }
  
  function showToast(title, message, isError = false) {
    const toast = document.getElementById('toast');
    document.getElementById('toastTitle').textContent = title;
    document.getElementById('toastMessage').textContent = message;
    toast.classList.toggle('error', isError);
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
  }
  
  // ==================== ADMIN FUNCTIONS ====================
  const ADMIN_CODE = 'EXEMPLE_INACTIF_NE_PAS_UTILISER';
  let reservations = JSON.parse(localStorage.getItem('phenoReservations') || '[]');
  
  function checkAdminCode() {
    const code = document.getElementById('adminCode').value;
    if (code === ADMIN_CODE) {
      reservations = JSON.parse(localStorage.getItem('phenoReservations') || '[]');
      document.getElementById('adminLogin').style.display = 'none';
      document.getElementById('adminDashboard').style.display = 'block';
      renderReservations();
    } else {
      showToast('Erreur', 'Code d\'accès incorrect', true);
    }
  }
  
  function updateStats() {
    const total = reservations.length;
    const pending = reservations.filter(r => r.status === 'pending').length;
    const confirmed = reservations.filter(r => r.status === 'confirmed').length;
    const cancelled = reservations.filter(r => r.status === 'cancelled').length;
    
    document.getElementById('statTotal').textContent = total;
    document.getElementById('statPending').textContent = pending;
    document.getElementById('statConfirmed').textContent = confirmed;
    document.getElementById('statCancelled').textContent = cancelled;
  }
  
  function filterReservations() {
    renderReservations();
  }
  
  function renderReservations() {
    updateStats();
    
    const statusFilter = document.getElementById('filterStatus').value;
    const formuleFilter = document.getElementById('filterFormule').value;
    
    let filtered = [...reservations];
    
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }
    
    if (formuleFilter !== 'all') {
      filtered = filtered.filter(r => r.formule === formuleFilter);
    }
    
    filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    const container = document.getElementById('reservationsList');
    
    if (filtered.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <i data-lucide="inbox"></i>
          <p>Aucune réservation trouvée</p>
        </div>
      `;
      lucide.createIcons();
      return;
    }
    
    container.innerHTML = filtered.map(r => {
      const statusClass = r.status === 'pending' ? 'status-pending' : r.status === 'confirmed' ? 'status-confirmed' : 'status-cancelled';
      const statusText = r.status === 'pending' ? 'En attente' : r.status === 'confirmed' ? 'Confirmée' : 'Annulée';
      
      return `
        <div class="reservation-card">
          <div class="reservation-header">
            <div class="reservation-client">
              <h3>${r.nom}</h3>
              <p>${r.email} • ${r.telephone}</p>
            </div>
            <span class="status-badge ${statusClass}">${statusText}</span>
          </div>
          
          <div class="reservation-details">
            <div class="detail-item">
              <div class="detail-label">Formule</div>
              <div class="detail-value">${r.formuleText || r.formule}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Date(s)</div>
              <div class="detail-value">${r.dateDebut}${r.dateFin && r.dateFin !== r.dateDebut ? ' → ' + r.dateFin : ''}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Horaires</div>
              <div class="detail-value">${r.heureDebut} - ${r.heureFin}</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Total TTC</div>
              <div class="detail-value" style="color: var(--primary); font-weight: 700;">${r.totalTTC} €</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Acompte</div>
              <div class="detail-value" style="color: #22c55e;">${r.deposit} €</div>
            </div>
            <div class="detail-item">
              <div class="detail-label">Pack</div>
              <div class="detail-value">${r.packMateriel || 'Aucun'}</div>
            </div>
          </div>
          
          ${r.notes ? `<p style="font-size: 0.875rem; color: var(--muted); margin-bottom: 1rem;"><strong>Notes:</strong> ${r.notes}</p>` : ''}
          
          <div class="reservation-actions">
            ${r.status === 'pending' ? `
              <button onclick="updateStatus('${r.id}', 'confirmed')" class="action-btn confirm">
                <i data-lucide="check"></i> Confirmer
              </button>
              <button onclick="updateStatus('${r.id}', 'cancelled')" class="action-btn cancel">
                <i data-lucide="x"></i> Annuler
              </button>
            ` : ''}
            ${r.status === 'cancelled' ? `
              <button onclick="updateStatus('${r.id}', 'pending')" class="action-btn confirm">
                <i data-lucide="rotate-ccw"></i> Réactiver
              </button>
            ` : ''}
            <a href="https://wa.me/${r.telephone?.replace(/\s/g, '').replace(/^0/, '33')}" target="_blank" class="action-btn whatsapp">
              <i data-lucide="message-circle"></i> WhatsApp
            </a>
            <button onclick="deleteReservation('${r.id}')" class="action-btn delete">
              <i data-lucide="trash-2"></i> Supprimer
            </button>
          </div>
        </div>
      `;
    }).join('');
    
    lucide.createIcons();
  }
  
  function updateStatus(id, newStatus) {
    const index = reservations.findIndex(r => r.id === id);
    if (index !== -1) {
      reservations[index].status = newStatus;
      localStorage.setItem('phenoReservations', JSON.stringify(reservations));
      renderReservations();
      showToast('Succès', `Réservation ${newStatus === 'confirmed' ? 'confirmée' : newStatus === 'cancelled' ? 'annulée' : 'mise à jour'}`);
    }
  }
  
  function deleteReservation(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette réservation ?')) {
      reservations = reservations.filter(r => r.id !== id);
      localStorage.setItem('phenoReservations', JSON.stringify(reservations));
      renderReservations();
      showToast('Succès', 'Réservation supprimée');
    }
  }
  
  function exportReservations() {
    if (reservations.length === 0) {
      showToast('Info', 'Aucune réservation à exporter');
      return;
    }
    
    const headers = ['Nom', 'Email', 'Téléphone', 'Formule', 'Date début', 'Date fin', 'Heure début', 'Heure fin', 'Pack', 'Total TTC', 'Acompte', 'Statut', 'Notes'];
    const rows = reservations.map(r => [
      r.nom, r.email, r.telephone, r.formuleText || r.formule, r.dateDebut, r.dateFin || '', r.heureDebut, r.heureFin, r.packMateriel || 'Aucun', r.totalTTC, r.deposit, r.status, r.notes || ''
    ]);
    
    const csv = [headers.join(';'), ...rows.map(row => row.join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'reservations_phenoandco.csv';
    link.click();
    
    showToast('Succès', 'Export téléchargé');
  }
  
  // ==================== FORM SUBMISSION ====================
  document.getElementById('reservationForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<svg class="animate-spin" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" fill="none" opacity="0.25"/><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Envoi en cours...';
    
    const formData = new FormData(this);
    const nom = formData.get('nom');
    const email = formData.get('email');
    const telephone = formData.get('telephone');
    const duree = formData.get('duree');
    const formule = duree === 'courte' ? formData.get('formuleCourte') : formData.get('formuleLongue');
    
    const reservation = {
      id: Date.now().toString(),
      nom,
      email,
      telephone,
      duree,
      formule,
      formuleText: document.getElementById('summaryFormule').textContent,
      dateDebut: formData.get('dateDebut'),
      dateFin: formData.get('dateFin'),
      heureDebut: formData.get('heureDebut'),
      heureFin: formData.get('heureFin'),
      packMateriel: formData.get('packMateriel'),
      statut: formData.get('statut'),
      experience: formData.get('experience'),
      specialites: formData.getAll('specialite'),
      notes: formData.get('notes'),
      totalHT: document.getElementById('summaryHT').textContent.replace(' €', ''),
      totalTVA: document.getElementById('summaryTVA').textContent.replace(' €', ''),
      totalTTC: document.getElementById('summaryTTC').textContent.replace(' €', ''),
      deposit: document.getElementById('summaryDeposit').textContent.replace(' €', ''),
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    
    reservations.push(reservation);
    localStorage.setItem('phenoReservations', JSON.stringify(reservations));
    
    // WhatsApp notification au SALON (PHENO&CO) - DOIT être avant les emails pour éviter blocage popup
    const messageManager = `🔔 NOUVELLE RÉSERVATION PHENO&CO

👤 Client: ${nom}
📧 Email: ${email}
📱 Tél: ${telephone}

📅 Dates: ${reservation.dateDebut}${reservation.dateFin ? ' → ' + reservation.dateFin : ''}
⏰ Horaires: ${reservation.heureDebut} - ${reservation.heureFin}
📋 Formule: ${reservation.formuleText}
🎒 Pack: ${reservation.packMateriel || 'Aucun'}

💰 Total TTC: ${reservation.totalTTC} €
💳 Acompte: ${reservation.deposit} €

👔 Statut: ${reservation.statut}
📊 Expérience: ${reservation.experience}
🎯 Spécialités: ${reservation.specialites.join(', ') || 'Non spécifié'}

📝 Notes: ${reservation.notes || 'Aucune'}`;
    
    // WhatsApp notification au DEMANDEUR (client)
    const messageClient = `✅ CONFIRMATION DE VOTRE DEMANDE - PHENO&CO

Bonjour ${nom},

Votre demande de réservation a bien été enregistrée !

📅 Dates: ${reservation.dateDebut}${reservation.dateFin ? ' → ' + reservation.dateFin : ''}
⏰ Horaires: ${reservation.heureDebut} - ${reservation.heureFin}
📋 Formule: ${reservation.formuleText}
🎒 Pack: ${reservation.packMateriel || 'Aucun'}

💰 Total TTC: ${reservation.totalTTC} €
💳 Acompte à régler: ${reservation.deposit} €

Nous vous contacterons rapidement pour confirmer votre réservation et le paiement de l'acompte.

PHENO&CO - Barbershop Montpellier`;
    
    // Ouvrir WhatsApp pour le salon
    window.open(`https://wa.me/message/MZYDVEN32I55L1?text=${encodeURIComponent(messageManager)}`, '_blank');
    
    // Ouvrir WhatsApp pour le client
    const clientPhone = telephone.replace(/\s/g, '').replace(/^0/, '33');
    setTimeout(() => {
      window.open(`https://wa.me/${clientPhone}?text=${encodeURIComponent(messageClient)}`, '_blank');
    }, 500);
    
    let emailError = false;
    try {
      // Récapitulatif complet pour les emails
      const recapText = `
RÉCAPITULATIF DE LA DEMANDE DE RÉSERVATION

CLIENT
- Nom: ${nom}
- Email: ${email}
- Téléphone: ${telephone}

RÉSERVATION
- Dates: ${reservation.dateDebut}${reservation.dateFin ? ' au ' + reservation.dateFin : ''}
- Horaires: ${reservation.heureDebut} - ${reservation.heureFin}
- Formule: ${reservation.formuleText}
- Pack matériel: ${reservation.packMateriel || 'Aucun'}

TARIFICATION
- Total HT: ${reservation.totalHT} €
- TVA (20%): ${reservation.totalTVA} €
- Total TTC: ${reservation.totalTTC} €
- Acompte à régler: ${reservation.deposit} €

PROFIL PROFESSIONNEL
- Statut: ${reservation.statut}
- Expérience: ${reservation.experience}
- Spécialités: ${reservation.specialites.join(', ') || 'Non spécifié'}

NOTES
${reservation.notes || 'Aucune note'}

---
PHENO&CO - Barbershop & Coworking - Montpellier
      `.trim();
      
      const templateParams = {
        client_name: nom,
        client_email: email,
        client_phone: telephone,
        formule: reservation.formuleText,
        date_debut: reservation.dateDebut,
        date_fin: reservation.dateFin || 'N/A',
        heure_debut: reservation.heureDebut,
        heure_fin: reservation.heureFin,
        pack_materiel: reservation.packMateriel || 'Aucun',
        total_ht: reservation.totalHT,
        total_tva: reservation.totalTVA,
        total_ttc: reservation.totalTTC,
        acompte: reservation.deposit,
        statut_pro: reservation.statut,
        experience: reservation.experience,
        specialites: reservation.specialites.join(', ') || 'Non spécifié',
        notes: reservation.notes || 'Aucune',
        message: recapText,
        recap: recapText
      };
      
      await Promise.all([
        emailjs.send('service_llizndy', 'template_m6uvyuq', { ...templateParams, to_email: "location.phenoandco@gmail.com", to_name: "Manager PHENO&CO" }),
        emailjs.send('service_llizndy', 'template_m6uvyuq', { ...templateParams, to_email: email, to_name: nom })
      ]);
    } catch (error) {
      console.error('Email error:', error);
      console.error('Email error text:', error?.text || error?.message || JSON.stringify(error));
      emailError = true;
    }
    
    submitBtn.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Demande Envoyée !';
    
    const successMessage = document.getElementById('successMessage');
    successMessage.classList.add('show');
    
    if (emailError) {
      document.getElementById('emailWarning').style.display = 'flex';
    }
    
    setTimeout(() => {
      successMessage.classList.remove('show');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Envoyer ma demande <i data-lucide="arrow-right"></i>';
      lucide.createIcons();
      document.getElementById('reservationForm').reset();
      
      document.getElementById('card-courte').classList.add('selected');
      document.getElementById('card-longue').classList.remove('selected');
      document.getElementById('formuleCourte').style.display = 'block';
      document.getElementById('formuleLongue').style.display = 'none';
      document.getElementById('formule-label').textContent = 'Formule courte *';
      document.getElementById('heureDebut').disabled = false;
      document.getElementById('heureFin').disabled = false;
      
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      document.getElementById('dateDebut').value = tomorrow.toISOString().split('T')[0];
      document.getElementById('heureDebut').value = '10:00';
      document.getElementById('heureFin').value = '11:00';
      
      calculatePrice();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 3000);
  });
  
  // ==================== INITIALIZATION ====================
  document.addEventListener('DOMContentLoaded', function() {
    lucide.createIcons();
    
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('dateDebut').value = tomorrow.toISOString().split('T')[0];
    document.getElementById('heureDebut').value = '10:00';
    document.getElementById('heureFin').value = '11:00';
    
    calculatePrice();
  });
</script>

</body>
</html>
