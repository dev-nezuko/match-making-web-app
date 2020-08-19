export const environment = {
  production: true,
  // apiUrl was missing here entirely, so `ng build --prod` failed on every
  // service that reads it. Only the development file had it.
  apiUrl: '/',
  // Maps keys ship in the page by design. Restrict this one to your own
  // domains in the Google Cloud console or anyone can bill you.
  googleMapsApiKey: '',
};
