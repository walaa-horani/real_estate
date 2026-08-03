# Flip7 Design System

## Overview

Flip7 is a retro-playful, teal-coral-gold design system crafted for the Flip7 card game scoring mini-program. Inspired by the original Flip7 board game packaging, it blends vintage warmth with modern mobile UX. The visual language is bold, joyful, and tactile -- combining BounceBox's bubbly energy with QuizForge's competitive gamification patterns. Every element feels like a game piece you want to tap.

---

## Colors

- **Primary Teal** (#2BA8A2): Main UI, backgrounds, avatars, progress bars
- **Primary Light** (#3CC4BD): Hover states, lighter accents
- **Primary Dark** (#1E8C86): Deep backgrounds, text on light surfaces
- **Primary BG** (#E8F6F5): Subtle teal tint for backgrounds
- **Accent Gold** (#FFD23F): CTAs, highlights, first-player badges, celebrations
- **Accent Light** (#FFE47A): Soft gold tints, active states
- **Accent Dark** (#E6B800): Gold hover states, depth
- **Coral** (#EF6C4A): BOOM state, warnings, ranking #3, energy
- **Coral Light** (#FF8A6A): Soft coral tints
- **Coral Dark** (#D45233): Coral depth, hover
- **Cream** (#FFF8E7): Card backgrounds, input surfaces
- **Sky Blue** (#5DADE2): Flip7 bonus, info states
- **Surface Base** (#EFF8F7): Page background
- **Surface Card** (#FFFFFF): Card backgrounds
- **Success** (#27AE60): Positive states
- **Error** (#E74C3C): Error states

## Typography

- **Headline Style**: System font stack, extra-bold (800), generous letter-spacing (4-6rpx)
- **Body Font**: -apple-system, BlinkMacSystemFont, PingFang SC, Microsoft YaHei
- **Display**: 72rpx extra-bold — Giant score numbers
- **h1**: 48rpx extra-bold — Page titles, winner name
- **h2**: 36rpx extra-bold — Round numbers, section titles
- **h3**: 32rpx bold — Card titles, button text
- **body**: 28rpx medium — Body text, player names
- **sm**: 24rpx medium — Labels, captions
- **xs**: 20rpx medium — Badges, timestamps

---

## Spacing

Base unit: **8rpx**
- **xs**: 8rpx -- Inline icon gaps, tight padding
- **sm**: 16rpx -- Within component groups
- **md**: 24rpx -- Standard padding, card inner spacing
- **lg**: 32rpx -- Card padding, section gaps
- **xl**: 48rpx -- Section breaks, hero spacing

## Border Radius

- **sm** (8rpx): Small tags, inputs
- **md** (16rpx): Cards, buttons, inputs
- **lg** (24rpx): Feature cards, panels, scoring items
- **xl** (32rpx): Hero cards, modals, logo
- **round** (999rpx): Pill buttons, badges, rank badges

## Elevation -- Colored Glow System

The shadow system uses colored glows instead of generic black shadows to reinforce the brand palette and add playful depth.

- **shadow-sm**: 0 2rpx 8rpx black at 8% -- Resting cards, subtle lift
- **shadow-md**: 0 4rpx 16rpx black at 12% -- Hovered elements
- **shadow-lg**: 0 8rpx 32rpx black at 16% -- Modals, dragging
- **shadow-card**: 0 4rpx 20rpx teal (#2BA8A2) at 10% -- Default card shadow
- **shadow-coral-glow**: 0 4rpx 20rpx coral (#EF6C4A) at 35% -- BOOM button, coral CTAs
- **shadow-teal-glow**: 0 4rpx 20rpx teal (#2BA8A2) at 30% -- Teal buttons, avatars
- **shadow-accent-glow**: 0 4rpx 20rpx gold (#FFD23F) at 40% -- Primary CTA, gold highlights
- **shadow-sky-glow**: 0 4rpx 16rpx sky-blue (#5DADE2) at 30% -- Flip7 button
- **shadow-focus**: 0 0 0 4rpx primary at 15% -- Focus rings on inputs

## Components

### Logo (Setup Page Header)

Inspired by the original Flip7 board game packaging. The logo area consists of three layers:

#### Fan Cards Background
- 5 colored cards (red/blue/green/yellow/purple) fanned out behind the text
- Each card: 60rpx x 84rpx, 8rpx radius, positioned with `transform-origin: bottom center`
- Rotation angles: -24deg, -12deg, 0deg, 12deg, 24deg

#### FLIP7 Text
- Entire text group rotated -3deg for a dynamic, playful tilt
- Wrapped in a **cream-colored parallelogram** background (using `::before` with `skewX(-6deg)` + dark border)
- **"FLIP"**: 88rpx extra-bold, primary-dark color, light text-shadow for depth
- **"7"**: 152rpx extra-bold, accent gold color, rotated 4-6deg, with multi-layer dark text-shadow stroke effect (8-direction shadows simulating outline)
- The "7" intentionally oversized and slightly rotated to match the packaging's bold, playful style

#### Ribbon Banner (Subtitle)
- Classic retro folded-ribbon style from the original packaging
- **Main body**: Cream background, 3rpx dark border, 4rpx radius
- **Side tails**: Two `::before`/`::after` pseudo-elements extending behind the main body (`z-index: -1`), offset `top: 8rpx` to appear slightly lower, creating a 3D fold-behind effect
- Tail color: slightly darker cream (`darken($color-cream, 8%)`) with matching border
- Text: primary-dark, extra-bold, letter-spacing 8rpx

### Buttons

All buttons use pill shape (999rpx radius), minimum 72rpx height, with colored glow shadows for tactile depth. Transition uses bounce curve `cubic-bezier(0.34, 1.56, 0.64, 1)`.

#### Primary (Gold CTA)
- Background: linear-gradient(135deg, #FFD23F, #E6B800)
- Top gloss layer via `::before` pseudo-element (white gradient overlay)
- Text: #2C3E50, bold
- Height: 96rpx
- Shadow: shadow-accent-glow
- Active: scale(0.95), opacity 0.9, shadow intensifies
- Letter-spacing: 4-6rpx for weight

#### Secondary (Outlined Teal)
- Background: white
- Text: #2BA8A2, bold
- Border: 3rpx solid #2BA8A2
- Height: 88rpx
- Shadow: shadow-teal-glow
- Active: background fills with primary-bg, scale(0.96)

#### Counter Buttons (+/-)
- **Shape**: Rounded square (16rpx radius), NOT circular -- 80rpx x 80rpx
- Must override platform button defaults for width/height/min-height/padding
- Minus: cream background, coral border + text, coral glow on active
- Plus: cream background, teal border + text, teal glow on active
- Active: fills with border color, scale(0.9)

#### BOOM Button (Coral Energy)
- Inactive: cream (#FFF8E7) background, 2rpx border, muted
- Active: coral (#EF6C4A) fill, white text, shadow-coral-glow
- Active adds a subtle pulse animation (2s, infinite)
- Emoji + label layout

#### Flip7 Button (Sky Blue)
- Inactive: cream background, 2rpx border, muted
- Active: sky-blue (#5DADE2) fill, white text, shadow-sky-glow
- Emoji + label layout

### Cards (Scoring Items)

White (#FFFFFF) background, 24rpx rounded corners, shadow-card at rest, 3rpx transparent border + 6rpx colored left accent bar.

- **Default**: Clean white, subtle teal-tinted shadow, teal-light left border
- **Highlighted (First Player)**: Gold left border, golden gradient top, shadow-accent-glow
- **BOOM Active**: Coral left border, coral gradient top, pulse animation (border + shadow oscillation)

### Inputs

- **Surface**: Cream (#FFF8E7) background
- **Border**: 2rpx #E0E0E0, transitions to colored focus ring
- **Focus**: Border becomes sky-blue (#5DADE2), adds 4rpx colored glow ring (sky-blue at 15%)
- **Height**: 80-88rpx, centered text, bold font
- Generous padding for touch targets

### Player Avatar Colors

Each player is automatically assigned a unique color from a fixed 10-color pool. Colors are chosen for maximum visual distinction (hue gap ≥ 30° between adjacent colors) and follow the game's palette tone:

| Index | Color | Hex |
|-------|-------|-----|
| 0 | Red | `#E05C5C` |
| 1 | Orange | `#E07A2F` |
| 2 | Gold Yellow | `#C9A227` |
| 3 | Green | `#5BAD6F` |
| 4 | Teal Green | `#2A9D8F` |
| 5 | Blue | `#3A7DC9` |
| 6 | Purple Blue | `#6A5ACD` |
| 7 | Purple | `#A855A8` |
| 8 | Rose | `#D45E8A` |
| 9 | Dark Green | `#5C8A6E` |

- Colors are assigned in order at player creation, cycling if count exceeds 10
- The color persists across all three pages (setup, game, victory)
- On the game page, the first-player highlight uses a **gold ring outline** (`box-shadow: 0 0 0 3rpx gold`) instead of overriding the background color — ensuring the player's personal color remains visible at all times

### Round Bar (Game Page Header)

The top bar on the game page displays the current round number (left) and the victory target score (right).

#### Target Score Panel
- Vertical two-line layout: small label on top, large number + unit suffix below
- Container: dark semi-transparent background `rgba(0,0,0,0.22)` with 2rpx light border — creates strong contrast against the teal gradient bar
- Number: 48rpx extra-bold, accent gold, with text-shadow for depth
- Unit: small size, white at 75% opacity, baseline-aligned to number
- Minimum width 120rpx for visual balance with the round counter on the left

### Rank Badges

Circular (50%), gradient backgrounds with colored glow shadows:
- **Rank 1 (Champion)**: Gold gradient (#FFD23F to #E6B800), gold glow shadow, displayed on dedicated winner card
- **Rank 2 (Silver)**: 56rpx, silver gradient (#E5E7EB to #9CA3AF), subtle shadow
- **Rank 3 (Bronze)**: 52rpx, coral gradient (#FF8A6A to #D45233), coral glow shadow
- **Rank 4+**: 48rpx, muted gray (#BDC3C7), no glow

### Victory Rankings (Other Players)

The victory page uses a uniform clean-row style for all non-winner players to keep the winner card as the clear focal point:

- **All rows**: Translucent white rounded background (`rgba(255,255,255,0.13)`), rank circle on the left, player avatar (15px radius) with personal color, name and score
- **2nd place**: Rank circle with subtle silver tint (`rgba(180,180,200,0.55)`), 🥈 medal emoji between circle and avatar
- **3rd place**: Rank circle with subtle bronze tint (`rgba(180,100,50,0.45)`), 🥉 medal emoji between circle and avatar
- **4th+**: Rank circle with plain white tint (`rgba(255,255,255,0.20)`), no medal emoji
- All avatars use the player's assigned personal color

### Section Titles

- Left-aligned with emoji icon prefix
- Icon container: fixed-size inline-flex box (width: 32rpx, height: 28rpx) to normalize emoji rendering
- Teal (#2BA8A2) text, bold
- Bottom border: 3rpx dashed (not solid) for playful feel
- Padding-bottom for breathing room

### Progress Bars (Ranking)

- Track: light border (#F0F0F0), full rounded
- Fill: teal gradient (left #3CC4BD to right #2BA8A2)
- Animated width transitions (0.5s ease)

---

## Animations

### Confetti (Victory Page)
- 8 pieces with varied sizes (10-20rpx), shapes (rect/circle), and colors from the full card palette
- Fall animation 3.2-4.5s with rotation and horizontal sway
- Staggered delays for natural feel

### Victory Page Background (Champion Entrance)
- Base layer: multi-stop linear gradient from bright gold (`#FFEA8F`) → deep amber (`#EEA91B`) → dark orange (`#CC6F17`) → teal (`#1E8C86`)
- Layered overlay animations: two animated background layers blending spotlight beams and radial heat glows with opacity transitions — avoids abrupt gradient cuts
- Pseudo-element `::before`: animated spotlight radial gradient drifts over the top area (7.5s alternate)
- Pseudo-element `::after`: two coral side-glows + center burst, drifts slowly (10s alternate)

### Sunburst (Victory Page — Behind Winner Card)
The sunburst sits absolutely behind the winner card and consists of three nested layers (760×760rpx, centered at the winner area):

- **Outer ring**: 16 rays, rotating clockwise at 22s. Long rays (odd indices) are 54×410rpx, short rays (even indices) are 38×300rpx — alternating to create a spiky, explosive silhouette. Odd/even rays use separate pulse animations with staggered per-ray delays for a desynchronized shimmer.
- **Inner ring**: 8 thick rays, rotating counter-clockwise at 11s (opposite direction). Long rays (odd indices) are 108×250rpx, short rays (even indices) are 72×185rpx. All share a pulse animation with alternating duration (2.15s / 3.05s) and per-ray delays for a breathing, chaotic center glow.
- **Core**: Soft radial-gradient white blur circle at the center for a glowing origin point.
- All rays use a triangle clip-path, bottom-center transform origin, and rotational positioning for precise angular placement.
- The whole sunburst element also breathes (scale 1 → 1.04, opacity 0.7 → 1, 6s).

### Winner Card (Victory Page)
White card with gold-foil visual treatment:
- Faint warm gradient background (`#FFFDF4 → #FFF9E8`)
- Two diagonal foil sheen overlays (left-top and right-bottom) using clipped linear gradients
- Gradient border: gold → coral → teal (3rpx solid)
- Top thin highlight line (1px gold at `rgba(255,240,160,0.70)`)
- Champion pill badge centered on the card top edge, gold gradient fill with dark-brown text
- Winner avatar: 38px radius, gold gradient ring, radial glow halo
- Score number uses coral-to-dark-orange gradient fill

### Poster Generation (Victory Page)
Triggered by the share/save button. Renders an offscreen poster at 750×1380px:

- **Rounded corners**: entire poster is clipped on a 48px corner-radius rect before any drawing — gives the saved image natural rounded corners
- **Background**: same champion-entrance gradient + spotlight + heat glows + diagonal beam shafts, drawn via Canvas 2D gradients
- **Sunburst**: 16 outer rays (long/short alternating) + 8 inner rays (long/short alternating), drawn as filled triangles to match the page animation's visual style (static snapshot)
- **Winner card**: gold-foil card with diagonal sheen overlays, gradient border, "🏆" gold badge, avatar with gold ring, name, score (coral gradient), "🎉" label
- **Rankings**: uniform clean rows for all other players; 🥈/🥉 emoji for 2nd/3rd; personal color avatars
- **Emotional tagline**: one of several rotating celebratory phrases rendered in bold white below the ranking list, preceded by a gradient divider line
- **Brand watermark**: small semi-transparent text at the bottom

### Share (All Pages)
- **Setup / Game / ScoreDetail pages**: Share action returns a random title from a pool of generic share phrases; path always opens the setup page
- **Victory page**: uses a separate pool of app-invitation phrases; path also opens the setup page
- An explicit share button is shown on the Setup page and Victory page in the UI

### Crown Bounce (Victory)
- 1.5s ease-in-out infinite
- 4-step keyframe: translateY + scale + subtle left/right rotation (-3deg to 3deg)
- Gold drop-shadow filter for warmth

### Glow Pulse (Winner Card)
- 2s ease-in-out infinite
- Opacity oscillates 0.5 to 1.0
- Scale oscillates 1.0 to 1.03
- Multi-color gradient: gold + coral + teal

### BOOM Pulse
- 2s ease-in-out infinite
- Border color pulses between coral and coral-light
- Subtle shadow intensity oscillation

### Sparkle Effect (Victory)
- Small star shapes using CSS
- Scale and opacity animation (1.5s)
- Scattered around winner card

---

## Do's and Don'ts

1. **Do** use colored glow shadows (coral, teal, gold) to give interactive elements a tactile, toy-like depth -- this is the system's signature.
2. **Do** use pill-shaped buttons consistently for all CTAs and state toggles.
3. **Do** use the cream (#FFF8E7) surface for input fields and interactive areas to differentiate them from white card backgrounds.
4. **Don't** use plain black shadows on interactive elements -- always prefer the matching brand-color glow.
5. **Do** celebrate game moments visually -- BOOM gets coral energy, Flip7 gets sky-blue cool, victory gets full gold glory.
6. **Don't** use more than 2 brand colors in a single component -- pick the appropriate color for the context.
7. **Do** use dashed borders for section dividers to reinforce the playful, hand-drawn game aesthetic.
8. **Don't** make animations longer than 500ms for micro-interactions; save longer durations for celebration moments only.
9. **Do** use left-border color accents on cards to quickly communicate state (gold = first player, coral = BOOM, teal = default).
10. **Do** ensure all touch targets are at least 72rpx tall for comfortable mobile tapping.
11. **Do** use the retro folded-ribbon pattern (main body + z-index:-1 tails behind) for banner/label elements to match the original packaging aesthetic.
12. **Don't** rely on percentage heights in pseudo-elements inside flex children -- use fixed dimensions instead.