import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";

const NotFound = () => {
  const location = useLocation();
  const { user } = useAuth();
  const targetPath = user ? "/app/tracks" : "/";
  const linkText = user ? "Go to App" : "Return to Home";

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: "hsl(var(--landing-bg))", color: "hsl(var(--landing-text))" }}
    >
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl mb-4 text-[hsl(var(--landing-text-muted))]">Oops! Page not found</p>
        <Link
          to={targetPath}
          className="underline transition-colors hover:opacity-90"
          style={{ color: "hsl(var(--landing-accent))" }}
        >
          {linkText}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
