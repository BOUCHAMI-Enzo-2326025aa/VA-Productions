export const Roles = {
  Commercial: ["commercial"],
  Admin: ["admin"],
  All: ["commercial", "admin"],
};

export const isRoleValid = (userRole, requiredRole) => {
  console.log("userrole :" + userRole);
  console.log("requiredRole :" + requiredRole);

  // Si l'utilisateur a le rôle 'admin', on lui donne accès à tout
  if (userRole === 'admin') {
    return true;
  }

  return requiredRole.includes(userRole);
};