import * as css from "./Layout.css";
import Sidebar from "./Sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <Sidebar />
      {children}
    </div>
  );
}
