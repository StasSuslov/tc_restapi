import { describe, it, expect, afterEach } from "vitest";
import { adminClient, unauthenticatedClient } from "../../client/apiClient";
import { createProject, deleteProject } from "../../helpers/projectHelper";

describe("Project creation", () => {
  const createdProjectIds: string[] = [];

  afterEach(async () => {
    for (const id of createdProjectIds) {
      try {
        await deleteProject(id);
      } catch {}
    }
    createdProjectIds.length = 0;
  });

  it("should create a project with name only", async () => {
    const project = await createProject({ name: "Test Project" });
    createdProjectIds.push(project.id);

    expect(project.id).toBeDefined();
    expect(project.name).toBe("Test Project");
  });

  it("should create a project with explicit id", async () => {
    const project = await createProject({
      name: "Test Project Explicit",
      id: "TestProjectExplicit",
    });
    createdProjectIds.push(project.id);

    expect(project.id).toBe("TestProjectExplicit");
  });

  it("should create a project under root by default", async () => {
    const project = await createProject({ name: "Test Project Root" });
    createdProjectIds.push(project.id);

    expect(project.parentProjectId).toBe("_Root");
  });

  it("should create a nested project under parent", async () => {
    const parent = await createProject({ name: "Parent Project" });
    createdProjectIds.push(parent.id);

    const child = await createProject({
      name: "Child Project",
      parentProject: { locator: `id:${parent.id}` },
    });
    createdProjectIds.push(child.id);

    expect(child.parentProjectId).toBe(parent.id);
  });

  it("should return 400 when name is missing", async () => {
    await expect(
      adminClient.post("/projects", { id: "NoName" }),
    ).rejects.toMatchObject({
      response: { status: 400 },
    });
  });

  it("should return 400 when project id already exists", async () => {
    const project = await createProject({
      name: "Duplicate Project",
      id: "DuplicateProject",
    });
    createdProjectIds.push(project.id);

    await expect(
      adminClient.post("/projects", {
        name: "Duplicate Project 2",
        id: "DuplicateProject",
      }),
    ).rejects.toMatchObject({
      response: { status: 400 },
    });
  });

  it("should return 401 when unauthenticated", async () => {
    await expect(
      unauthenticatedClient.post("/projects", { name: "Unauth Project" }),
    ).rejects.toMatchObject({
      response: { status: 401 },
    });
  });
});
