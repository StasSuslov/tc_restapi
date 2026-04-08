import { describe, it, expect, beforeAll, afterAll } from "vitest";
import {
  adminClient,
  createClient,
  unauthenticatedClient,
} from "../../client/apiClient";
import {
  createProject,
  deleteProject,
  getProject,
} from "../../helpers/projectHelper";
import {
  createUser,
  createUserToken,
  deleteUser,
} from "../../helpers/userHelper";

describe("Project update", () => {
  let projectId: string;
  let parentAId: string;
  let parentBId: string;

  beforeAll(async () => {
    const parentA = await createProject({ name: "Update Test Parent A" });
    parentAId = parentA.id;

    const parentB = await createProject({ name: "Update Test Parent B" });
    parentBId = parentB.id;

    const project = await createProject({
      name: "Update Test Project",
      parentProject: { locator: `id:${parentAId}` },
    });
    projectId = project.id;
  });

  afterAll(async () => {
    try {
      await deleteProject(projectId);
    } catch {}
    try {
      await deleteProject(parentAId);
    } catch {}
    try {
      await deleteProject(parentBId);
    } catch {}
  });

  it("should move project to another parent", async () => {
    await adminClient.put(`/projects/id:${projectId}/parentProject`, {
      id: `${parentBId}`,
    });

    const response = await getProject(`id:${projectId}`);
    expect(response.parentProjectId).toBe(parentBId);
  });

  it("should add a parameter to project", async () => {
    await adminClient.put(
      `/projects/id:${projectId}/parameters/my.param/value`,
      "my_value",
      { headers: { "Content-Type": "text/plain", Accept: "text/plain" } },
    );

    const response = await adminClient.get(
      `/projects/id:${projectId}/parameters/my.param`,
    );
    expect(response.data.value).toBe("my_value");
  });

  it("should return 401 when unauthenticated", async () => {
    await expect(
      unauthenticatedClient.put(`/projects/id:${projectId}/parentProject`, {
        id: `${parentBId}`,
      }),
    ).rejects.toMatchObject({
      response: { status: 401 },
    });
  });

  it("should return 403 for regular user", async () => {
    const regularUser = await createUser({
      username: "regularUser_project_update",
      password: "password123",
    });
    const token = await createUserToken(
      "regularUser_project_update",
      "password123",
      "regularUser_project_update_token",
    );
    const userClient = createClient(token);
    try {
      await expect(
        userClient.put(`/projects/id:${projectId}/parentProject`, {
          id: `${parentBId}`,
        }),
      ).rejects.toMatchObject({
        response: { status: 403 },
      });
    } finally {
      await deleteUser(regularUser.id);
    }
  });

  it("should return 404 when updating non-existent project", async () => {
    await expect(
      adminClient.put("/projects/id:NonExistentProject99999/parentProject", {
        id: "_Root",
      }),
    ).rejects.toMatchObject({
      response: { status: 404 },
    });
  });
});
