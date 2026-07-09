import { apiClient } from "./client";
import { ActivityLogResponse } from "./types";

export const activityLogsApi = {
  getRecentLogs: async (): Promise<ActivityLogResponse[]> => {
    const { data } = await apiClient.get<ActivityLogResponse[]>("/api/v1/activity-logs");
    return data;
  },
};
