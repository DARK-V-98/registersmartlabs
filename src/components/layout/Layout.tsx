import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import HeaderNotification from "./HeaderNotification";

interface LayoutProps {
  children: ReactNode;
  showFooter?: boolean;
}

const Layout = ({ children, showFooter = true }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <HeaderNotification />
      <Navbar />
      <main className="flex-1 pt-[calc(5rem+2.25rem)]">{children}</main>
      {showFooter && <Footer />}
    </div>
  );
};

export default Layout;
