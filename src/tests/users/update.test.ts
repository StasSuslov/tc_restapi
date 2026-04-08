import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  adminClient,
  createClient,
  unauthenticatedClient,
} from "../../client/apiClient";
import {
  createUser,
  createUserToken,
  deleteUser,
  getUser,
} from "../../helpers/userHelper";

describe("User update", () => {
  let userId: number;

  beforeAll(async () => {
    const user = await createUser({
      username: "testuser_update",
      password: "password123",
      name: "Update Test User",
      email: "update@example.com",
    });
    userId = user.id;
  });

  afterAll(async () => {
    await deleteUser(userId);
  });

  const textPlainHeaders = {
    "Content-Type": "text/plain",
    Accept: "text/plain",
  };

  it("should update user name", async () => {
    await adminClient.put(`/users/id:${userId}/name`, "Updated Name", {
      headers: textPlainHeaders,
    });

    const response = await getUser(`id:${userId}`);
    expect(response.name).toBe("Updated Name");
  });

  it("should update user email", async () => {
    await adminClient.put(`/users/id:${userId}/email`, "updated@example.com", {
      headers: textPlainHeaders,
    });

    const response = await getUser(`id:${userId}`);
    expect(response.email).toBe("updated@example.com");
  });

  it("should update user password", async () => {
    const newPassword = "newpassword123";

    await adminClient.put(`/users/id:${userId}/password`, newPassword, {
      headers: textPlainHeaders,
    });

    const token = await createUserToken(
      "testuser_update",
      newPassword,
      "password_check_token",
    );
    expect(token).toBeDefined();
  });

  it("should return 404 when updating non-existent user", async () => {
    await expect(
      adminClient.put("/users/id:99999/name", "Ghost User", {
        headers: textPlainHeaders,
      }),
    ).rejects.toMatchObject({
      response: { status: 404 },
    });
  });

  it("should return 401 for unauthenticated user", async () => {
    await expect(
      unauthenticatedClient.put(`/users/id:${userId}/name`, "Ghost User", {
        headers: textPlainHeaders,
      }),
    ).rejects.toMatchObject({
      response: { status: 401 },
    });
  });

  it("should return 403 when updating regular user as another regular user", async () => {
    const regularUser = await createUser({
      username: "regularUser_rbac",
      password: "password123",
    });
    const token = await createUserToken(
      "regularUser_rbac",
      "password123",
      "ru_token",
    );
    const userClient = createClient(token);
    try {
      await expect(
        userClient.put(`/users/id:${userId}/name`, "Cool Hacker", {
          headers: textPlainHeaders,
        }),
      ).rejects.toMatchObject({ response: { status: 403 } });
    } finally {
      await deleteUser(regularUser.id);
    }
  });
});
