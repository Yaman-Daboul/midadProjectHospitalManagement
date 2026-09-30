import { useMutation, useQueryClient } from "@tanstack/react-query";
import axiosInstance from "../utils/axiosInstance";
import { toast } from "react-toastify";

type Method = "post" | "put" | "patch" | "delete";

type MutationVars = {
  id?: string | number;
  data?: any;
};

type UseApiMutationProps = {
  method: Method;
  endpoint: string;
  queryKey?: string;
  successMessage?: string;
  onSuccess?: (data: any) => void;
  headers?: Record<string, string>;
};

function useApiMutation({
  method,
  endpoint,
  queryKey,
  successMessage,
  onSuccess,
  headers = {},
}: UseApiMutationProps) {
  const queryClient = useQueryClient();

  const mutationFn = async (variables: MutationVars) => {
    const { id, data } = variables;

    const response = await axiosInstance.request({
      method,
      url: id ? `${endpoint}/${id}` : endpoint,
      data,
      headers,
    });

    return response.data;
  };

  return useMutation({
    mutationFn,

    onSuccess: (data) => {
      if (queryKey) {
        queryClient.invalidateQueries({
          queryKey: [queryKey],
        });
      }

      if (successMessage) {
        toast.success(successMessage, {
          toastId: `${method}-${endpoint}-${queryKey ?? "mutation"}`,
          autoClose: 2200,
        });
      }

      onSuccess?.(data);
    },

    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || error.message || "حدث خطأ",
        {
          toastId: `${method}-${endpoint}-error`,
          autoClose: 3000,
        },
      );
      console.error(error);
    },
  });
}

export default useApiMutation;
