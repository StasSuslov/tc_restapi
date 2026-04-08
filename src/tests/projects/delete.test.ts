import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  adminClient,
  createClient,
  unauthenticatedClient,
} from "../../client/apiClient";
import { createProject, deleteProject } from "../../helpers/projectHelper";
import {
  createUser,
  createUserToken,
  deleteUser,
} from "../../helpers/userHelper";

describe("Project delete", () => {
  let projectId: string;

  beforeEach(async () => {
    const project = await createProject({ name: "Delete Test Project" });
    projectId = project.id;
  });

  afterEach(async () => {
    try {
      await deleteProject(projectId);
    } catch {}
  });

  it("should delete a project", async () => {
    await adminClient.delete(`/projects/id:${projectId}`);

    await expect(
      adminClient.get(`/projects/id:${projectId}`),
    ).rejects.toMatchObject({
      response: { status: 404 },
    });
  });

  it("should return 404 when deleting non-existent project", async () => {
    await expect(
      adminClient.delete("/projects/id:NonExistentProject99999"),
    ).rejects.toMatchObject({
      response: { status: 404 },
    });
  });

  it("should return 401 when unauthenticated", async () => {
    await expect(
      unauthenticatedClient.delete(`/projects/id:${projectId}`),
    ).rejects.toMatchObject({
      response: { status: 401 },
    });
  });

  it("should return 403 for regular users", async () => {
    const regularUser = await createUser({
      username: "regularUser_project_delete",
      password: "password123",
    });
    const token = await createUserToken(
      "regularUser_project_delete",
      "password123",
      "regularUser_project_delete_token",
    );
    const userClient = createClient(token);
    try {
      await expect(
        userClient.delete(`/projects/id:${projectId}`),
      ).rejects.toMatchObject({
        response: { status: 403 },
      });
    } finally {
      await deleteUser(regularUser.id);
    }
  });

  it("should cascade delete child projects", async () => {
    const child = await createProject({
      name: "Cascade Child Project",
      parentProject: { locator: `id:${projectId}` },
    });

    await adminClient.delete(`/projects/id:${projectId}`);

    await expect(
      adminClient.get(`/projects/id:${child.id}`),
    ).rejects.toMatchObject({
      response: { status: 404 },
    });
  });
});
