import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  adminClient,
  unauthenticatedClient,
  createClient,
} from "../../client/apiClient";
import {
  createUser,
  createUserToken,
  deleteUser,
} from "../../helpers/userHelper";

describe("User delete", () => {
  let userId: number;

  beforeEach(async () => {
    const user = await createUser({
      username: "testuser_delete",
      password: "password123",
    });
    userId = user.id;
  });

  afterEach(async () => {
    try {
      await deleteUser(userId);
    } catch {}
  });

  it("should delete a user", async () => {
    await adminClient.delete(`/users/id:${userId}`);

    await expect(adminClient.get(`/users/id:${userId}`)).rejects.toMatchObject({
      response: { status: 404 },
    });
  });

  it("should return 404 when deleting non-existent user", async () => {
    await expect(adminClient.delete("/users/id:99999")).rejects.toMatchObject({
      response: { status: 404 },
    });
  });

  it("should return 401 when unauthenticated", async () => {
    await expect(
      unauthenticatedClient.delete(`/users/id:${userId}`),
    ).rejects.toMatchObject({
      response: { status: 401 },
    });
  });

  it("should return 403 when deleting as regular user", async () => {
    const regularUser = await createUser({
      username: "testuser_delete_rbac",
      password: "password123",
    });

    const token = await createUserToken(
      "testuser_delete_rbac",
      "password123",
      "rbac_token",
    );

    const userClient = createClient(token);

    await expect(
      userClient.delete(`/users/id:${userId}`),
    ).rejects.toMatchObject({
      response: { status: 403 },
    });

    await deleteUser(regularUser.id);
  });
});
