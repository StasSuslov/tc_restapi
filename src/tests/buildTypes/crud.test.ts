import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import {
  adminClient,
  createClient,
  unauthenticatedClient,
} from "../../client/apiClient";
import { createProject, deleteProject } from "../../helpers/projectHelper";
import {
  createBuildType,
  deleteBuildType,
} from "../../helpers/buildTypeHelper";
import {
  createUser,
  createUserToken,
  deleteUser,
} from "../../helpers/userHelper";

describe("BuildType CRUD", () => {
  let projectId: string;
  const createdBuildTypeIds: string[] = [];

  beforeAll(async () => {
    const project = await createProject({ name: "BuildType Test Project" });
    projectId = project.id;
  });

  afterEach(async () => {
    for (const id of createdBuildTypeIds) {
      try {
        await deleteBuildType(id);
      } catch {}
    }
    createdBuildTypeIds.length = 0;
  });

  afterAll(async () => {
    try {
      await deleteProject(projectId);
    } catch {}
  });

  // CREATE
  it("should create a build configuration within a project", async () => {
    const bt = await createBuildType({
      name: "My Build",
      project: { id: projectId },
    });
    createdBuildTypeIds.push(bt.id);

    expect(bt.id).toBeDefined();
    expect(bt.name).toBe("My Build");
    expect(bt.projectId).toBe(projectId);
  });

  it("should create a build configuration with explicit id", async () => {
    const bt = await createBuildType({
      name: "Explicit Build",
      id: `${projectId}_ExplicitBuild`,
      project: { id: projectId },
    });
    createdBuildTypeIds.push(bt.id);

    expect(bt.id).toBe(`${projectId}_ExplicitBuild`);
  });

  it("should return 400 when creating build config without project", async () => {
    await expect(
      adminClient.post("/buildTypes", { name: "No Project Build" }),
    ).rejects.toMatchObject({
      response: { status: 400 },
    });
  });

  it("should return 400 when creating build config with duplicate id", async () => {
    const bt = await createBuildType({
      name: "Duplicate Build",
      id: `${projectId}_DuplicateBuild`,
      project: { id: projectId },
    });
    createdBuildTypeIds.push(bt.id);

    await expect(
      adminClient.post("/buildTypes", {
        name: "Duplicate Build 2",
        id: `${projectId}_DuplicateBuild`,
        project: { id: projectId },
      }),
    ).rejects.toMatchObject({
      response: { status: 400 },
    });
  });

  it("should return 403 for creating build config by regular user", async () => {
    const regularUser = await createUser({
      username: "regularUser_bt_create",
      password: "password123",
    });
    const token = await createUserToken(
      "regularUser_bt_create",
      "password123",
      "regularUser_bt_create_token",
    );
    const userClient = createClient(token);
    try {
      await expect(
        userClient.post("/buildTypes", {
          name: "My Build",
          project: { id: projectId },
        }),
      ).rejects.toMatchObject({
        response: { status: 403 },
      });
    } finally {
      await deleteUser(regularUser.id);
    }
  });

  // READ
  it("should get build configuration by id", async () => {
    const bt = await createBuildType({
      name: "Read Build",
      project: { id: projectId },
    });
    createdBuildTypeIds.push(bt.id);

    const response = await adminClient.get(`/buildTypes/id:${bt.id}`);
    expect(response.data.id).toBe(bt.id);
    expect(response.data.projectId).toBe(projectId);
  });

  it("should return 404 for non-existent build configuration", async () => {
    await expect(
      adminClient.get("/buildTypes/id:NonExistentBuildType99999"),
    ).rejects.toMatchObject({
      response: { status: 404 },
    });
  });

  it("should return 401 when unauthenticated", async () => {
    await expect(
      unauthenticatedClient.get(`/buildTypes/id:401id`),
    ).rejects.toMatchObject({
      response: { status: 401 },
    });
  });

  // UPDATE
  it("should pause a build configuration", async () => {
    const bt = await createBuildType({
      name: "Pause Build",
      project: { id: projectId },
    });
    createdBuildTypeIds.push(bt.id);

    await adminClient.put(`/buildTypes/id:${bt.id}/paused`, "true", {
      headers: { "Content-Type": "text/plain", Accept: "text/plain" },
    });

    const response = await adminClient.get(`/buildTypes/id:${bt.id}`);
    expect(response.data.paused).toBe(true);
  });

  // DELETE
  it("should delete a build configuration", async () => {
    const bt = await createBuildType({
      name: "Delete Build",
      project: { id: projectId },
    });

    await deleteBuildType(bt.id);

    await expect(
      adminClient.get(`/buildTypes/id:${bt.id}`),
    ).rejects.toMatchObject({
      response: { status: 404 },
    });
  });

  it("should return 403 for deleting build config by regular user", async () => {
    const regularUser = await createUser({
      username: "regularUser_bt_delete",
      password: "password123",
    });
    const token = await createUserToken(
      "regularUser_bt_delete",
      "password123",
      "regularUser_bt_delete_token",
    );
    const userClient = createClient(token);
    const bt = await createBuildType({
      name: "My Build",
      project: { id: projectId },
    });
    createdBuildTypeIds.push(bt.id);
    try {
      await expect(
        userClient.delete(`/buildTypes/id:${bt.id}`),
      ).rejects.toMatchObject({
        response: { status: 403 },
      });
    } finally {
      await deleteUser(regularUser.id);
    }
  });

  it("should return 404 when deleting a non-existent build configuration", async () => {
    await expect(deleteBuildType("NonExistedBT")).rejects.toMatchObject({
      response: { status: 404 },
    });
  });
});
