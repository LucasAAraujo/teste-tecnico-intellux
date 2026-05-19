export const UserRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  OWNER: 'OWNER',
  USER: 'USER',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const InviteRole = {
  OWNER: 'OWNER',
  USER: 'USER',
} as const;
export type InviteRole = (typeof InviteRole)[keyof typeof InviteRole];

export type AuthUser = {
  sub: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string | null;
};

export type InviteValidation = {
  email: string;
  role: InviteRole;
};

export type Organization = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
};

export type Member = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  createdAt: string;
};

export const FileType = {
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
} as const;
export type FileType = (typeof FileType)[keyof typeof FileType];

export type FileUploader = {
  id: string;
  name: string;
};

export type FileItem = {
  id: string;
  organizationId: string;
  createdBy: string;
  name: string;
  type: FileType;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
  uploader?: FileUploader;
};

export type FileFilters = {
  type?: FileType;
  search?: string;
  from?: string;
  to?: string;
  userId?: string;
};

export type Invite = {
  id: string;
  email: string;
  role: InviteRole;
  expiresAt: string;
  acceptedAt: string | null;
  organizationId: string | null;
  createdBy: string;
  createdAt: string;
};
