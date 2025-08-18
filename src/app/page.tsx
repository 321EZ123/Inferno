'use client';

import { useState } from 'react';
import { Search, Flame, Shield, Zap, Image, ShoppingBag, Video, Newspaper, Map, Book, Plane, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';

interface SearchResult {
  title: string;
  link: string;
  snippet?: string;
  displayed_link?: string;
  // Image result properties
  original?: string;
  thumbnail?: string;
  source?: string;
  // Video result properties
  duration?: string;
  platform?: string;
  // News result properties
  date?: string;
  source_name?: string;
  // Shopping result properties
  price?: string;
  currency?: string;
  rating?: number;
  reviews?: number;
  // Maps result properties
  address?: string;
  phone?: string;
  rating_display?: string;
}

interface SearchResponse {
  results: SearchResult[];
  search_metadata: {
    total_results: string;
    time_taken_displayed: number;
    search_type: string;
    current_page: number;
    total_pages: number;
    has_next_page: boolean;
    has_prev_page: boolean;
    results_per_page: number;
  };
  search_type: string;
}

type SearchType = 'web' | 'images' | 'videos' | 'news' | 'shopping' | 'maps' | 'books' | 'flights' | 'finance';

const searchCategories = [
  { type: 'web' as SearchType, label: 'All', icon: Search },
  { type: 'images' as SearchType, label: 'Images', icon: Image },
  { type: 'shopping' as SearchType, label: 'Shopping', icon: ShoppingBag },
  { type: 'videos' as SearchType, label: 'Videos', icon: Video },
  { type: 'news' as SearchType, label: 'News', icon: Newspaper },
  { type: 'maps' as SearchType, label: 'Maps', icon: Map },
  { type: 'books' as SearchType, label: 'Books', icon: Book },
  { type: 'flights' as SearchType, label: 'Flights', icon: Plane },
  { type: 'finance' as SearchType, label: 'Finance', icon: TrendingUp },
];

export default function Home() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [totalResults, setTotalResults] = useState('');
  const [timeTaken, setTimeTaken] = useState(0);
  const [activeSearchType, setActiveSearchType] = useState<SearchType>('web');
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);

  const handleSearch = async (e?: React.FormEvent, searchType: SearchType = activeSearchType, page: number = 1) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    setError('');

    // If changing search type, update active type and reset to page 1
    if (searchType !== activeSearchType) {
      setActiveSearchType(searchType);
      page = 1;
      setCurrentPage(1);
    } else if (page !== currentPage) {
      setCurrentPage(page);
    }

    try {
      console.log('Frontend: Starting search for:', query, 'Type:', searchType, 'Page:', page);

      const response = await axios.get('/api/search', {
        params: { q: query, type: searchType, page: page },
        timeout: 30000, // Increase timeout
      });

      console.log('Frontend: Search response received:', response.data);

      const data: SearchResponse = response.data;
      const results = data.results || [];

      setResults(results);
      setTotalResults(data.search_metadata?.total_results || '0');
      setTimeTaken(data.search_metadata?.time_taken_displayed || 0);
      setCurrentPage(data.search_metadata?.current_page || 1);
      setTotalPages(data.search_metadata?.total_pages || 1);
      setHasNextPage(data.search_metadata?.has_next_page || false);
      setHasPrevPage(data.search_metadata?.has_prev_page || false);

      console.log('Frontend: Processed results:', {
        resultCount: results.length,
        totalResults: data.search_metadata?.total_results,
        searchType,
        page
      });

    } catch (error) {
      console.error('Frontend: Search error:', error);

      let errorMessage = 'Search failed. Please try again.';

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          errorMessage = 'API authentication failed. Please check the API key.';
        } else if (error.response?.status === 429) {
          errorMessage = 'Too many requests. Please wait a moment and try again.';
        } else if (error.response?.status === 400) {
          errorMessage = 'Invalid search parameters. Please try a different search.';
        } else if (error.response?.status === 408) {
          errorMessage = 'Search timed out. Please try again with a simpler query.';
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        } else if (error.code === 'ECONNABORTED') {
          errorMessage = 'Request timed out. Please check your connection and try again.';
        }
      }

      setError(errorMessage);
      setResults([]);
      setTotalResults('0');
      setTimeTaken(0);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (searchType: SearchType) => {
    if (searched && query.trim()) {
      handleSearch(undefined, searchType, 1);
    } else {
      setActiveSearchType(searchType);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      handleSearch(undefined, activeSearchType, page);
      // Scroll to top of results
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-center space-x-2 mt-12">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={!hasPrevPage || loading}
          className="flex items-center space-x-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 disabled:opacity-50 text-white rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous</span>
        </button>

        <div className="flex items-center space-x-1">
          {startPage > 1 && (
            <>
              <button
                onClick={() => handlePageChange(1)}
                className="px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all duration-200"
              >
                1
              </button>
              {startPage > 2 && <span className="text-zinc-500">...</span>}
            </>
          )}

          {pages.map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-3 py-2 rounded-lg transition-all duration-200 ${
                page === currentPage
                  ? 'bg-red-600 text-white'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              {page}
            </button>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="text-zinc-500">...</span>}
              <button
                onClick={() => handlePageChange(totalPages)}
                className="px-3 py-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-all duration-200"
              >
                {totalPages}
              </button>
            </>
          )}
        </div>

        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={!hasNextPage || loading}
          className="flex items-center space-x-2 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-900 disabled:opacity-50 text-white rounded-lg transition-all duration-200 disabled:cursor-not-allowed"
        >
          <span>Next</span>
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    );
  };

  const renderResult = (result: SearchResult, index: number) => {
    if (activeSearchType === 'images') {
      return (
        <div key={index} className="group bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden hover:border-red-500/30 transition-all duration-200 hover:bg-zinc-900/70">
          <div className="aspect-square relative overflow-hidden">
            <img
              src={result.thumbnail || result.original}
              alt={result.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              loading="lazy"
            />
          </div>
          <div className="p-4">
            <a
              href={result.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline line-clamp-2"
            >
              {result.title}
            </a>
            {result.source && (
              <p className="text-green-400 text-xs mt-1">{result.source}</p>
            )}
          </div>
        </div>
      );
    }

    if (activeSearchType === 'videos') {
      return (
        <div key={index} className="group bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 hover:border-red-500/30 transition-all duration-200 hover:bg-zinc-900/70">
          <div className="flex items-start space-x-4">
            <Video className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <a
                href={result.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-semibold text-blue-400 hover:text-blue-300 hover:underline line-clamp-2"
              >
                {result.title}
              </a>
              <p className="text-green-400 text-sm mt-1">
                {result.displayed_link || result.link}
                {result.duration && <span className="ml-2 text-zinc-400">• {result.duration}</span>}
              </p>
              {result.snippet && (
                <p className="text-zinc-300 leading-relaxed mt-2">{result.snippet}</p>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (activeSearchType === 'shopping') {
      return (
        <div key={index} className="group bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 hover:border-red-500/30 transition-all duration-200 hover:bg-zinc-900/70">
          <div className="flex items-start space-x-4">
            <ShoppingBag className="h-5 w-5 text-orange-500 mt-1 flex-shrink-0" />
            <div className="flex-1">
              <a
                href={result.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-semibold text-blue-400 hover:text-blue-300 hover:underline line-clamp-2"
              >
                {result.title}
              </a>
              <div className="flex items-center space-x-4 mt-2">
                {result.price && (
                  <span className="text-green-400 font-semibold">{result.price}</span>
                )}
                {result.rating && (
                  <span className="text-yellow-400">★ {result.rating}</span>
                )}
              </div>
              <p className="text-green-400 text-sm mt-1">{result.displayed_link || result.link}</p>
              {result.snippet && (
                <p className="text-zinc-300 leading-relaxed mt-2">{result.snippet}</p>
              )}
            </div>
          </div>
        </div>
      );
    }

    // Default web/news/books/flights/finance result layout
    return (
      <div key={index} className="group bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 hover:border-red-500/30 transition-all duration-200 hover:bg-zinc-900/70 backdrop-blur">
        <div className="mb-3">
          <a
            href={result.link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-lg font-semibold text-blue-400 hover:text-blue-300 hover:underline line-clamp-2"
          >
            {result.title}
          </a>
          <div className="flex items-center space-x-2 mt-1">
            <p className="text-green-400 text-sm">{result.displayed_link || result.link}</p>
            {result.date && (
              <span className="text-zinc-400 text-xs">• {result.date}</span>
            )}
          </div>
        </div>
        {result.snippet && (
          <p className="text-zinc-300 leading-relaxed">{result.snippet}</p>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-red-950/20 to-orange-950/30 text-white">
      {/* Animated background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-red-500/20 bg-zinc-900/50 backdrop-blur">
          <div className="max-w-6xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Flame className="h-8 w-8 text-red-500 animate-pulse" />
                  <div className="absolute inset-0 h-8 w-8 text-orange-400 animate-ping opacity-30">
                    <Flame className="h-8 w-8" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                  Inferno
                </h1>
              </div>
              <div className="flex items-center space-x-6 text-sm text-zinc-400">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4 text-green-400" />
                  <span>Privacy First</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <span>No Tracking</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-6 py-12">
          {!searched && (
            <div className="text-center mb-16">
              <div className="flex justify-center mb-8">
                <div className="relative">
                  <Flame className="h-24 w-24 text-red-500 animate-pulse" />
                  <div className="absolute inset-0 h-24 w-24 text-orange-400 animate-ping opacity-20">
                    <Flame className="h-24 w-24" />
                  </div>
                </div>
              </div>
              <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-red-400 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                Inferno
              </h1>
              <p className="text-xl text-zinc-400 mb-12">
                The privacy-first search engine that burns through the web
              </p>
            </div>
          )}

          {/* Search Form */}
          <form onSubmit={handleSearch} className="mb-8">
            <div className="relative max-w-2xl mx-auto">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-zinc-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search the web with Inferno..."
                  className="w-full pl-12 pr-4 py-4 bg-zinc-900/80 border border-red-500/30 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-white placeholder-zinc-400 text-lg backdrop-blur"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/10 via-orange-500/10 to-yellow-500/10 pointer-events-none"></div>
              </div>
              <button
                type="submit"
                disabled={loading || !query.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 disabled:from-zinc-700 disabled:to-zinc-600 rounded-lg font-medium transition-all duration-200 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Searching...</span>
                  </div>
                ) : (
                  'Search'
                )}
              </button>
            </div>
          </form>

          {/* Search Categories */}
          {searched && (
            <div className="max-w-4xl mx-auto mb-8">
              <div className="flex items-center space-x-1 overflow-x-auto pb-2">
                {searchCategories.map((category) => {
                  const Icon = category.icon;
                  const isActive = activeSearchType === category.type;

                  return (
                    <button
                      key={category.type}
                      onClick={() => handleCategoryClick(category.type)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                        isActive
                          ? 'bg-red-600 text-white shadow-lg shadow-red-500/20'
                          : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{category.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search Results */}
          {searched && (
            <div className="max-w-4xl mx-auto">
              {error && (
                <div className="bg-red-900/50 border border-red-500/50 rounded-lg p-4 mb-6">
                  <p className="text-red-200">{error}</p>
                </div>
              )}

              {totalResults && !error && (
                <div className="flex items-center justify-between mb-6">
                  <p className="text-zinc-400 text-sm">
                    About {Number(totalResults).toLocaleString()} results ({timeTaken > 0 ? `${timeTaken} seconds` : 'instant'})
                  </p>
                  {totalPages > 1 && (
                    <p className="text-zinc-400 text-sm">
                      Page {currentPage} of {totalPages}
                    </p>
                  )}
                </div>
              )}

              {results.length > 0 ? (
                <>
                  <div className={`${activeSearchType === 'images' ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-8'}`}>
                    {results.map((result, index) => renderResult(result, index))}
                  </div>
                  {renderPagination()}
                </>
              ) : loading ? (
                <div className="text-center py-12">
                  <div className="inline-block w-8 h-8 border-4 border-red-500/30 border-t-red-500 rounded-full animate-spin mb-4"></div>
                  <p className="text-zinc-400">Searching the inferno...</p>
                </div>
              ) : searched && !error ? (
                <div className="text-center py-12">
                  <Flame className="h-12 w-12 text-red-500/50 mx-auto mb-4" />
                  <p className="text-zinc-400">No results found. Try a different search term.</p>
                </div>
              ) : null}
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="border-t border-red-500/20 bg-zinc-900/50 backdrop-blur mt-20">
          <div className="max-w-6xl mx-auto px-6 py-8">
            <div className="text-center">
              <div className="flex justify-center items-center space-x-6 mb-4">
                <div className="flex items-center space-x-2 text-sm text-zinc-400">
                  <Shield className="h-4 w-4 text-green-400" />
                  <span>No tracking or data collection</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-zinc-400">
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <span>Powered by SerpAPI</span>
                </div>
              </div>
              <p className="text-zinc-500 text-sm">
                Inferno Search - Privacy-first web search that respects your anonymity
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
