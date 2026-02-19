import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT) || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const INVITATION_FROM = process.env.INVITATION_FROM_EMAIL || process.env.SMTP_USER || "noreply@snack.local";
/** 초대 이메일 안의 가입 링크 base. 미설정 시 marin-snack.store 사용 */
const FRONTEND_SIGNUP_URL = process.env.FRONTEND_SIGNUP_URL || "https://marin-snack.store/signup";

function getTransport() {
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error(
      "이메일 발송을 위해 .env에 SMTP_HOST, SMTP_USER, SMTP_PASS를 설정해주세요."
    );
  }
  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
}

/**
 * 가입 초대 이메일 발송. 링크에 token 쿼리 포함.
 */
export async function sendInvitationEmail(toEmail: string, token: string): Promise<void> {
  const signupLink = `${FRONTEND_SIGNUP_URL.replace(/\/$/, "")}?token=${encodeURIComponent(token)}`;
  const transport = getTransport();

  await transport.sendMail({
    from: INVITATION_FROM,
    to: toEmail,
    subject: "[Snack] 가입 초대 링크",
    text: `아래 링크로 접속하여 회원가입을 완료해주세요.\n\n${signupLink}\n\n이 링크는 7일간 유효합니다.`,
    html: `
      <p>Snack 서비스 가입 초대입니다.</p>
      <p>아래 버튼 또는 링크로 접속하여 회원가입을 완료해주세요.</p>
      <p><a href="${signupLink}" style="display:inline-block; padding:10px 20px; background:#333; color:#fff; text-decoration:none;">가입하기</a></p>
      <p><small>또는 링크 복사: ${signupLink}</small></p>
      <p>이 링크는 7일간 유효합니다.</p>
    `,
  });
}
