import React from "react";
import LinkCard from "./LinkCard";
import contactImg from "../../../assets/contact-illustration.avif";
import facturationImg from "../../../assets/facture-illustration.png";
import calendarImg from "../../../assets/calendar-illustration.avif";
import orderImg from "../../../assets/order-illustration.avif";

const LinkList = ({ isEditing = false }) => {
  return (
    <div className="w-full grid gap-2 mt-8 grid-cols-1 md:grid-cols-2 xl:grid-cols-4">
      <LinkCard
        img={contactImg}
        title={"Contacts"}
        subTitle={"Retrouvez la liste de tous les contacts enregistrés"}
        link={"/contacts"}
        isEditing={isEditing}
        titleKey="dashboard:link:contacts:title"
        subTitleKey="dashboard:link:contacts:subtitle"
      />
      <LinkCard
        img={orderImg}
        title={"COMMANDES"}
        subTitle={"Retrouvez la liste des commandes et leurs statuts"}
        link={"/order"}
        isEditing={isEditing}
        titleKey="dashboard:link:orders:title"
        subTitleKey="dashboard:link:orders:subtitle"
      />
      <LinkCard
        img={facturationImg}
        title={"FACTURATION"}
        subTitle={"Retrouvez la liste des factures et leurs statuts"}
        link={"/invoice"}
        isEditing={isEditing}
        titleKey="dashboard:link:invoices:title"
        subTitleKey="dashboard:link:invoices:subtitle"
      />
      <LinkCard
        img={calendarImg}
        title={"CALENDRIER"}
        subTitle={"Retrouvez les prochains rendez-vous et appels"}
        link={"/calendrier"}
        isEditing={isEditing}
        titleKey="dashboard:link:calendar:title"
        subTitleKey="dashboard:link:calendar:subtitle"
      />
    </div>
  );
};

export default LinkList;
