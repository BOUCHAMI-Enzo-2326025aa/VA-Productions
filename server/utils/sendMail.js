import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";
import "dotenv/config";

const mailerSend = new MailerSend({
  apiKey: process.env.EMAIL_API_KEY,
});

const sentFrom = new Sender(process.env.EMAIL_HOST, "V.A. Productions");

export const sendMail = async (recipientEmail, subject, htmlContent, textContent) => {
  const recipients = [new Recipient(recipientEmail, "Nouveau Membre")];

  const emailParams = new EmailParams()
    .setFrom(sentFrom)
    .setTo(recipients)
    .setReplyTo(sentFrom)
    .setSubject(subject)
    .setHtml(htmlContent) 
    .setText(textContent);

  try {
    console.log(`-> Tentative d'envoi d'email à ${recipientEmail}...`);
    const response = await mailerSend.email.send(emailParams);
    console.log("Email envoyé avec succès ! Réponse de l'API :", response);
  } catch (error) {
    console.error("Erreur lors de l'envoi de l'email:", error.body);
  }
};