import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";
import type { EmailTemplateData } from "./registry";
export function SecurityAlertEmail({siteName,newEmail}:EmailTemplateData) {
  return <Html lang="en"><Head/><Preview>Your {siteName} account was updated</Preview><Body><Container><Heading>Account security update</Heading><Text>{newEmail}</Text><Text>If you did not make this change, reset your password immediately and contact Pattern support. Assistants must be linked again after a password reset or change.</Text></Container></Body></Html>;
}