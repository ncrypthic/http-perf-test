const fs = require("fs");
const spdy = require("spdy");
const express = require("express");
const promMid = require("express-prometheus-middleware");

const app = express();

app.use(
  promMid({
    metricsPath: "/metrics",
    collectDefaultMetrics: true,
    requestDurationBuckets: [0.1, 0.5, 1, 1.5],
    requestLengthBuckets: [512, 1024, 5120, 10240, 51200, 102400],
    responseLengthBuckets: [512, 1024, 5120, 10240, 51200, 102400],
  })
);

app.use((req, res, next) => {
  if (req.protocol === "http") {
    return next();
  }
  if (!req.client.authorized) {
    return res.status(401).send("Invalid client certificate authentication.");
  }
  return next();
});

app.get("*", (req, res) => {
  const latency = Math.round(Math.random() * (250 - 50)) + 50;
  setTimeout(() => {
    res.status(200).json({ hello: "world" });
    console.log(`connection: ${req.headers.connection ?? "undefined"}`);
    console.log(`hello, ${latency}ms`);
  }, latency);
});

setTimeout(() => app.listen(8080), 0);

spdy
  .createServer(
    {
      requestCert: true,
      ca: fs.readFileSync("./ssl/ca.pem"),
      cert: fs.readFileSync("./ssl/ca.pem"),
      key: fs.readFileSync("./ssl/ca.key"),
    },
    app
  )
  .listen(8081, () => {});
