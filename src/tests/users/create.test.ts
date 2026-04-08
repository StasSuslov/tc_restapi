import { describe, it, expect, afterEach } from "vitest";
import { adminClient, unauthenticatedClient } from "../../client/apiClient";
import { createUser, deleteUser } from "../../helpers/userHelper";

describe("User creation", () => {
  const createdUserIds: number[] = [];

  afterEach(async () => {
    for (const id of createdUserIds) {
      await deleteUser(id);
    }
    createdUserIds.length = 0;
  });

  it("should create a user with full fields", async () => {
    const user = {
      username: "testuser_full",
      password: "password123",
      name: "Test User",
      email: "test@example.com",
    };

    const response = await createUser(user);
    createdUserIds.push(response.id);

    expect(typeof response.id).toBe("number");
    expect(response.username).toBe(user.username);
    expect(response.name).toBe(user.name);
    expect(response.email).toBe(user.email);
    expect(response.password).toBeUndefined();
  });

  it("should create a user with username only", async () => {
    const response = await createUser({ username: "testuser_nopass" });
    createdUserIds.push(response.id);

    expect(typeof response.id).toBe("number");
    expect(response.username).toBe("testuser_nopass");
    expect(response.password).toBeUndefined();
  });

  it("should return 4xx when username is missing", async () => {
    await expect(
      adminClient.post("/users", { name: "No Username" }),
    ).rejects.toThrow();
  });

  it("should return 4xx when username already exists", async () => {
    const user = { username: "testuser_duplicate" };
    const response = await createUser(user);
    createdUserIds.push(response.id);

    await expect(createUser(user)).rejects.toMatchObject({
      response: { status: 400 },
    });
  });

  it("should return 401 when unauthenticated", async () => {
    await expect(
      unauthenticatedClient.post("/users", { username: "testuser_unauth" }),
    ).rejects.toMatchObject({
      response: { status: 401 },
    });
  });
});
