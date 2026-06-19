# NEXUS AI Design Tokens

Source: Stitch project **Nexus AI Startup OS** (`projects/9208207649661020246`)

## Colors

| Token | Hex | Usage |
|-------|-----|-------|
| Surface Obsidian | `#08090A` | Base canvas |
| Surface Slate | `#111214` | Elevated panels |
| Neon Blue | `#3b82f6` | Primary actions, focus |
| Neon Purple | `#a855f7` | Secondary, Web3 layers |
| Warning Yellow | `#E4F222` | Critical alerts only |
| On Surface | `#E3E2E3` | Body text |
| Border Muted | `rgba(255,255,255,0.08)` | Glass card borders |

## Typography

| Role | Font |
|------|------|
| Display / Headlines | Geist |
| Body | Inter |
| Labels / Wallet / Code | JetBrains Mono |

## Layout

- Sidebar width: **240px** (desktop)
- Grid: 12-column fluid (desktop), 4-column (mobile)
- Base spacing unit: **4px**
- Page margins: 40px desktop / 20px mobile

## Components (Stitch)

- Glass cards: `backdrop-blur` + 1px muted border
- Primary button: Neon Blue + subtle outer glow on hover
- Sidebar active state: 2px vertical Neon Blue bar

Implemented in `apps/web/app/globals.css`.
