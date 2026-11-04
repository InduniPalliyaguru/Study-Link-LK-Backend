import * as nodemailer from "nodemailer"

let transporter: nodemailer.Transporter | null = null

const getTransporter = () => {
  const { SMTP_HOST, SMTP_USER, SMTP_PASS } = process.env

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null
  }

  if (!transporter) {
    const port = Number(process.env.SMTP_PORT) || 465

    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
    })
  }

  return transporter
}

export const escapeHtml = (text: string) =>
  text.replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ] as string,
  )

export const emailLayout = (
  heading: string,
  bodyHtml: string,
  buttonText: string,
  link: string,
) => `
<div style="background:#f2f4ff;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#14163a">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden">
    <div style="background:linear-gradient(135deg,#7c5cff,#00d1ff);padding:20px 24px;color:#ffffff;font-size:20px;font-weight:bold">
      StudyLink LK
    </div>
    <div style="padding:24px">
      <h2 style="margin:0 0 12px;font-size:20px">${heading}</h2>
      <div style="font-size:15px;line-height:1.6">${bodyHtml}</div>
      <p style="margin:24px 0 8px">
        <a href="${link}" style="background:#7c5cff;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:bold;display:inline-block">${buttonText}</a>
      </p>
      <p style="font-size:12px;color:#646a98;margin-top:20px">
        For your safety, phone numbers and addresses are never sent by email. Log in to StudyLink LK to see them.
      </p>
    </div>
  </div>
</div>`

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const mailer = getTransporter()

    if (!mailer) {
      console.log(`Email skipped (SMTP is not set up): ${subject}`)
      return
    }

    await mailer.sendMail({
      from: process.env.MAIL_FROM || `StudyLink LK <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    })
  } catch (error) {
    console.error(
      "Could not send email:",
      error instanceof Error ? error.message : error,
    )
  }
}
