const http = require("http");
const request = require("axios");

const host = "0.0.0.0";
// Port to handle customer requests on
const webPort = process.env.SERVER_PORT || 8080;
// Port to test health of the service on
const healthPort = process.env.HEALTH_PORT || 8081;

const nasaUrl = "https://api.nasa.gov/planetary/apod?hd=hd&";

const webServer = http.createServer(async (req, res) => {
  try {
    const date = req.url.match(/date=(.*)&?/);
    if (!date || date.length < 1 || !validateDateFormat(date[1])) {
      throw new Error(
        "Date is a required argument and must be in a form: %Y-%m-%d. (e.g. 2012-01-17)"
      );
    }
    console.log(`Date is: ${date[1]}`);
    getImage(date[1])
      .then((image) => {
        res.setHeader("Content-Type", "image/jpeg");
        res.writeHead(200);
        res.end(image);
      })
      .catch((err) => new Error(`Failed due to: ${err}`));
  } catch (reason) {
    const responseMsg = {status: 'error', message: 'failed to fetch NASA image of the day', reason: `${reason}`};
    res.writeHead(500);
    res.end(JSON.stringify(responseMsg));
  }
});

const healthServer = http.createServer((req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.writeHead(200).end(JSON.stringify({ status: "OK" }));
});

// check to see if API key is passed in
if (!process.env.API_KEY) {
  console.error("Missing NASA API KEY. Aborting.");
  return 1;
}

webServer.listen(webPort, host, () => {
  console.log(`Web Server is running on http://${host}:${webPort}`);
});
healthServer.listen(healthPort, host, () => {
  console.log(`Health Server is running on http://${host}:${healthPort}`);
});

function getImage(date) {
  const apiKey = process.env.API_KEY;

  const urlToFetch = `${nasaUrl}&api_key=${apiKey}&date=${date}`;

  console.log(`Target url is: ${urlToFetch}`);
  return request
    .get(urlToFetch)
    .then((response) => response.data.url)
    .then((imageUrl) => {
      console.log(`About to fetch an image from ${imageUrl}`);
      return imageUrl;
    })
    .then((imageUrl) => request.get(imageUrl, { responseType: "arraybuffer" }))
    .then((res) => Buffer.from(res.data));
}

function validateDateFormat(date) {
  return date.search(/^\d{4}-\d{2}-\d{2}$/) === 0;
}
