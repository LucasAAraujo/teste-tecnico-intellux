export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  OWNER = 'OWNER',
  USER = 'USER',
}

export enum InviteRole {
  OWNER = 'OWNER',
  USER = 'USER',
}

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
