import { Injectable, Logger } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';
import { InviteRole } from '../database/entities/invite.entity';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter;

  constructor() {
    this.transporter = createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 465),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendInvite(to: string, token: string, role: InviteRole): Promise<void> {
    const baseUrl = process.env.FRONTEND_URL ?? 'http://localhost:5173';
    const link = `${baseUrl}/activate?token=${token}`;
    const subject =
      role === InviteRole.OWNER
        ? 'Você foi convidado para criar sua organização no Intellux'
        : 'Você foi convidado para uma organização no Intellux';

    await this.transporter.sendMail({
      from: `"Intellux Drive" <${process.env.SMTP_USER}>`,
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
