import { useState } from 'react';
import { BookOpen } from 'lucide-react';

const BookCover = ({ src, title, className = '' }) => {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200 ${className}`}>
        <BookOpen className="w-12 h-12 text-blue-400" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={title}
      onError={() => setError(true)}
      className={`object-cover ${className}`}
    />
  );
};

export default BookCover;
