import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { booksApi } from '../services/api';
import { Search as SearchIcon, BookOpen, Filter, Grid, List, X, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import BookCover from '../components/BookCover';

export default function Search() {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [allBooks, setAllBooks] = useState([]);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Advanced filters
  const [genreFilter, setGenreFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [yearFrom, setYearFrom] = useState('');
  const [yearTo, setYearTo] = useState('');
  const [sortBy, setSortBy] = useState('relevance');

  // Available options
  const languages = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese', 'Korean', 'Portuguese', 'Russian', 'Arabic'];
  const genres = [...new Set(results.map(b => b.genre).filter(Boolean))];

  const applyFilters = (books) => {
    let filtered = [...books];

    // Genre filter
    if (genreFilter) {
      filtered = filtered.filter(b => b.genre === genreFilter);
    }

    // Language filter
    if (languageFilter) {
      filtered = filtered.filter(b => b.language === languageFilter);
    }

    // Available only filter
    if (availableOnly) {
      filtered = filtered.filter(b => b.availableCopies > 0);
    }

    // Year range filter
    if (yearFrom) {
      filtered = filtered.filter(b => {
        if (!b.publishedDate) return false;
        return new Date(b.publishedDate).getFullYear() >= parseInt(yearFrom);
      });
    }
    if (yearTo) {
      filtered = filtered.filter(b => {
        if (!b.publishedDate) return false;
        return new Date(b.publishedDate).getFullYear() <= parseInt(yearTo);
      });
    }

    // Sorting
    switch (sortBy) {
      case 'title':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'author':
        filtered.sort((a, b) => a.author.localeCompare(b.author));
        break;
      case 'year':
        filtered.sort((a, b) => {
          const yearA = a.publishedDate ? new Date(a.publishedDate).getFullYear() : 0;
          const yearB = b.publishedDate ? new Date(b.publishedDate).getFullYear() : 0;
          return yearB - yearA;
        });
        break;
      case 'available':
        filtered.sort((a, b) => b.availableCopies - a.availableCopies);
        break;
      default:
        // relevance - keep original order
        break;
    }

    return filtered;
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setHasSearched(true);
    try {
      let books = [];
      if (query.trim()) {
        const res = await booksApi.search(query.trim());
        books = res.data.data.content || [];
      } else {
        const res = await booksApi.getAll(0, 100);
        books = res.data.data.content || [];
      }
      setResults(applyFilters(books));
      setAllBooks(books);
    } catch (err) {
      toast.error(t('search.searchFailed'));
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => {
    setQuery('');
    setGenreFilter('');
    setLanguageFilter('');
    setAvailableOnly(false);
    setMinRating(0);
    setYearFrom('');
    setYearTo('');
    setSortBy('relevance');
    setHasSearched(false);
    setResults([]);
  };

  const activeFiltersCount = [genreFilter, languageFilter, availableOnly, minRating > 0, yearFrom, yearTo]
    .filter(Boolean).length;

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('search.pageTitle')}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('search.pageSubtitle')}
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="bg-white dark:bg-gray-800 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('search.placeholder')}
              className="input pl-12 py-4 text-lg"
            />
          </div>
          <button type="submit" className="btn-primary py-4 px-8 text-lg">
            {t('common.search')}
          </button>
        </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <span className="text-sm text-gray-600 dark:text-gray-400">{t('search.filters')}:</span>
        </div>

        <select
          value={genreFilter}
          onChange={(e) => {
            setGenreFilter(e.target.value);
            if (hasSearched) setResults(applyFilters(allBooks));
          }}
          className="input w-auto"
        >
          <option value="">{t('search.allGenres')}</option>
          {genres.map(genre => (
            <option key={genre} value={genre}>{genre}</option>
          ))}
        </select>

        <select
          value={languageFilter}
          onChange={(e) => {
            setLanguageFilter(e.target.value);
            if (hasSearched) setResults(applyFilters(allBooks));
          }}
          className="input w-auto"
        >
          <option value="">{t('search.allLanguages')}</option>
          {languages.map(lang => (
            <option key={lang} value={lang}>{lang}</option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
            if (hasSearched) setResults(applyFilters(allBooks));
          }}
          className="input w-auto"
        >
          <option value="relevance">{t('search.sortRelevance')}</option>
          <option value="title">{t('search.sortTitle')}</option>
          <option value="author">{t('search.sortAuthor')}</option>
          <option value="year">{t('search.sortYear')}</option>
          <option value="available">{t('search.sortAvailability')}</option>
        </select>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={availableOnly}
            onChange={(e) => {
              setAvailableOnly(e.target.checked);
              if (hasSearched) setResults(applyFilters(allBooks));
            }}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">{t('search.availableOnly')}</span>
        </label>

        {/* Advanced Filters Toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
        >
          <ChevronDown size={14} className={`transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          {t('search.advanced')}
          {activeFiltersCount > 0 && (
            <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">{activeFiltersCount}</span>
          )}
        </button>

        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={clearFilters}
            className="text-sm text-red-600 hover:underline flex items-center gap-1"
          >
            <X size={14} /> {t('search.clearAll')}
          </button>
        )}
      </div>

      {/* Advanced Filters Panel */}
      {showAdvanced && (
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('search.yearFrom')}</label>
              <input
                type="number"
                value={yearFrom}
                onChange={(e) => {
                  setYearFrom(e.target.value);
                  if (hasSearched) setResults(applyFilters(allBooks));
                }}
                placeholder="e.g., 2020"
                className="input w-full"
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('search.yearTo')}</label>
              <input
                type="number"
                value={yearTo}
                onChange={(e) => {
                  setYearTo(e.target.value);
                  if (hasSearched) setResults(applyFilters(allBooks));
                }}
                placeholder="e.g., 2024"
                className="input w-full"
                min="1900"
                max={new Date().getFullYear()}
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t('search.minRating')}</label>
              <div className="flex gap-2 items-center">
                {[0, 1, 2, 3, 4, 5].map((rating) => (
                  <button
                    key={rating}
                    type="button"
                    onClick={() => {
                      setMinRating(rating);
                      if (hasSearched) setResults(applyFilters(allBooks));
                    }}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      minRating === rating
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {rating === 0 ? t('search.any') : `${rating}+`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      </form>

      {/* View Mode Toggle */}
      {hasSearched && results.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {results.length} {t('search.resultsFound')}
          </p>
          <div className="flex gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'grid' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
            >
              <Grid size={18} className={viewMode === 'grid' ? 'text-blue-600' : 'text-gray-500'} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-white dark:bg-gray-600 shadow-sm' : ''}`}
            >
              <List size={18} className={viewMode === 'list' ? 'text-blue-600' : 'text-gray-500'} />
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Results - Grid View */}
      {!loading && hasSearched && results.length > 0 && viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {results.map((book) => (
            <Link
              key={book.id}
              to={`/books/${book.id}`}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden group hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Book Cover */}
              <div className="relative aspect-[3/4] bg-gray-100 dark:bg-gray-700 overflow-hidden">
                <BookCover
                  src={book.coverImage}
                  title={book.title}
                  className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                />
                {/* Availability Badge */}
                <div className="absolute top-3 right-3">
              <span className={`badge ${
                book.availableCopies > 0 ? 'badge-success' : 'badge-danger'
              }`}>
                {book.availableCopies > 0 ? `${book.availableCopies} ${t('books.avail')}` : t('books.notAvailable')}
              </span>
                </div>
              </div>

              {/* Book Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {book.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 truncate">
                  {book.author}
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {book.genre && (
                    <span className="badge badge-info text-xs">{book.genre}</span>
                  )}
                  {book.language && (
                    <span className="badge bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300 text-xs">
                      {book.language}
                    </span>
                  )}
                </div>
            {book.pages && (
              <p className="text-xs text-gray-400 mt-2">{book.pages} {t('books.pages')}</p>
            )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Results - List View */}
      {!loading && hasSearched && results.length > 0 && viewMode === 'list' && (
        <div className="space-y-4">
          {results.map((book) => (
            <Link
              key={book.id}
              to={`/books/${book.id}`}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex gap-6 hover:shadow-lg transition-all group"
            >
              <div className="w-24 h-32 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                <BookCover src={book.coverImage} title={book.title} className="w-full h-full" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {book.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400">{book.author}</p>
                  </div>
              <span className={`badge ${
                book.availableCopies > 0 ? 'badge-success' : 'badge-danger'
              }`}>
                {book.availableCopies > 0 ? `${book.availableCopies} ${t('books.available')}` : t('books.notAvailable')}
              </span>
                </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 line-clamp-2">
              {book.description || t('books.noDescription')}
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {book.genre && <span className="badge badge-info">{book.genre}</span>}
              {book.isbn && <span className="text-xs text-gray-400">{t('books.isbn')}: {book.isbn}</span>}
              {book.publisher && <span className="text-xs text-gray-400">{book.publisher}</span>}
              {book.pages && <span className="text-xs text-gray-400">{book.pages} {t('books.pages')}</span>}
            </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* No Results */}
      {!loading && hasSearched && results.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-16 text-center">
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <BookOpen className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t('search.noResults')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            {t('search.noResultsDescription')}
          </p>
          <div className="flex justify-center gap-3">
            <button onClick={clearFilters} className="btn-secondary">
              {t('search.clearFilters')}
            </button>
            <button onClick={handleSearch} className="btn-primary">
              {t('search.browseAll')}
            </button>
          </div>
        </div>
      )}

      {/* Initial State */}
      {!loading && !hasSearched && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-16 text-center">
          <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <SearchIcon className="w-10 h-10 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t('search.findNextRead')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md mx-auto">
            {t('search.searchDescription')}
          </p>
          <button onClick={handleSearch} className="btn-primary">
            {t('search.browseAll')}
          </button>
        </div>
      )}
    </div>
  );
}
