import Section from "./Section";
import Title from "./Title";
import Paragraph from "./Paragraph";
import Navigation from "./Navigation";

const Guide = () => {
  return (
    <div className="text-[#3F3F3F] mt-10 w-full flex flex-col gap-10">
      <a
        href="/guide.pdf"
        download="Guide d'utilisation.pdf"
        target="_blank"
        rel="noopener noreferrer"
        className="bg-blue-500 text-white px-4 py-2 rounded w-fit self-center md:self-start"
      >
        Télécharger le Guide PDF
      </a>
      <div className="flex flex-col lg:flex-row justify-between relative">
        <div className="w-full lg:w-[50%]">
          <Section className="mt-16" name="dashboard">
            <Title texte="I - Dashboard" />
            <Paragraph>
              <p>
                Le <b>Dashboard</b> est la page sur laquelle vous atterrissez
                lors du lancement de l'application. Sur le Dashboard, vous
                pouvez retrouver toutes les informations essentielles telles que
                les prochains <b>rendez-vous</b>, les <b>factures</b> récentes,
                mais aussi des <b>statistiques</b> sur la prospection.
              </p>
              <p>
                Vous pouvez également accéder aux autres pages à l'aide de la
                <b> navigation rapide</b> en haut du Dashboard.
              </p>
            </Paragraph>
          </Section>

          <Section className="mt-16" name="gestion-contacts">
            <Title texte="II - Gestion des contacts" />
            <Paragraph>
              <p>
                La page <b>Contacts</b> permet d'accéder à la liste des contacts
                enregistrés par les utilisateurs.
              </p>
            </Paragraph>
            <Paragraph subtitle="Ajouter un contact" className="mt-4">
              <p>
                Il est possible de créer un contact en cliquant sur le bouton
                dédié. Remplissez tous les champs obligatoires pour que le
                contact soit correctement enregistré dans la liste.
              </p>
            </Paragraph>
            <Paragraph subtitle="Informations du contact">
              <p>
                En cliquant sur un contact, vous pouvez obtenir davantage
                d'informations sur le client, ainsi que les derniers
                commentaires laissés par les prospecteurs, afin de suivre la
                situation des échanges.
              </p>
            </Paragraph>
            <Paragraph subtitle="Modification et suppression">
              <p>
                Vous pouvez également modifier ou supprimer un contact en
                cliquant sur les boutons dédiés.
              </p>
            </Paragraph>
          </Section>

          <Section className="mt-16" name="gestion-rendezvous">
            <Title texte="III - Gestion des rendez-vous" />
            <Paragraph>
              <p>
                La page <b>Calendrier</b> permet d'accéder à la liste des
                rendez-vous enregistrés par les utilisateurs.
              </p>
            </Paragraph>
            <Paragraph subtitle="Connexion à Google Calendar" className="mt-4">
              <p>
                Vous avez la possibilité de synchroniser vos rendez-vous avec
                Google Calendar. Pour cela, cliquez sur le bouton correspondant
                et choisissez le compte Google avec lequel vous souhaitez
                synchroniser les rendez-vous. Pour vous déconnecter, cliquez
                simplement sur le bouton de déconnexion.
              </p>
            </Paragraph>
            <Paragraph subtitle="Ajouter un rendez-vous">
              <p>
                Il est possible de créer un rendez-vous en cliquant sur le
                bouton dédié. Remplissez tous les champs obligatoires pour que
                le rendez-vous soit correctement enregistré dans la liste.
              </p>
            </Paragraph>
            <Paragraph subtitle="Suppression et modification">
              <p>
                Vous pouvez également modifier ou supprimer un rendez-vous en
                cliquant sur les boutons dédiés.
              </p>
            </Paragraph>
          </Section>

          <Section className="mt-16" name="gestion-factures">
            <Title texte="IV - Gestion des factures" />
            <Paragraph>
              <p>
                La page <b>Factures</b> permet d'accéder à la liste des factures
                enregistrées par les utilisateurs. Vous pouvez voir toutes les
                informations sur les factures, les télécharger et valider leur
                paiement.
              </p>
            </Paragraph>
            <Paragraph subtitle="Filtrer les factures" className="mt-4">
              <p>
                Vous pouvez filtrer les factures par date, support, statut ou
                client. Cliquez sur le bouton de filtre, choisissez parmi les
                options proposées, puis appuyez sur le bouton "Rechercher". Vous
                pouvez également réinitialiser les filtres en cliquant sur le
                bouton "Réinitialiser".
              </p>
            </Paragraph>
            <Paragraph subtitle="Valider le paiement">
              <p>
                Une fois le paiement reçu, vous pouvez valider la facture
                correspondante en cliquant sur le bouton "Valider".
              </p>
            </Paragraph>
          </Section>

          <Section className="mt-16" name="gestion-commandes">
            <Title texte="V - Gestion des commandes" />
            <Paragraph>
              <p>
                La page <b>Commandes</b> permet d'accéder à la liste des
                commandes enregistrées par les utilisateurs. Vous pouvez voir
                toutes les informations sur les commandes, les télécharger et
                valider leur paiement pour les transformer en factures.
              </p>
            </Paragraph>
            <Paragraph subtitle="Créer une commande">
              <p>
                <b>Sélection du contact :</b> Choisissez un contact existant
                dans le menu déroulant ou créez un nouveau contact si
                nécessaire. Lors de la création d’un nouveau contact, les champs
                obligatoires tels que le nom, le prénom, l’adresse e-mail et le
                numéro de téléphone doivent être renseignés.
              </p>
              <p>
                <b>Définition des détails de la commande :</b> Une fois le
                contact sélectionné, remplissez les informations spécifiques au
                bon de commande, telles que les produits ou services inclus,
                leurs quantités, et leurs prix. Si des supports spécifiques sont
                nécessaires pour la commande, ils peuvent également être ajoutés
                à cette étape.
              </p>
              <p>
                <b>Validation et génération :</b> Avant de finaliser, une page
                récapitulative affichera tous les détails de la commande, y
                compris les informations du client, les éléments commandés, et
                le montant total avec les taxes applicables. Après vérification,
                signez puis cliquez sur "Confirmer" pour valider la commande et
                générer automatiquement un PDF récapitulatif.
              </p>
            </Paragraph>
          </Section>

          <Section className="mt-16" name="gestion-utilisateurs">
            <Title texte="VI - Gestion des utilisateurs" />
            <Paragraph>
              <p>
                La page <b>Gestion des utilisateurs</b> affiche une liste
                complète des utilisateurs enregistrés. Vous pouvez visualiser
                des informations telles que le nom, l’e-mail, le rôle et la date
                de création.
              </p>
            </Paragraph>
            <Paragraph subtitle="Modifier un utilisateur">
              <p>
                En cliquant sur un utilisateur, vous pouvez modifier ses
                informations, comme son rôle ou son e-mail, en temps réel.
              </p>
            </Paragraph>
            <Paragraph subtitle="Ajouter un utilisateur">
              <p>
                Pour ajouter un nouvel utilisateur, cliquez sur le bouton "+
                Ajouter". Remplissez les champs obligatoires (nom, prénom,
                e-mail, rôle) et sauvegardez pour l’enregistrer dans le système.
              </p>
            </Paragraph>
          </Section>

          <Section className="mt-16" name="stats">
            <Title texte="VII - Statistiques" />
            <Paragraph>
              <p>
                La page <b>Statistiques</b> permet de consulter les performances
                de chaque support. Vous pouvez visualiser le nombre de ventes
                réalisées sur une période donnée.
              </p>
            </Paragraph>
          </Section>
        </div>
        <Navigation />
      </div>
    </div>
  );
};

export default Guide;