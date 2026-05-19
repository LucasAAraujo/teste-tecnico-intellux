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
