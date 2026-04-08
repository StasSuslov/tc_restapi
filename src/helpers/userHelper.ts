import { adminClient, createBasicAuthClient } from "../client/apiClient";

export interface User {
  username: string;
  password?: string;
  name?: string;
  email?: string;
}

export interface CreatedUser {
  id: number;
  username: string;
  name?: string;
  email?: string;
  password?: string; // only to check that API doesn't return it
}

export const createUser = async (user: User): Promise<CreatedUser> => {
  const response = await adminClient.post("/users", user);
  return response.data;
};

export const deleteUser = async (id: number): Promise<void> => {
  await adminClient.delete(`/users/id:${id}`);
};

export const createUserToken = async (
  username: string,
  password: string,
  tokenName: string,
): Promise<string> => {
  const client = createBasicAuthClient(username, password);
  const tokenResponse = await client.post("/users/current/tokens", {
    name: tokenName,
  });
  return tokenResponse.data.value;
};

export const getUser = async (locator: string): Promise<CreatedUser> => {
  const response = await adminClient.get(`/users/${locator}`);
  return response.data;
};
