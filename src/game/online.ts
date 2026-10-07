/** Limits shared by the server and the online UI. */
export const MIN_SEND = 50;
export const MAX_SEND = 150_000;
export const DAILY_CAP = 500_000;
export const REPORT_REASONS = [
  { id: "harassment", label: "Bullying or harassment" },
  { id: "hate", label: "Hate" },
  { id: "sexual", label: "Sexual content" },
  { id: "scam", label: "Scam" },
  { id: "spam", label: "Spam" },
  { id: "other", label: "Something else" },
];
