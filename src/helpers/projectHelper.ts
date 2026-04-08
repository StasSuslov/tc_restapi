import { adminClient } from "../client/apiClient";

export interface NewProject {
  name: string;
  id?: string;
  parentProject?: { locator: string };
}

export interface CreatedProject {
  id: string;
  name: string;
  parentProjectId?: string;
}

export const createProject = async (
  project: NewProject,
): Promise<CreatedProject> => {
  const response = await adminClient.post("/projects", project);
  return response.data;
};

export const deleteProject = async (id: string): Promise<void> => {
  await adminClient.delete(`/projects/id:${id}`);
};

export const getProject = async (locator: string): Promise<CreatedProject> => {
  const response = await adminClient.get(`/projects/${locator}`);
  return response.data;
};
