# 🎨 STITCH UI SPEC — Linkbox

Projeye özel üretildi (2026-07-26). Uygulama arayüzü bu
tasarım sistemine ve ekran tanımlarına sadık kalmalıdır.

## Design System
- **Aesthetic:** Tech Indigo Modern (Hizmet & Kurumsal) (`tech_indigo`)
- **Primary Token:** `oklch(0.62 0.22 265)`
- **Background:** `#0a0f1e`
- **Display Font:** `Outfit` · **Body Font:** `Inter`

## Screens (2)

### 1. Link Listesi

Create a responsive UI for the main screen of a personal link‑saving and tagging tool called "Linkbox". The purpose of this screen is to let a user view, search, filter, and add their saved links in a single page application.

Components and real‑world content (in Turkish):
- Header with the app logo "Linkbox" and a user avatar dropdown (email, logout).
- A prominent "Yeni Link Ekle" button that opens a modal for entering URL, title, description, and selecting existing tags or creating new ones.
- A search bar with placeholder "Tam metin ara..." that searches across title, description, URL and tag names.
- Tag filter chips (e.g., "#çalışma", "#eğitim", "#eğlence") that can be toggled to filter the list.
- A paginated list (keyset pagination) of link cards showing:
  * Favicon or preview image thumbnail.
  * Title (clickable, opens the URL in a new tab).
  * URL (shortened display).
  * List of tags as removable chips.
  * "Sil" and "Düzenle" icons for each item.
- Footer with simple pagination controls (previous/next) and total count.

Layout description:
- Header spans full width at the top.
- Below the header, a two‑row area: first row contains the search bar on the left and tag filter chips on the right.
- The "Yeni Link Ekle" button is positioned on the right side of the header for desktop, and as a floating action button on mobile.
- Main content area displays the link cards in a responsive grid: 1 column on mobile, 2 on tablet, 4 on desktop.
- The modal for adding/editing a link slides up from the bottom on mobile and appears centered on larger screens.

The layout must be fully responsive: mobile, tablet and desktop.
All UI copy and sample data in Turkish. Visual style: Tech Indigo Modern (Hizmet & Kurumsal). Primary color token oklch(0.62 0.22 265), dark background #0a0f1e, display font "Outfit", body font "Inter". The layout must be fully responsive and adapt gracefully to mobile, tablet and desktop widths.

### 2. Link Detayı

Design a responsive detail view screen for a single saved link in the "Linkbox" personal link‑saving app. This screen appears when a user clicks on a link title from the list and should allow them to see full information and manage tags.

Components and real‑world content (in Turkish):
- Header with a back arrow, the app logo "Linkbox", and a small user avatar.
- Large preview image of the linked page (fetched from Supabase Storage) with a fallback icon.
- Title of the link displayed prominently.
- Full URL displayed as a clickable, copy‑to‑clipboard field.
- Description text area (sample: "Bu makale, modern JavaScript framework'leri hakkında derinlemesine bir analiz sunuyor.").
- Tag section showing existing tags as chips with a small "x" to remove, and an input to add new tags (autocomplete with existing tags).
- Action buttons: "Kaydet" (to persist changes), "Sil" (to delete the link), and "Aç" (opens the URL in a new tab).
- Footer with a small note: "Son güncelleme: 12 Temmuz 2026".

Layout description:
- Header fixed at the top.
- Main content stacked vertically: preview image at the top, then title, URL field, description, tags, and action buttons.
- On tablet and desktop, the preview image occupies the left half of the screen while the textual details occupy the right half, creating a two‑column layout.
- Buttons are arranged horizontally on larger screens and stacked vertically on mobile.

The layout must be fully responsive: mobile, tablet and desktop.
All UI copy and sample data in Turkish. Visual style: Tech Indigo Modern (Hizmet & Kurumsal). Primary color token oklch(0.62 0.22 265), dark background #0a0f1e, display font "Outfit", body font "Inter". The layout must be fully responsive and adapt gracefully to mobile, tablet and desktop widths.
