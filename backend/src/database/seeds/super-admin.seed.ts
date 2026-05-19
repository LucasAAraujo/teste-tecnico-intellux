import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import { AppDataSource } from '../data-source';
import { User, UserRole } from '../entities/user.entity';

async function seedSuperAdmin(): Promise<void> {
  await AppDataSource.initialize();

  const userRepo = AppDataSource.getRepository(User);

  const email = process.env.SUPER_ADMIN_EMAIL ?? 'admin@intellux.com';
  const existing = await userRepo.findOne({ where: { email } });

  if (existing) {
    console.log(`Super Admin já existe: ${email}`);
    await AppDataSource.destroy();
    return;
  }

  const password = process.env.SUPER_ADMIN_PASSWORD ?? 'changeme';
  const passwordHash = await bcrypt.hash(password, 12);

  const superAdmin = userRepo.create({
    name: process.env.SUPER_ADMIN_NAME ?? 'Super Admin',
    email,
    passwordHash,
    role: UserRole.SUPER_ADMIN,
    organizationId: null,
  });

  await userRepo.save(superAdmin);
  console.log(`Super Admin criado com sucesso: ${email}`);

  await AppDataSource.destroy();
}

seedSuperAdmin().catch((err) => {
  console.error('Erro ao criar Super Admin:', err);
  process.exit(1);
});
