import { adminClient } from "../client/apiClient";

export interface NewBuildType {
  name: string;
  id?: string;
  project: { id: string };
}

export interface CreatedBuildType {
  id: string;
  name: string;
  projectId: string;
}

export const createBuildType = async (
  buildType: NewBuildType,
): Promise<CreatedBuildType> => {
  const response = await adminClient.post("/buildTypes", buildType);
  return response.data;
};

export const deleteBuildType = async (id: string): Promise<void> => {
  await adminClient.delete(`/buildTypes/id:${id}`);
};

export const getBuildType = async (id: string): Promise<CreatedBuildType> => {
  const response = await adminClient.get(`/buildTypes/id:${id}`);
  return response.data;
};
