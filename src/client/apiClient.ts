import axios from "axios";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:8111";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN ?? "";

export const adminClient = axios.create({
  baseURL: `${BASE_URL}/app/rest`,
  headers: {
    Authorization: `Bearer ${ADMIN_TOKEN}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

export const createClient = (token: string) =>
  axios.create({
    baseURL: `${BASE_URL}/app/rest`,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

export const createBasicAuthClient = (username: string, password: string) =>
  axios.create({
    baseURL: `${BASE_URL}/app/rest`,
    headers: {
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

export const unauthenticatedClient = axios.create({
  baseURL: `${BASE_URL}/app/rest`,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});
