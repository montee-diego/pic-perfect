//Get query value
const searchQuery = sessionStorage.getItem("query");

//If query, perform search and clear query value
if (searchQuery) {
  //loadSearchResults(searchQuery, requestUID());
  pexels.fetchSearch(searchQuery);
  sessionStorage.removeItem("query");
}
