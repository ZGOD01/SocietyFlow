import { redirect } from "next/navigation";

export default function ApprovalsPage() {
  redirect("/management/approvals?mode=registration");
}
