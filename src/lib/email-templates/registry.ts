import type { ComponentType } from "react";
import { SignupEmail } from "./signup";
import { RecoveryEmail } from "./recovery";
import { EmailChangeEmail } from "./email-change";
import { SecurityAlertEmail } from "./security-alert";

export interface EmailTemplateData {
  siteName: string;
  siteUrl: string;
  recipient: string;
  confirmationUrl: string;
  oldEmail: string;
  email: string;
  newEmail: string;
}
export interface TemplateEntry {
  component: ComponentType<EmailTemplateData>;
  subject: string | ((data: EmailTemplateData) => string);
  displayName?: string;
  previewData?: EmailTemplateData;
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string;
}

/**
 * Template registry — maps template names to their React Email components.
 * Import and register new templates here after creating them in this directory.
 *
 * Example:
 *   import { template as welcomeTemplate } from './welcome'
 *   // then add to TEMPLATES: 'welcome': welcomeTemplate
 */
// Preview-only sample data; never used for real sends.
const PREVIEW_DATA: EmailTemplateData = {
  siteName: "Pattern",
  siteUrl: "https://patterns.lakefrontdigital.io",
  recipient: "user@example.test",
  confirmationUrl: "https://patterns.lakefrontdigital.io/auth",
  oldEmail: "old@example.test",
  email: "user@example.test",
  newEmail: "new@example.test",
};

export const TEMPLATES: Record<string, TemplateEntry> = {
  "security-alert": {
    component: SecurityAlertEmail,
    subject: "Your Pattern account was updated",
    displayName: "Security alert",
    previewData: PREVIEW_DATA,
  },
  "account-confirmation": {
    component: SignupEmail,
    subject: "Confirm your Pattern email",
    displayName: "Account confirmation",
    previewData: PREVIEW_DATA,
  },
  "password-reset": {
    component: RecoveryEmail,
    subject: "Reset your Pattern password",
    displayName: "Password reset",
    previewData: PREVIEW_DATA,
  },
  "email-change": {
    component: EmailChangeEmail,
    subject: "Confirm your new Pattern email",
    displayName: "Email change",
    previewData: PREVIEW_DATA,
  },
};
