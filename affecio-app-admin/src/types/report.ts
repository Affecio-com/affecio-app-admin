export type ReportStatus = "open" | "reviewing" | "resolved" | "dismissed";
export type ReportType = "user" | "media" | "message" | "profile";

export interface Report {
  id: string;
  type: ReportType;
  status: ReportStatus;
  reporterId: string;
  targetId: string;
  reason: string;
  createdAt: string;
  updatedAt: string;
}
