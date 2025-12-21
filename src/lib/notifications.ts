import { toast } from "@/components/ui/use-toast";

/**
 * A simplified notification utility to trigger consistent toasts across the application.
 */
export const notify = {
  success: (title: string, description?: string) => {
    toast({
      variant: "success",
      title: title,
      description: description,
    });
  },
  error: (title: string, description?: string) => {
    toast({
      variant: "destructive",
      title: title,
      description: description || "Something went wrong. Please try again.",
    });
  },
  warning: (title: string, description?: string) => {
    toast({
      variant: "warning",
      title: title,
      description: description,
    });
  },
  info: (title: string, description?: string) => {
    toast({
      variant: "info",
      title: title,
      description: description,
    });
  },
};
