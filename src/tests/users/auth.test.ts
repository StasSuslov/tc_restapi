import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  adminClient,
  unauthenticatedClient,
  createClient,
} from "../../client/apiClient";
import {
  createUser,
  deleteUser,
  createUserToken,
} from "../../helpers/userHelper";

describe("Authentication", () => {
  let regularUserId: number;
  let regularUserToken: string;
  const regularUsername = "testuser_rbac";
  const regularPassword = "password123";

  beforeAll(async () => {
    const user = await createUser({
      username: regularUsername,
      password: regularPassword,
    });
    regularUserId = user.id;

    regularUserToken = await createUserToken(
      regularUsername,
      regularPassword,
      "test_token",
    );
  });

  afterAll(async () => {
    await deleteUser(regularUserId);
  });

  describe("Bearer token", () => {
    it("should return current user with valid token", async () => {
      const response = await adminClient.get("/users/current");
      expect(response.data.username).toBe("admin");
    });

    it("should return 401 with invalid token", async () => {
      const invalidClient = createClient("invalid_token");
      await expect(invalidClient.get("/users/current")).rejects.toMatchObject({
        response: { status: 401 },
      });
    });

    it("should return 401 without token", async () => {
      await expect(
        unauthenticatedClient.get("/users/current"),
      ).rejects.toMatchObject({
        response: { status: 401 },
      });
    });
  });

  describe("Token management", () => {
    it("should create a token for user", async () => {
      const tokenValue = await createUserToken(
        regularUsername,
        regularPassword,
        "new_token",
      );
      expect(tokenValue).toBeDefined();

      await adminClient.delete(`/users/id:${regularUserId}/tokens/new_token`);
    });

    it("should revoke a token and reject subsequent requests", async () => {
      const token = await createUserToken(
        regularUsername,
        regularPassword,
        "temp_token",
      );
      const tempClient = createClient(token);

      await expect(tempClient.get("/users/current")).resolves.toBeDefined();

      await adminClient.delete(`/users/id:${regularUserId}/tokens/temp_token`);

      await expect(tempClient.get("/users/current")).rejects.toMatchObject({
        response: { status: 401 },
      });
    });
  });

  describe("RBAC", () => {
    it("should allow regular user to read own profile", async () => {
      const userClient = createClient(regularUserToken);
      const response = await userClient.get("/users/current");
      expect(response.data.username).toBe("testuser_rbac");
    });

    it("should forbid regular user to create another user", async () => {
      const userClient = createClient(regularUserToken);
      await expect(
        userClient.post("/users", { username: "unauthorized_user" }),
      ).rejects.toMatchObject({
        response: { status: 403 },
      });
    });

    it("should forbid regular user to delete another user", async () => {
      const userClient = createClient(regularUserToken);
      await expect(userClient.delete(`/users/id:1`)).rejects.toMatchObject({
        response: { status: 403 },
      });
    });

    it("should forbid regular user to list all users", async () => {
      const userClient = createClient(regularUserToken);
      await expect(userClient.get("/users")).rejects.toMatchObject({
        response: { status: 403 },
      });
    });
  });
});
