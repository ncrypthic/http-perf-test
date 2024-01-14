// run: USE_HTTP2=<true|false> REQUEST_COUNT=[count, default: 3000] NODE_EXTRA_CA_CERTS="../ca.pem" node index.mjs
import got from "got";
import fs from "fs";
import https from "https";
import events from "events";
import express from "express";
import promMid from "express-prometheus-middleware";
import { Registry, collectDefaultMetrics } from "prom-client";
import { formatDistanceStrict } from "date-fns";

const REQUEST_COUNT = parseInt(process.env.REQUEST_COUNT) || 3000;
const METRIC_PORT = process.env.METRIC_PORT;

const register = new Registry();
collectDefaultMetrics({ register });
events.defaultMaxListeners = 50;

// Set maximum concurrent socket connection for HTTPS
https.globalAgent.maxSockets = 2;

const certificate = fs.readFileSync("../ssl/client.full.pem", "utf8");
const key = fs.readFileSync("../ssl/client.key", "utf8");
const certificateAuthority = fs.readFileSync("../../ca.pem", "utf8");

const client = {
  get: async (counter) => {
    const prefix = "/perf";
    const path = process.env.USE_HTTP2 === "true" ? "/http2" : "/http1.1";
    const uri = `https://localhost:8081${prefix}${path}`;
    console.log(`request counter: ${counter}, uri: ${uri}`);
    return got(uri, {
      http2: process.env.USE_HTTP2 === "true",
      https: { certificateAuthority, key, certificate },
    });
  },
};

const app = express();

app.use(
  promMid({
    metricsPath: "/metrics",
    collectDefaultMetrics: true,
  })
);

app.listen(METRIC_PORT, async () => {
  const start = new Date();
  await Promise.all(
    Array.from(
      new Array(isNaN(REQUEST_COUNT) ? 3000 : REQUEST_COUNT).keys()
    ).map(async (_, i) => client.get(i + 1))
  );
  const done = new Date();
  const duration = formatDistanceStrict(done, start, { includeSeconds: true });
  console.log(`Test summary: COUNT=${REQUEST_COUNT}, DURATION=${duration}`);
  process.exit(0);
});
