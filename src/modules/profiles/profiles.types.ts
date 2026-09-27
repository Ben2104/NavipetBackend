export const ProfileRoles = ['student', 'professor'] as const;

export type ProfileRole = (typeof ProfileRoles)[number];

export const AVATAR_BUCKET = 'avatars';
export const DEFAULT_AVATAR_PATH = 'defaults/avatar.webp';
export const AVATAR_SIGNED_URL_TTL_SECONDS = 60 * 60;
export const PENDING_AVATAR_MAX_AGE_MILLISECONDS = 24 * 60 * 60 * 1_000;

export interface ProfileRecord {
  displayName: string;
  email: string | null;
  role: ProfileRole | null;
  avatarUrl: string;
}

export interface UpdateProfileInput {
  displayName?: string;
  email?: string;
  role?: ProfileRole;
  avatarUploadId?: string;
}

export interface ProfileAvatarUpload {
  uploadId: string;
  avatarUrl: string;
}
