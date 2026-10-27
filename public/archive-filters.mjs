export const photographicCategories=['documentary','contemporary','portrait','sports','aerial','nature'];
export function archiveFilterGroups(filter) {
  return filter==='film'?[['all','art','film']]:[['all','art','film'],photographicCategories];
}
