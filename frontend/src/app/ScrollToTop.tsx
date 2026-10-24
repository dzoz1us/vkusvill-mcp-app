import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Каждая страница открывается с самого верха. */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}
