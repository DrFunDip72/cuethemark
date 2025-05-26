
import { Link } from 'react-router-dom';

export const Navigation = () => {
  return (
    <nav className="w-full bg-white border-b">
      <div className="container mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          <Link to="/" className="text-xl font-semibold text-primary">
            Dance Track Marker
          </Link>
          <div className="flex items-center space-x-4">
            <Link
              to="/"
              className="text-sm font-medium text-gray-600 hover:text-primary transition-colors"
            >
              Upload
            </Link>
            <Link
              to="/tracks"
              className="text-sm font-medium text-gray-600 hover:text-primary transition-colors"
            >
              My Tracks
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
