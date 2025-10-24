import React from "react";

const make = (name: string, Tag: any = "div") =>
  Object.assign(
    React.forwardRef<any, React.HTMLAttributes<HTMLElement>>(function C(p, r) {
      const { className = "", ...rest } = p;
      return <Tag ref={r} className={`${name} ${className}`.trim()} {...rest} />;
    }),
    { displayName: name }
  );

export const BadgeDNA = make("dna-badge", "span");
export const InfoBadgeDNA = make("dna-badge--info", "span");
export const SuccessBadgeDNA = make("dna-badge--success", "span");
export const WarningBadgeDNA = make("dna-badge--warning", "span");
export const DangerBadgeDNA = make("dna-badge--danger", "span");

export const ButtonDNA = make("dna-btn", "button");
export const PrimaryButtonDNA = make("dna-btn--primary", "button");
export const SecondaryButtonDNA = make("dna-btn--secondary", "button");
export const GhostButtonDNA = make("dna-btn--ghost", "button");
export const DangerButtonDNA = make("dna-btn--danger", "button");

export const ScrollAreaDNA = make("dna-scroll-area", "div");
export const FormFieldDNA = make("dna-form-field", "div");
export const PageHeaderDNA = make("dna-page-header", "header");
export const EntityCardGlass = make("dna-entity-card-glass", "div");
export const StatCardDNA = make("dna-stat-card", "div");
export const MiniStatCardDNA = make("dna-mini-stat-card", "div");
export const HeraButtonDNA = make("dna-hera-button", "button");
export const HeraInputDNA = make("dna-hera-input", "input");
export const HeraGradientBackgroundDNA = make("dna-hera-gradient-bg", "div");
export const HeraBlob = make("dna-hera-blob", "div");

export const CardDNA = Object.assign(make("dna-card", "section"), {
  Header: make("dna-card__header", "header"),
  Content: make("dna-card__content", "div"),
  Footer: make("dna-card__footer", "footer"),
});

export const InfoCardDNA = make("dna-card--info", "section");
export const SuccessCardDNA = make("dna-card--success", "section");
export const WarningCardDNA = make("dna-card--warning", "section");
export const DangerCardDNA = make("dna-card--danger", "section");

// Assessment dashboard exports
export const AssessmentDashboardDNA = make("dna-assessment-dashboard", "div");
export const AssessmentScoreCard = make("dna-assessment-score-card", "div");
export const AssessmentStatusBadge = make("dna-assessment-status-badge", "span");
export const HERA_ASSESSMENT_COLORS = {
  excellent: "#10B981",
  good: "#3B82F6", 
  fair: "#F59E0B",
  poor: "#EF4444"
};