import { apiRequest } from "./client";


export interface Keypoint {
  id: number;
  x: number;
  y: number;
  z: number;
  visibility: number;
}

export async function fetchPose(image: string) {
  return await apiRequest(`/api/process_image/`, {
    method: 'POST',
    body: JSON.stringify({ image: image })
  });
}