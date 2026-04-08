import { describe, it, expect, beforeAll, afterAll, afterEach } from "vitest";
import { adminClient } from "../../client/apiClient";
import { createProject, deleteProject } from "../../helpers/projectHelper";
import {
  createBuildType,
  deleteBuildType,
} from "../../helpers/buildTypeHelper";

interface Property {
  name: string;
  value: string;
  inherited?: boolean;
}

describe("Build type inheritance", () => {
  let projectId: string;
  const createdBuildTypeIds: string[] = [];

  beforeAll(async () => {
    const project = await createProject({ name: "BuildType Inh Test Project" });
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

  it("should inherit config from project", async () => {
    await adminClient.put(
      `/projects/id:${projectId}/parameters/param.inherit/value`,
      "param_inherit",
      { headers: { "Content-Type": "text/plain", Accept: "text/plain" } },
    );
    const bt = await createBuildType({
      name: "My Build One",
      project: { id: projectId },
    });
    createdBuildTypeIds.push(bt.id);
    const response = await adminClient.get(
      `/buildTypes/id:${bt.id}/parameters`,
    );
    const param = response.data.property.find(
      (p: Property) => p.name === "param.inherit",
    );
    expect(param).toBeDefined();
    expect(param.value).toBe("param_inherit");
    expect(param.inherited).toBe(true);
  });

  it("should inherit config from parent", async () => {
    await adminClient.put(
      `/projects/id:${projectId}/parameters/param.parent_inherit/value`,
      "from_parent",
      { headers: { "Content-Type": "text/plain", Accept: "text/plain" } },
    );
    const childProject = await createProject({
      name: "Child Inherit Test Project",
      parentProject: { locator: `id:${projectId}` },
    });
    try {
      const response = await adminClient.get(
        `/projects/id:${childProject.id}/parameters`,
      );
      const param = response.data.property.find(
        (p: Property) => p.name === "param.parent_inherit",
      );
      expect(param).toBeDefined();
      expect(param.value).toBe("from_parent");
      expect(param.inherited).toBe(true);
    } finally {
      await deleteProject(childProject.id);
    }
  });

  it("should override inherited value", async () => {
    await adminClient.put(
      `/projects/id:${projectId}/parameters/param.override/value`,
      "overridden",
      { headers: { "Content-Type": "text/plain", Accept: "text/plain" } },
    );
    const bt = await createBuildType({
      name: "My Build Two",
      project: { id: projectId },
    });
    createdBuildTypeIds.push(bt.id);
    await adminClient.put(
      `/buildTypes/id:${bt.id}/parameters/param.override/value`,
      "bt_value",
      { headers: { "Content-Type": "text/plain", Accept: "text/plain" } },
    );
    const response = await adminClient.get(
      `/buildTypes/id:${bt.id}/parameters`,
    );
    const param = response.data.property.find(
      (p: Property) => p.name === "param.override",
    );
    expect(param).toBeDefined();
    expect(param.value).toBe("bt_value");
    expect(param.inherited).toBeUndefined();
  });

  it("should not override parent property", async () => {
    await adminClient.put(
      `/projects/id:${projectId}/parameters/param.parent_val/value`,
      "parent_val",
      { headers: { "Content-Type": "text/plain", Accept: "text/plain" } },
    );
    const bt = await createBuildType({
      name: "My Build Three",
      project: { id: projectId },
    });
    createdBuildTypeIds.push(bt.id);
    await adminClient.put(
      `/buildTypes/id:${bt.id}/parameters/param.parent_val/value`,
      "bt_value",
      { headers: { "Content-Type": "text/plain", Accept: "text/plain" } },
    );
    const response = await adminClient.get(
      `/projects/id:${projectId}/parameters`,
    );
    const param = response.data.property.find(
      (p: Property) => p.name === "param.parent_val",
    );
    expect(param).toBeDefined();
    expect(param.value).toBe("parent_val");
    expect(param.inherited).toBeUndefined();
  });
});
