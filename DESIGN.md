---
name: Professional Real Estate SaaS
colors:
  surface: '#fcf8fa'
  surface-dim: '#dcd9db'
  surface-bright: '#fcf8fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f5'
  surface-container: '#f0edef'
  surface-container-high: '#eae7e9'
  surface-container-highest: '#e4e2e4'
  on-surface: '#1b1b1d'
  on-surface-variant: '#45464d'
  inverse-surface: '#303032'
  inverse-on-surface: '#f3f0f2'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#006c49'
  on-secondary: '#ffffff'
  secondary-container: '#6cf8bb'
  on-secondary-container: '#00714d'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#2a1700'
  on-tertiary-container: '#b87500'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#6ffbbe'
  secondary-fixed-dim: '#4edea3'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005236'
  tertiary-fixed: '#ffddb8'
  tertiary-fixed-dim: '#ffb95f'
  on-tertiary-fixed: '#2a1700'
  on-tertiary-fixed-variant: '#653e00'
  background: '#fcf8fa'
  on-background: '#1b1b1d'
  surface-variant: '#e4e2e4'
  surface-gray: '#F8FAFC'
  border-gray: '#E2E8F0'
  text-primary: '#1E293B'
  text-secondary: '#64748B'
typography:
  display:
    fontFamily: inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.2'
  h1:
    fontFamily: inter
    fontSize: 30px
    fontWeight: '700'
    lineHeight: '1.3'
  h2:
    fontFamily: inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  h3:
    fontFamily: inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
  body:
    fontFamily: inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  sm:
    fontFamily: inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  xs:
    fontFamily: inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: '1.4'
  display-mobile:
    fontFamily: inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.2'
  h1-mobile:
    fontFamily: inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  sidebar-width: 280px
  max-width-public: 1280px
---

# RealEstateSaaS Design System

## Overview
A professional, high-trust B2B SaaS platform for real estate agencies. The design is clean, data-rich, and optimized for both public property browsing and complex administrative tasks.

## Colors
- **Primary Navy** (#0F172A): Deep, authoritative navy for headers, sidebar, and primary branding.
- **Accent Emerald** (#10B981): Trustworthy green for success states, "Published" badges, and subtle highlights.
- **CTA Orange** (#F59E0B): Warm, high-contrast amber/orange for primary actions and "Add Property" buttons.
- **Surface Gray** (#F8FAFC): Light background for the dashboard and page sections.
- **Border Gray** (#E2E8F0): Subtle borders for cards and tables.
- **Text Primary** (#1E293B): High-contrast slate for readability.
- **Text Secondary** (#64748B): Muted slate for labels and metadata.

## Typography
- **Font Family**: Inter, system-ui, sans-serif
- **Scale**: 
  - Display: 36px / 2.25rem (Hero titles)
  - h1: 30px / 1.875rem (Page headers)
  - h2: 24px / 1.5rem (Section titles)
  - h3: 20px / 1.25rem (Card titles)
  - Body: 16px (Standard text)
  - sm: 14px (Table data, labels)
  - xs: 12px (Badges, timestamps)

## Spacing
- **Base**: 4px
- **sm**: 8px
- **md**: 16px
- **lg**: 24px
- **xl**: 48px

## Components
- **Buttons**:
  - Primary: CTA Orange background, white text, 6px radius, bold.
  - Secondary: White background, Primary Navy border and text.
  - Ghost: No background, Primary Navy text, for sidebar navigation.
- **Cards**:
  - White background, 8px radius, 1px border (#E2E8F0), subtle shadow-sm.
- **Badges**:
  - Published: Emerald green tint background, Emerald green text.
  - Draft: Gray tint background, Gray text.
  - New Lead: Blue tint background, Blue text.
- **Inputs**:
  - 8px radius, Surface Gray background on hover, focus ring in Accent Emerald.

## Layout
- **Dashboard**: Fixed sidebar (280px) with scrollable main content area.
- **Public**: Standard container-width (1280px) with generous whitespace.