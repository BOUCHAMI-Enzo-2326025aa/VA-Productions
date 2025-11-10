import Contact from "../model/contactModel.js";

export const getAllContacts = async (req, res) => {
  try {
    const contactList = await Contact.find({}).sort({ company: 1 });
    res.status(200).json({ contactList: contactList });
  } catch (error) {
    console.log(error);
    res.status(500).json({ erreur: error.message });
  }
};

export const getContactById = async (req, res) => {
  try {
    const { id } = req.params;
    const contact = await Contact.findById(id);
    res.status(200).json(contact);
  } catch (error) {
    console.log(error);
    res.status(500).json({ erreur: error.message });
  }
};

export const createContact = async (req, res) => {
  try {
    const {
      company,
      name,
      surname,
      email,
      phoneNumber,
      siret,
      numTVA,
      delaisPaie,
      comments,
      lastCall,
      status,
    } = req.body;

    const contact = await Contact.create({
      company,
      name,
      surname,
      email,
      phoneNumber,
      siret,
      numTVA,
      delaisPaie,
      comments,
      lastCall,
      status,
    });
    res.status(200).json({ contact });
  } catch (error) {
    console.log(error);
    res.status(500).json({ erreur: error.message });
  }
};

export const updateContact = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      company,
      name,
      surname,
      email,
      phoneNumber,
      siret,
      numTVA,
      delaisPaie,
      comments,
    } = req.body;

    const updatedData = {};
    if (company) updatedData.company = company;
    if (name) updatedData.name = name;
    if (surname) updatedData.surname = surname;
    if (email) updatedData.email = email;
    if (phoneNumber) updatedData.phoneNumber = phoneNumber;
    if (siret !== undefined) updatedData.siret = siret;
    if (numTVA !== undefined) updatedData.numTVA = numTVA;
    if (delaisPaie !== undefined) updatedData.delaisPaie = delaisPaie;
    if (comments) updatedData.comments = comments;

    const updatedContact = await Contact.findByIdAndUpdate(
      id,
      {
        $set: updatedData,
      },
      { new: true, runValidators: true }
    );
    res.status(200).json({ updatedContact });
  } catch (error) {
    console.log(error);
    res.status(500).json({ erreur: error.message });
  }
};

export const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedContact = await Contact.findByIdAndDelete(id);
    if (!deletedContact) {
      res.status(400).send(`Le contact (${id}) est introuvable !`);
    }
    res
      .status(200)
      .send(`Le contact ayant comme id ${id} vient d'être supprimé !`);
  } catch (error) {
    console.log(error);
    res.status(500).json({ erreur: error.message });
  }
};
