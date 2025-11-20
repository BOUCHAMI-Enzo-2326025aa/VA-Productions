import * as brevo from "@getbrevo/brevo";
import "dotenv/config";

// Configuration de l'API Brevo
const apiInstance = new brevo.TransactionalEmailsApi();
apiInstance.setApiKey(
  brevo.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY
);

export const sendMail = async (recipientEmail, subject, htmlContent, textContent) => {
  try {
    const sendSmtpEmail = new brevo.SendSmtpEmail();

    // Configuration de l'expéditeur
    sendSmtpEmail.sender = {
      name: process.env.BREVO_SENDER_NAME || "V.A. Productions",
      email: process.env.BREVO_SENDER_EMAIL,
    };

    // Configuration du destinataire
    sendSmtpEmail.to = [
      {
        email: recipientEmail,
        name: "Nouveau Membre",
      },
    ];

    // Configuration du contenu
    sendSmtpEmail.subject = subject;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.textContent = textContent;

    // Répondre à l'expéditeur
    sendSmtpEmail.replyTo = {
      email: process.env.BREVO_SENDER_EMAIL,
      name: process.env.BREVO_SENDER_NAME || "V.A. Productions",
    };

    console.log(`Tentative d'envoi d'email à ${recipientEmail}...`);
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log("Email envoyé avec succès ! Réponse de l'API :", response);
  } catch (error) {
    console.error("❌ Erreur lors de l'envoi de l'email :", error);
    throw error;
  }
};