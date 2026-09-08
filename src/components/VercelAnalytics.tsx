import { Analytics } from "@vercel/analytics/react";
import { Platform } from "react-native";

export function VercelAnalytics() {
  return Platform.OS === "web" ? <Analytics /> : null;
}
