export default {
  async fetch() {
    const destinationURL = "https://redentor.dev";
    const statusCode = 308;
    return Response.redirect(destinationURL, statusCode);
  },
};
