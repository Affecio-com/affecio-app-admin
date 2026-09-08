export type AccountStatus = "active" | "suspended" | "banned";
export type ActivityStatus = "active" | "recent" | "inactive" | "dormant";
export type VerificationStatus = "none" | "pending" | "approved" | "rejected";

export interface UserRef {
  id: string;
  name: string;
  email: string | null;
  phoneNumber: string | null;
}

export interface AppUser {
  id: string;
  email: string | null;
  phoneNumber: string;
  name: string;
  gender: string;
  createdAt: string;
  updatedAt: string;
  accountStatus: AccountStatus;
  activityStatus: ActivityStatus;
  reportsCount: number;
  openReportsCount: number;
  verificationStatus: VerificationStatus | string;
  profileCompleteness: number;
  mediaCount: number;
}

export interface UserMediaItem {
  id: string;
  kind: string;
  objectKey: string;
  mimeType: string;
  publicUrl: string | null;
  sortOrder: number;
  metadata: unknown;
  status: string;
  createdAt: string;
}

export interface UserMatchItem {
  id: string;
  createdAt: string;
  otherUser: UserRef;
}

export interface UserBlockItem {
  id: string;
  createdAt: string;
  blockedUser?: UserRef;
  blocker?: UserRef;
}

export interface UserSwipeItem {
  id: string;
  action: string;
  createdAt: string;
  updatedAt: string;
  targetUser?: UserRef;
  fromUser?: UserRef;
}

export interface UserCallItem {
  id: string;
  channelName: string;
  status: string;
  startedAt: string;
  endedAt: string | null;
  otherUser: UserRef;
}

export interface UserReportItem {
  id: string;
  type: string;
  status: string;
  reason: string;
  reporterId?: string;
  targetId?: string;
  createdAt: string;
}

export interface UserVerificationItem {
  id: string;
  status: string;
  mediaKey: string;
  submittedAt: string;
  reviewedAt: string | null;
}

export interface AppUserDetail {
  id: string;
  phoneNumber: string;
  email: string | null;
  name: string;
  birthday: string;
  gender: string;
  location: unknown;
  lookingFor: string[];
  aboutMe: string | null;
  startConversation: string | null;
  comfortableWith: string | null;
  customQuestion: string | null;
  customAnswer: string | null;
  createdAt: string;
  updatedAt: string;
  accountStatus: AccountStatus;
  activityStatus: ActivityStatus;
  statusReason: string | null;
  adminNotes: string | null;
  statusChangedAt: string | null;
  verificationStatus: VerificationStatus | string;
  profileCompleteness: number;
  reportsSummary: {
    totalAsTarget: number;
    openAsTarget: number;
    filedByUser: number;
  };
  mediaSummary: {
    total: number;
    confirmed: number;
    pending: number;
    hasProfilePhoto: boolean;
    hasIntroVideo: boolean;
    isVerified: boolean;
  };
  pushTokens: { id: string; platform: string; updatedAt: string }[];
  stats: {
    mediaCount: number;
    matchesCount: number;
    blocksGivenCount: number;
    blocksReceivedCount: number;
    swipesSentCount: number;
    swipesReceivedCount: number;
    callsCount: number;
  };
  reportsAsTarget: UserReportItem[];
  reportsFiled: UserReportItem[];
  verifications: UserVerificationItem[];
  media: UserMediaItem[];
  matches: UserMatchItem[];
  blocksGiven: UserBlockItem[];
  blocksReceived: UserBlockItem[];
  swipesSent: UserSwipeItem[];
  swipesReceived: UserSwipeItem[];
  calls: UserCallItem[];
}

export interface CreateAppUserInput {
  name: string;
  phoneNumber: string;
  email?: string | null;
  gender: string;
  birthday: string;
  lookingFor?: string[];
  aboutMe?: string | null;
  startConversation?: string | null;
  comfortableWith?: string | null;
}

export interface UpdateAppUserInput {
  name?: string;
  email?: string | null;
  phoneNumber?: string;
  gender?: string;
  aboutMe?: string | null;
  startConversation?: string | null;
  comfortableWith?: string | null;
  lookingFor?: string[];
  accountStatus?: AccountStatus;
  statusReason?: string | null;
  adminNotes?: string | null;
}
