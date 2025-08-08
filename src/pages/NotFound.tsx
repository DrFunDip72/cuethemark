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
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-4">Oops! Page not found</p>
        <Link to={targetPath} className="text-blue-500 hover:text-blue-700 underline">
          {linkText}
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
