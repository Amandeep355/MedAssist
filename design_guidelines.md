# Design Guidelines: Medical Diagnosis Assistant for Rural Healthcare

## Design Approach
**System-Based**: Material Design with healthcare-specific adaptations
**Rationale**: Medical applications demand clarity, trust, and accessibility over visual flair. Material Design provides proven patterns for information-dense interfaces with strong visual hierarchy and accessibility.

**Key Principles**:
- Trust through professional, clean design
- Immediate clarity for quick medical decision-making
- Universal accessibility across literacy levels
- Calm, reassuring visual language

---

## Typography

**Font Family**: 
- Primary: 'Inter' (Google Fonts) - exceptional readability for medical data
- Secondary: 'Noto Sans' variants for multilingual support (Hindi, Tamil, Telugu, Bengali)

**Hierarchy**:
- Page Titles: text-3xl to text-4xl, font-semibold
- Section Headers: text-2xl, font-semibold
- Subsections: text-xl, font-medium
- Body Text: text-base, font-normal (16px minimum for medical readability)
- Labels: text-sm, font-medium, uppercase tracking for form fields
- Medical Data/Results: text-lg, font-semibold (diagnoses, confidence scores)
- Helper Text: text-sm, font-normal

---

## Layout System

**Spacing Primitives**: Tailwind units of 3, 4, 6, 8, 12
- Compact spacing: p-3, gap-3 (within cards, tight groupings)
- Standard spacing: p-6, gap-6 (between sections, card padding)
- Section spacing: py-12, gap-12 (major page divisions)

**Grid Structure**:
- Main container: max-w-7xl mx-auto px-4
- Two-column layouts for dashboard: grid-cols-1 lg:grid-cols-3 (sidebar + main)
- Form layouts: Single column max-w-3xl for focus
- Results display: max-w-4xl for optimal reading

---

## Component Library

### Navigation
- Top navigation bar with clinic logo, patient queue indicator, offline status badge
- Sidebar navigation (dashboard view) with icon + label pattern
- Language selector prominent in header
- Breadcrumb navigation for multi-step processes

### Core UI Elements

**Cards**: 
- Elevated with shadow-md, rounded-lg borders
- White background with subtle border-l-4 accent for status indication
- Padding: p-6 standard, p-8 for primary content areas

**Buttons**:
- Primary CTA: Solid, medium size (px-6 py-3), rounded-md, font-medium
- Secondary: Outlined with border-2
- Danger (specialist referral): Distinct solid treatment
- Icon buttons: rounded-full for quick actions

**Forms**:
- Large touch targets (min-h-12) for symptom checkboxes
- Grouped radio buttons for vital signs input
- Multi-select with visual chip indicators
- Inline validation with clear error states
- Floating labels for text inputs

**Data Display**:
- Diagnosis cards with confidence meter (progress bar visualization)
- Treatment protocol accordion with expand/collapse
- Drug interaction alerts as prominent warning banners
- Patient history timeline with date markers
- Vital signs display in grid format with icons

**Badges & Status**:
- Confidence scores: Rounded pill badges (High/Medium/Low)
- Offline indicator: Persistent badge in header
- Patient priority flags: Border-l-4 accent on patient cards
- Language indicator: Subtle badge showing current language

### Medical-Specific Components

**Symptom Checker Interface**:
- Body diagram with clickable regions (if applicable)
- Searchable symptom list with auto-complete
- Selected symptoms as removable chips
- Severity slider for each symptom

**Diagnosis Results Panel**:
- Primary diagnosis highlighted with larger card
- Differential diagnoses in descending confidence order
- Visual confidence meter (0-100%)
- Expandable details for each diagnosis

**Treatment Recommendations**:
- Step-by-step protocol in numbered list
- Drug cards with dosage calculator
- Interaction warnings with high visibility
- Referral trigger with clear call-to-action

### Overlays
- Modal for patient selection (with search)
- Side drawer for patient history quick view
- Confirmation dialog for specialist referral
- Loading states with reassuring medical iconography

---

## Accessibility & Multilingual Considerations

- High contrast ratios for all text (WCAG AAA where possible)
- Icon + text labels throughout (no icon-only buttons)
- Language switching without page reload
- Simple language toggle (Medical/Patient-Friendly) for results
- Keyboard navigation for all interactions
- Focus indicators with visible outline

---

## Visual Cues for Trust

- Professional medical iconography (Heroicons Medical subset)
- Consistent use of medical red cross/green check patterns
- Privacy indicator icon near patient data sections
- Offline capability badge with sync status
- Version/last updated timestamp in footer

---

## Images

**Hero Section**: No traditional hero image
**Application Type**: Dashboard/Tool interface - prioritize immediate functionality

**Medical Icons**: Use established medical iconography from Heroicons or Material Icons
- Stethoscope, pill bottle, warning, user, calendar for navigation
- Body systems icons for symptom categorization
- Alert icons for drug interactions and referrals

---

## Animations

**Minimal Motion**:
- Smooth transitions for language switching (fade, 200ms)
- Progress indicators for diagnosis processing
- Subtle highlight on newly added symptoms
- No decorative animations - maintain professional medical context