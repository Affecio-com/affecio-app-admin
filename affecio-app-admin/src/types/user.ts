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
  stats: {
    mediaCount: number;
    matchesCount: number;
    blocksGivenCount: number;
    blocksReceivedCount: number;
    swipesSentCount: number;
    swipesReceivedCount: number;
    callsCount: number;
  };
  media: UserMediaItem[];
  matches: UserMatchItem[];
  blocksGiven: UserBlockItem[];
  blocksReceived: UserBlockItem[];
  swipesSent: UserSwipeItem[];
  swipesReceived: UserSwipeItem[];
  calls: UserCallItem[];
}
