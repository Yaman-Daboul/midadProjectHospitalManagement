import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/utils/axiosInstance";

type UseGetProps = {
  endpoint: string;
  queryKey: string;
  params?: Record<string, unknown>;
  enabled?: boolean;
};

export default function useGet({
  endpoint,
  queryKey,
  params = {},
  enabled = true,
}: UseGetProps) {
  const fetchData = async () => {
    const response = await axiosInstance.get(endpoint, { params });
    return response.data;
  };

  return useQuery({
    queryKey: [queryKey, params],
    queryFn: fetchData,
    enabled,
  });
}
