import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { adminClient, unauthenticatedClient } from "../../client/apiClient";
import { createUser, deleteUser, getUser } from "../../helpers/userHelper";

describe("User read", () => {
  let userId: number;
  let username: string;

  beforeAll(async () => {
    const user = await createUser({
      username: "testuser_read",
      password: "password123",
      name: "Read Test User",
      email: "read@example.com",
    });
    userId = user.id;
    username = user.username;
  });

  afterAll(async () => {
    await deleteUser(userId);
  });

  it("should get user by id locator", async () => {
    const response = await getUser(`id:${userId}`);
    expect(response.id).toBe(userId);
    expect(response.username).toBe(username);
  });

  it("should get user by username locator", async () => {
    const response = await getUser(`username:${username}`);
    expect(response.username).toBe(username);
  });

  it("should get current user via current locator", async () => {
    const response = await getUser("current");
    expect(response.username).toBe("admin");
  });

  it("should get all users", async () => {
    const response = await adminClient.get("/users");
    expect(Array.isArray(response.data.user)).toBe(true);
    expect(response.data.user.length).toBeGreaterThan(0);
  });

  it("should return 404 for non-existent user", async () => {
    await expect(getUser("id:9999")).rejects.toMatchObject({
      response: { status: 404 },
    });
  });

  it("should return 401 for unauthenticated request", async () => {
    await expect(
      unauthenticatedClient.get(`/users/id:${userId}`),
    ).rejects.toMatchObject({
      response: { status: 401 },
    });
  });
});
