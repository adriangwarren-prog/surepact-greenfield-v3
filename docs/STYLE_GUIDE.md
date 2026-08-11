# SurePact Platform UI Style Guide & Accessibility Contract

This document defines the mandatory design system rules, color tokens, typography standards, and WCAG 2.1 AA accessibility contracts for the SurePact platform. All components created by developers or AI agents MUST comply with these rules.

---

## 🎨 1. Color Palette & CSS Variables

Always use defined CSS variables from `index.css`. NEVER hardcode raw color hex values (`#fff`, `#ffffff`, `#000`) on components.

### Core Theme Tokens
```css
/* Backgrounds */
--bg-primary: #080b11;             /* Dark theme main background */
--bg-secondary: #0f1420;           /* Dark theme card/panel background */
--bg-card: rgba(22, 29, 47, 0.7);  /* Glassmorphic card background */

/* Light Theme Overrides (Active when body.light-theme is present) */
body.light-theme {
  --bg-primary: #f4f6f9;           /* Light theme app background */
  --bg-secondary: #ffffff;         /* Light theme card/panel background */
  --bg-card: #ffffff;
  --text-primary: #151226;         /* Primary high-contrast text */
  --text-secondary: #475569;       /* Secondary contrast text */
  --text-muted: #64748b;          /* Muted label text */
  --border-color: #e2e8f0;
}
```

---

## ⚠️ 2. Mandatory Text Contrast Rules (WCAG 2.1 AA)

### Strict Prohibitions
1. **NO HARDCODED WHITE TEXT ON LIGHT CONTAINERS**:
   - `color: '#fff'`, `color: '#ffffff'`, or `color: 'white'` MUST NOT be applied inline to headings, labels, buttons, or spans inside cards, panels, or modals.
   - Use `color: 'var(--text-primary)'` or `color: 'var(--text-secondary)'` instead.
2. **FORM CONTROLS & SELECTS**:
   - All `<select>`, `<option>`, and `<optgroup>` tags MUST specify explicit background and text color rules:
     - Light theme: `background-color: #ffffff !important; color: #151226 !important;`
     - Dark theme: `background-color: #0f1420 !important; color: #f3f4f6 !important;`
3. **CALENDAR & GRID HEADERS**:
   - Day headers (`Sun`, `Mon`, `Tue`, etc.), navigation labels, and date counters MUST maintain a contrast ratio of at least 4.5:1 against their container background.

---

## 📅 3. Calendar & Schedule Component Specifications

1. **Navigation Control Layout Standard**:
   - **Standalone `Today` Button**: Placed on the left of navigation controls. Clicking it MUST return view to the current day.
   - **Flanked Date Indicator**: The Month or Week indicator MUST be placed between the Previous (`<`) and Next (`>`) step buttons: `< [ Month / Week Label ] >`.
2. **Supported View Modes**:
   - **Month View**: 35 or 42 grid cells showing monthly calendar days.
   - **Week View**: 7-column layout displaying the 7 days of the active week with event badges and entity metadata.
   - **Agenda View**: Chronological event list grouped by date.

---

## 🛠️ 4. Build Agent Checklist Before Release

- [ ] Ran `npm run build` with zero TypeScript or CSS warnings.
- [ ] Tested component in both **Light Theme** (`body.light-theme`) and **Dark Theme**.
- [ ] Verified zero white-on-white text or invisible option items in dropdown menus.
- [ ] Ensured interactive buttons specify clear focus and hover contrast states.
