const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_REGEX = /^[a-zA-ZÀ-ÿ\s'-]+$/;

export const validateLogin = (req, res, next) => {
  const { username, password } = req.body; 

  // Validation email/username 
  if (!username || typeof username !== 'string' || !EMAIL_REGEX.test(username)) {
    return res.status(400).json({ error: "Format d'email invalide" });
  }

  // Validation password 
  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: "Format de mot de passe invalide (attendu: texte)" });
  }

  next();
};

export const validateCreateUser = (req, res, next) => {
  const { email, nom, prenom, role, password } = req.body;

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: "Email invalide" });
  }

  if (!nom || typeof nom !== 'string' || nom.length < 2 || !NAME_REGEX.test(nom)) {
    return res.status(400).json({ error: "Nom invalide" });
  }
  
  if (!prenom || typeof prenom !== 'string' || prenom.length < 2 || !NAME_REGEX.test(prenom)) {
    return res.status(400).json({ error: "Prénom invalide" });
  }

  if (role && !['admin', 'commercial'].includes(role)) {
    return res.status(400).json({ error: "Rôle invalide" });
  }

  if (password && typeof password !== 'string') {
    return res.status(400).json({ error: "Format de mot de passe invalide (attendu: texte)" });
  }

  next();
};