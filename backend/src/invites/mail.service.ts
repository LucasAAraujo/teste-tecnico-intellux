import { Injectable, Logger } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';
import { InviteRole } from '../database/entities/invite.entity';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;

  constructor() {
    this.transporter = createTransport({
      host: process.env.MAIL_HOST ?? 'localhost',
      port: Number(process.env.MAIL_PORT ?? 1025),
      ignoreTLS: true,
    });
  }

  async sendInvite(to: string, token: string, role: InviteRole): Promise<void> {
    const baseUrl = process.env.APP_URL ?? 'http://localhost:5173';
    const link = `${baseUrl}/invites/activate?token=${token}`;
    const subject =
      role === InviteRole.OWNER
        ? 'Você foi convidado para criar sua organização no Intellux'
        : 'Você foi convidado para uma organização no Intellux';

    await this.transporter.sendMail({
      from: process.env.MAIL_FROM ?? 'noreply@intellux.com',
      to,
      subject,
      html: `
        <p>Olá,</p>
        <p>Clique no link abaixo para ativar seu convite. O link expira em <strong>48 horas</strong>.</p>
        <p><a href="${link}">${link}</a></p>
      `,
    });

    this.logger.log(`Invite email sent to ${to}`);
  }
}
