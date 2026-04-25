import { MenuListProvider } from "./components/MenuListContext";

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return <MenuListProvider>{children}</MenuListProvider>;
}
