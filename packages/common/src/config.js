const path = require('node:path');
const dotenv = require('dotenv');

/**
 * Loads `<serviceRoot>/.env` into process.env. Variables already set in the
 * environment (e.g. by Docker) win over the file.
 */
function loadEnv(serviceRoot) {
  dotenv.config({ path: path.join(serviceRoot, '.env') });
}

function requireEnv(name) {
  const value = process.env[name];
  if (value === undefined || value === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function optionalEnv(name, fallback) {
  const value = process.env[name];
  return value === undefined || value === '' ? fallback : value;
}

function intEnv(name, fallback) {
  const raw = optionalEnv(name, undefined);
  if (raw === undefined) return fallback;
  const value = Number.parseInt(raw, 10);
  if (Number.isNaN(value)) throw new Error(`Environment variable ${name} must be an integer`);
  return value;
}

function boolEnv(name, fallback) {
  const raw = optionalEnv(name, undefined);
  if (raw === undefined) return fallback;
  return ['true', '1', 'yes'].includes(raw.toLowerCase());
}

function listEnv(name, fallback) {
  const raw = optionalEnv(name, undefined);
  if (raw === undefined) return fallback;
  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

module.exports = { loadEnv, requireEnv, optionalEnv, intEnv, boolEnv, listEnv };
