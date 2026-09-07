export interface AppUser {
  id: string;
  email: string | null;
  phoneNumber: string;
  name: string;
  gender: string;
  createdAt: string;
  updatedAt: string;
}

export interface AppUserDetail extends AppUser {
  aboutMe?: string | null;
  UserMedia?: Array<{
    id: string;
    kind: string;
    status: string;
    publicUrl: string | null;
    createdAt: string;
  }>;
}
