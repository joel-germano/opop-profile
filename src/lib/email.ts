import "server-only";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "Opop Profile <no-reply@mail.opop.bio>";

export async function sendFrameInviteEmail(
  to: string,
  { inviterName, inviteUrl }: { inviterName: string; inviteUrl: string }
) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: `${inviterName} te deu uma moldura de apoio`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <p><strong>${inviterName}</strong> comprou uma moldura de apoio a mais e escolheu te presentear com ela.</p>
        <p>É só clicar no botão abaixo, escolher sua foto e a arte é gerada na hora — sem pagar nada.</p>
        <p>
          <a href="${inviteUrl}" style="display:inline-block;padding:12px 24px;background:#47C1F1;color:#000;text-decoration:none;border-radius:999px;font-weight:bold;">
            Criar minha moldura grátis
          </a>
        </p>
        <p>Esse convite vale pra uma única pessoa e deixa de funcionar depois que for usado.</p>
      </div>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject: "Redefinir sua senha — Opop Profile",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <p>Você pediu pra redefinir sua senha na Opop Profile.</p>
        <p>
          <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#47C1F1;color:#000;text-decoration:none;border-radius:999px;font-weight:bold;">
            Redefinir senha
          </a>
        </p>
        <p>Esse link expira em 1 hora. Se você não pediu isso, pode ignorar este email.</p>
      </div>
    `,
  });
}
