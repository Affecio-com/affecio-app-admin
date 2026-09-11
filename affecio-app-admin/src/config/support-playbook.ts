export const CANNED_REPLIES = [
  {
    id: "welcome",
    label: "Acknowledge",
    body: "Thanks for reaching out to Affecio Support. I’ve reviewed your request and I’m looking into this now. I’ll update you as soon as I have an answer.",
  },
  {
    id: "safety",
    label: "Safety / report",
    body: "I’m sorry you had this experience. Safety is our priority. I’ve flagged the other profile for Trust & Safety review. Please don’t engage further. If you feel at immediate risk, contact local emergency services.",
  },
  {
    id: "unmatch",
    label: "Unmatch / block",
    body: "You can unmatch or block from the conversation screen. Blocking hides both of you from each other and prevents new messages. Let me know if you need us to action this on your behalf.",
  },
  {
    id: "verification",
    label: "Verification",
    body: "Photo verification helps other members know you’re real. Open Profile → Verify and follow the on-screen pose. Reviews usually complete within a few hours.",
  },
  {
    id: "delete",
    label: "Delete account",
    body: "I can start an account deletion for you. This permanently removes your profile, matches, and media. Reply “DELETE” to confirm and we’ll process it.",
  },
  {
    id: "login",
    label: "Can’t log in",
    body: "Try signing in with the same phone or email you used at signup. If that fails, reply with the number/email on the account and we’ll send a recovery path.",
  },
  {
    id: "billing",
    label: "Billing",
    body: "I’ve checked your account. If this is a charge or subscription question, reply with the date and last four digits on the statement and we’ll look it up. Refunds follow our published policy.",
  },
  {
    id: "waiting",
    label: "Need more info",
    body: "I need a bit more from you before I can finish this. Please reply with screenshots and the approximate time this happened (including your timezone).",
  },
];

export const SUPPORT_PLAYBOOK = [
  {
    title: "What this desk is",
    body: "Affecio Support is the member-facing help desk for a dating product. You own the relationship with the member: log the complaint, chat in the live thread, keep them updated, and close the loop. Trust & Safety (reports, bans) and Engineering (bugs) are separate queues you escalate into — you do not dump work sideways in Slack.",
  },
  {
    title: "How a ticket should look",
    body: "Every inbound complaint becomes a ticket on the member’s account. First message should be the member’s words when possible. Assign it to yourself, set category and priority, then reply within SLA. Internal notes are for teammates only — never put policy debates or other members’ data in the member-visible thread.",
  },
  {
    title: "Response SLAs",
    body: "Urgent (safety, account takeover, active harassment): first reply within 1 hour. High (can’t log in, payment failed, verification stuck): 4 hours. Medium (matching, profile, product how-to): 24 hours. Low (feedback, feature requests): 48 hours. If you will miss SLA, leave an internal note and tell the member you are still on it.",
  },
  {
    title: "Safety complaints",
    body: "Harassment, threats, non-consensual photos, impersonation, or underage concerns: 1) Reassure and tell them not to engage. 2) Collect screenshots, timestamps, and the other profile. 3) Confirm a Trust & Safety report exists. 4) Escalate to Admin immediately if the account should be suspended or banned. 5) If someone is in physical danger, tell them to contact local emergency services — we are not emergency services.",
  },
  {
    title: "Matching & discovery",
    body: "No new cards, repeat profiles, or a match that vanished. Check account status, blocks both ways, last activity, and verification. If the account looks healthy and the product still misbehaves, escalate to Developer with user ID, device, OS, app version, and exact steps.",
  },
  {
    title: "Account access",
    body: "Confirm identity with the name plus phone or email on file before changing anything. Do not reset access unless you are confident it is the owner. Takeover attempts, SIM-swap stories, and “my partner logged in” go to Admin. Never share another member’s contact details, photos, or location.",
  },
  {
    title: "Billing & subscriptions",
    body: "Do not promise refunds. Collect the charge date, amount, and store (App Store / Play / web). If it is a policy exception or chargeback risk, escalate to Admin. Product billing bugs (double charge, entitlement missing after pay) go to Developer with timestamps.",
  },
  {
    title: "When to escalate to Admin",
    body: "Ban or suspend decisions, legal / press / law-enforcement, celebrity impersonation, payment disputes, privacy deletion beyond self-serve, or any policy call you are not authorized to make. Write what you already tried, attach the member’s ask, and set priority honestly.",
  },
  {
    title: "When to escalate to Developer",
    body: "Crashes, failed uploads, push not delivering, call drops, corrupted profile data, or anything that needs a code or infra fix. Include user ID, ticket ID, device, OS, app version, exact timestamps, and steps to reproduce. Do not escalate “I don’t know” how-to questions.",
  },
  {
    title: "Tone of voice",
    body: "Warm, brief, and adult. Affecio is a dating product — be respectful, never flirty, never judgmental. Don’t over-promise. Don’t joke about someone’s appearance, orientation, or matches. Close the loop when Admin or Engineering replies.",
  },
];
