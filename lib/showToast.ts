import { toast } from "sonner";

type ToastType = "success" | "error" | "info" | "warning";

export const showToast = (message: string, type: ToastType = "success") => {
  switch (type) {
    case "success":
      toast.success(message);
      break;

    case "error":
      toast.error(message);
      break;

    case "info":
      toast(message);
      break;

    case "warning":
      toast.warning(message);
      break;

    default:
      toast(message);
  }
};
