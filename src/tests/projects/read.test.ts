import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { adminClient, unauthenticatedClient } from "../../client/apiClient";
import {
  createProject,
  deleteProject,
  getProject,
} from "../../helpers/projectHelper";

describe("Project read", () => {
  let projectId: string;
  let childProjectId: string;

  beforeAll(async () => {
    const parent = await createProject({ name: "ReadTestProject" });
    projectId = parent.id;

    const child = await createProject({
      name: "ReadTestChildProject",
      parentProject: { locator: `id:${projectId}` },
    });
    childProjectId = child.id;
  });

  afterAll(async () => {
    try {
      await deleteProject(childProjectId);
    } catch {}
    try {
      await deleteProject(projectId);
    } catch {}
  });

  it("should get project by id locator", async () => {
    const response = await getProject(`id:${projectId}`);
    expect(response.id).toBe(projectId);
    expect(response.name).toBe("ReadTestProject");
  });

  it("should get project by name locator", async () => {
    const response = await getProject(`name:ReadTestProject`);
    expect(response.name).toBe("ReadTestProject");
  });

  it("should get all projects", async () => {
    const response = await adminClient.get("/projects");
    expect(Array.isArray(response.data.project)).toBe(true);
    expect(response.data.project.length).toBeGreaterThan(0);
  });

  it("should get parent project via parentProject endpoint", async () => {
    const response = await adminClient.get(
      `/projects/id:${childProjectId}/parentProject`,
    );
    expect(response.data.id).toBe(projectId);
  });

  it("should get child project with correct parentProjectId", async () => {
    const response = await getProject(`id:${childProjectId}`);
    expect(response.parentProjectId).toBe(projectId);
  });

  it("should return 404 for non-existent project", async () => {
    await expect(
      adminClient.get("/projects/id:NonExistentProject99999"),
    ).rejects.toMatchObject({
      response: { status: 404 },
    });
  });

  it("should return 401 when unauthenticated", async () => {
    await expect(
      unauthenticatedClient.get(`/projects/id:${projectId}`),
    ).rejects.toMatchObject({
      response: { status: 401 },
    });
  });
});
