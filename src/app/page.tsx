'use client';

import React, { useState } from 'react';
import { Search, Flame, Shield, Zap, Image, ShoppingBag, Video, Newspaper, Map, Book, Plane, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import AirportInput from '@/components/AirportInput';

interface SearchResult {
  title: string;
  link: string;
  snippet?: string;
  displayed_link?: string;
  original?: string;
  thumbnail?: string;
  source?: string;
  duration?: string;
  platform?: string;
  date?: string;
  source_name?: string;
  price?: string;
  currency?: string;
  rating?: number;
  reviews?: number;
  address?: string;
  phone?: string;
  rating_display?: string;
  website?: string;
  type?: string;
  types?: string[];
  hours?: string;
  open_state?: string;
  gps_coordinates?: {
    latitude: number;
    longitude: number;
  };
  place_id?: string;
  description?: string;
  service_options?: Record<string, boolean>;
  authors?: string[];
  publication_date?: string;
  publisher?: string;
  pages?: number;
  isbn?: string;
  departure_airport?: { name?: string; id?: string; time?: string };
  arrival_airport?: { name?: string; id?: string; time?: string };
  flights?: Array<{
    departure_airport?: { name?: string; id?: string; time?: string };
    arrival_airport?: { name?: string; id?: string; time?: string };
    duration?: number;
    airline?: string;
    airline_logo?: string;
    flight_number?: string;
    travel_class?: string;
  }>;
  layovers?: Array<{ duration?: number; name?: string; id?: string }>;
  total_duration?: number;
  carbon_emissions?: { this_flight?: number; typical_for_this_route?: number; difference_percent?: number };
  departure_token?: string;
  booking_token?: string;
  booking_options?: Array<{
    link?: string;
    name?: string;
    price?: string;
  }>;
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
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [locationStatus, setLocationStatus] = useState<'detecting' | 'detected' | 'denied' | 'error'>('denied');
  const [flightParams, setFlightParams] = useState({
    departure: '',
    arrival: '',
    outbound_date: '',
    return_date: '',
    flight_type: '1', 
    travel_class: '1', 
    adults: '1'
  });
  const [showFlightForm, setShowFlightForm] = useState(false);

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('error');
      return;
    }

    setLocationStatus('detecting');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationStatus('detected');
      },
      (error) => {
        console.log('Location access denied or error:', error);
        setLocationStatus('denied');
        // Default to NYC coordinates
        setUserLocation({
          lat: 40.7455096,
          lng: -74.0083012
        });
      },
      { timeout: 10000 }
    );
  };

  React.useEffect(() => {
    getUserLocation();

    const today = new Date();
    const outbound = new Date(today);
    outbound.setDate(today.getDate() + 7); 
    const returnDate = new Date(today);
    returnDate.setDate(today.getDate() + 14);

    setFlightParams(prev => ({
      ...prev,
      outbound_date: outbound.toISOString().split('T')[0],
      return_date: returnDate.toISOString().split('T')[0]
    }));
  }, []);

  React.useEffect(() => {
    const today = new Date();
    const outbound = new Date(today);
    outbound.setDate(today.getDate() + 7);
    const returnDate = new Date(today);
    returnDate.setDate(today.getDate() + 14);

    setFlightParams(prev => ({
      ...prev,
      outbound_date: outbound.toISOString().split('T')[0],
      return_date: returnDate.toISOString().split('T')[0]
    }));
  }, []);

  const handleSearch = async (e?: React.FormEvent, searchType: SearchType = activeSearchType, page: number = 1) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    setError('');

    if (searchType !== activeSearchType) {
      setActiveSearchType(searchType);
      page = 1;
      setCurrentPage(1);
    } else if (page !== currentPage) {
      setCurrentPage(page);
    }

    try {
      console.log('Frontend: Starting search for:', query, 'Type:', searchType, 'Page:', page);

      const searchParams: Record<string, string | number> = {
        q: query,
        type: searchType,
        page: page
      };

      if (searchType === 'maps' && userLocation) {
        searchParams.lat = userLocation.lat.toString();
        searchParams.lng = userLocation.lng.toString();
        searchParams.zoom = '14z';
      }

      if (searchType === 'flights') {
        if (flightParams.departure) searchParams.departure_id = flightParams.departure;
        if (flightParams.arrival) searchParams.arrival_id = flightParams.arrival;
        if (flightParams.outbound_date) searchParams.outbound_date = flightParams.outbound_date;
        if (flightParams.return_date && flightParams.flight_type === '1') {
          searchParams.return_date = flightParams.return_date;
        }
        searchParams.flight_type = flightParams.flight_type;
        searchParams.travel_class = flightParams.travel_class;
        searchParams.adults = flightParams.adults;
      }

      const response = await axios.get('/api/search', {
        params: searchParams,
        timeout: 30000, 
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

    if (searchType === 'flights') {
      setShowFlightForm(true);
    } else {
      setShowFlightForm(false);
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      handleSearch(undefined, activeSearchType, page);
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

    if (activeSearchType === 'maps') {
      return (
        <div key={index} className="group bg-zinc-900/50 border border-zinc-800 rounded-lg overflow-hidden hover:border-red-500/30 transition-all duration-200 hover:bg-zinc-900/70">
          <div className="flex">
            {result.thumbnail && (
              <div className="w-24 h-24 flex-shrink-0">
                <img
                  src={result.thumbnail}
                  alt={result.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}
            <div className="flex-1 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <a
                    href={result.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-semibold text-blue-400 hover:text-blue-300 hover:underline line-clamp-1"
                  >
                    {result.title}
                  </a>

                  {result.type && (
                    <p className="text-orange-400 text-sm mt-1">{result.type}</p>
                  )}

                  <div className="flex items-center space-x-4 mt-2">
                    {result.rating && (
                      <div className="flex items-center space-x-1">
                        <span className="text-yellow-400">★</span>
                        <span className="text-white font-medium">{result.rating}</span>
                        {result.reviews && (
                          <span className="text-zinc-400 text-sm">({result.reviews})</span>
                        )}
                      </div>
                    )}

                    {result.price && (
                      <span className="text-green-400 font-medium">{result.price}</span>
                    )}
                  </div>

                  {result.address && (
                    <p className="text-zinc-300 text-sm mt-2 flex items-center">
                      <Map className="h-4 w-4 mr-2 text-red-500" />
                      {result.address}
                    </p>
                  )}

                  {result.phone && (
                    <p className="text-zinc-300 text-sm mt-1">{result.phone}</p>
                  )}

                  {result.open_state && (
                    <p className={`text-sm mt-1 ${
                      result.open_state.toLowerCase().includes('open')
                        ? 'text-green-400'
                        : result.open_state.toLowerCase().includes('closed')
                        ? 'text-red-400'
                        : 'text-yellow-400'
                    }`}>
                      {result.open_state}
                    </p>
                  )}

                  {result.description && (
                    <p className="text-zinc-400 text-sm mt-2 line-clamp-2">{result.description}</p>
                  )}

                  {result.service_options && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {Object.entries(result.service_options)
                        .filter(([_, available]) => available)
                        .slice(0, 3)
                        .map(([service, _]) => (
                          <span
                            key={service}
                            className="px-2 py-1 bg-zinc-800 text-zinc-300 text-xs rounded-full"
                          >
                            {service.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeSearchType === 'books') {
      return (
        <div key={index} className="group bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 hover:border-red-500/30 transition-all duration-200 hover:bg-zinc-900/70">
          <div className="flex items-start space-x-4">
            {result.thumbnail && (
              <div className="w-20 h-28 flex-shrink-0">
                <img
                  src={result.thumbnail}
                  alt={result.title}
                  className="w-full h-full object-cover rounded"
                  loading="lazy"
                />
              </div>
            )}
            <div className="flex-1">
              <a
                href={result.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-lg font-semibold text-blue-400 hover:text-blue-300 hover:underline line-clamp-2"
              >
                {result.title}
              </a>

              {result.authors && result.authors.length > 0 && (
                <p className="text-orange-400 text-sm mt-1">
                  by {result.authors.join(', ')}
                </p>
              )}

              <div className="flex items-center space-x-4 mt-2 text-sm text-zinc-300">
                {result.publisher && (
                  <span>{result.publisher}</span>
                )}
                {result.publication_date && (
                  <span>• {result.publication_date}</span>
                )}
                {result.pages && (
                  <span>• {result.pages} pages</span>
                )}
              </div>

              <p className="text-green-400 text-sm mt-1">{result.displayed_link}</p>

              {result.snippet && (
                <p className="text-zinc-300 leading-relaxed mt-2">{result.snippet}</p>
              )}

              {result.isbn && (
                <p className="text-zinc-400 text-xs mt-2">ISBN: {result.isbn}</p>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (activeSearchType === 'flights') {
      return (
        <div key={index} className="group bg-zinc-900/50 border border-zinc-800 rounded-lg p-6 hover:border-red-500/30 transition-all duration-200 hover:bg-zinc-900/70">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">
                {result.title}
              </h3>

              <div className="flex items-center space-x-4 mt-2">
                {result.price && (
                  <span className="text-green-400 font-bold text-xl">{result.price}</span>
                )}

                {result.total_duration && (
                  <span className="text-zinc-300">
                    {Math.floor(result.total_duration / 60)}h {result.total_duration % 60}m
                  </span>
                )}
              </div>

              {result.carbon_emissions && (
                <div className="flex items-center space-x-2 mt-2">
                  <span className="text-xs text-zinc-400">
                    CO₂: {Math.round((result.carbon_emissions.this_flight || 0) / 1000)}kg
                  </span>
                  {result.carbon_emissions.difference_percent !== undefined && (
                    <span className={`text-xs ${
                      result.carbon_emissions.difference_percent > 0 ? 'text-red-400' : 'text-green-400'
                    }`}>
                      ({result.carbon_emissions.difference_percent > 0 ? '+' : ''}{result.carbon_emissions.difference_percent}% vs typical)
                    </span>
                  )}
                </div>
              )}

              {/* Multiple booking options if available */}
              {result.booking_options && result.booking_options.length > 1 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  <span className="text-sm text-zinc-400">Book on:</span>
                  {result.booking_options.slice(0, 3).map((option: { link?: string; name?: string; price?: string }, optionIndex: number) => (
                    option.link && (
                      <a
                        key={optionIndex}
                        href={option.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-200 text-xs rounded transition-colors"
                      >
                        {option.name || 'Book'}
                        {option.price && ` - ${option.price}`}
                      </a>
                    )
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Flight segments */}
          {result.flights && result.flights.length > 0 && (
            <div className="space-y-3">
              {result.flights.map((flight, flightIndex) => (
                <div key={flightIndex} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="font-medium text-white">{flight.departure_airport?.time?.split(' ')[1]}</div>
                      <div className="text-sm text-zinc-400">{flight.departure_airport?.id}</div>
                    </div>

                    <div className="flex-1 text-center">
                      <div className="text-sm text-zinc-400">
                        {flight.duration ? `${Math.floor(flight.duration / 60)}h ${flight.duration % 60}m` : ''}
                      </div>
                      <div className="w-full h-px bg-zinc-600 my-1"></div>
                      <div className="text-xs text-zinc-500">{flight.airline}</div>
                    </div>

                    <div className="text-center">
                      <div className="font-medium text-white">{flight.arrival_airport?.time?.split(' ')[1]}</div>
                      <div className="text-sm text-zinc-400">{flight.arrival_airport?.id}</div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Layovers */}
              {result.layovers && result.layovers.length > 0 && (
                <div className="text-sm text-zinc-400">
                  Layovers: {result.layovers.map(layover =>
                    `${layover.name} (${Math.floor((layover.duration || 0) / 60)}h ${(layover.duration || 0) % 60}m)`
                  ).join(', ')}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-3">
            <p className="text-green-400 text-sm">{result.displayed_link}</p>
            {(!result.link || result.link === '#') && (
              <p className="text-zinc-500 text-xs">Booking not available</p>
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
              <div className="flex items-center justify-between mb-4">
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

                {/* Location Status for Maps */}
                {activeSearchType === 'maps' && (
                  <div className="flex items-center space-x-2 text-xs text-zinc-400">
                    {locationStatus === 'detecting' && (
                      <>
                        <div className="w-3 h-3 border border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                        <span>Detecting location...</span>
                      </>
                    )}
                    {locationStatus === 'detected' && (
                      <>
                        <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                        <span>Location detected</span>
                      </>
                    )}
                    {locationStatus === 'denied' && (
                      <>
                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        <span>Using default location (NYC)</span>
                        <button
                          onClick={getUserLocation}
                          className="text-blue-400 hover:text-blue-300 underline"
                        >
                          Enable location
                        </button>
                      </>
                    )}
                    {locationStatus === 'error' && (
                      <>
                        <div className="w-2 h-2 bg-red-400 rounded-full"></div>
                        <span>Location not supported</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Flight Search Form */}
          {activeSearchType === 'flights' && (
            <div className="max-w-4xl mx-auto mb-8">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Flight Search</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <AirportInput
                    id="departure"
                    label="From"
                    value={flightParams.departure}
                    onChange={(value) => setFlightParams({...flightParams, departure: value})}
                    placeholder="JFK or New York"
                  />

                  <AirportInput
                    id="arrival"
                    label="To"
                    value={flightParams.arrival}
                    onChange={(value) => setFlightParams({...flightParams, arrival: value})}
                    placeholder="LAX or Los Angeles"
                  />

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Departure</label>
                    <input
                      type="date"
                      value={flightParams.outbound_date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => {
                        setFlightParams({...flightParams, outbound_date: e.target.value});
                        if (flightParams.flight_type === '1' && flightParams.return_date) {
                          const newDeparture = new Date(e.target.value);
                          const currentReturn = new Date(flightParams.return_date);
                          if (currentReturn <= newDeparture) {
                            const nextDay = new Date(newDeparture);
                            nextDay.setDate(nextDay.getDate() + 1);
                            setFlightParams(prev => ({
                              ...prev,
                              outbound_date: e.target.value,
                              return_date: nextDay.toISOString().split('T')[0]
                            }));
                          }
                        }
                      }}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                    />
                  </div>

                  {flightParams.flight_type === '1' && (
                    <div>
                      <label className="block text-sm font-medium text-zinc-300 mb-2">Return</label>
                      <input
                        type="date"
                        value={flightParams.return_date}
                        min={flightParams.outbound_date || new Date().toISOString().split('T')[0]}
                        onChange={(e) => setFlightParams({...flightParams, return_date: e.target.value})}
                        className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Trip Type</label>
                    <select
                      value={flightParams.flight_type}
                      onChange={(e) => setFlightParams({...flightParams, flight_type: e.target.value})}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                    >
                      <option value="1">Round trip</option>
                      <option value="2">One way</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Class</label>
                    <select
                      value={flightParams.travel_class}
                      onChange={(e) => setFlightParams({...flightParams, travel_class: e.target.value})}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                    >
                      <option value="1">Economy</option>
                      <option value="2">Premium Economy</option>
                      <option value="3">Business</option>
                      <option value="4">First</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-2">Passengers</label>
                    <select
                      value={flightParams.adults}
                      onChange={(e) => setFlightParams({...flightParams, adults: e.target.value})}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white focus:outline-none focus:border-red-500"
                    >
                      {[1,2,3,4,5,6,7,8,9].map(num => (
                        <option key={num} value={num.toString()}>{num} adult{num > 1 ? 's' : ''}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (!flightParams.departure.trim()) {
                      setError('Please enter a departure airport or city.');
                      return;
                    }
                    if (!flightParams.arrival.trim()) {
                      setError('Please enter an arrival airport or city.');
                      return;
                    }
                    if (!flightParams.outbound_date) {
                      setError('Please select a departure date.');
                      return;
                    }
                    if (flightParams.flight_type === '1' && !flightParams.return_date) {
                      setError('Please select a return date for round trip.');
                      return;
                    }

                    const departureDate = new Date(flightParams.outbound_date);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    if (departureDate < today) {
                      setError('Departure date cannot be in the past.');
                      return;
                    }

                    if (flightParams.flight_type === '1') {
                      const returnDate = new Date(flightParams.return_date);
                      if (returnDate <= departureDate) {
                        setError('Return date must be after departure date.');
                        return;
                      }
                    }

                    setError(''); 
                    handleSearch(undefined, 'flights', 1);
                  }}
                  disabled={loading || !flightParams.departure || !flightParams.arrival}
                  className="w-full px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 disabled:from-zinc-700 disabled:to-zinc-600 rounded-lg font-medium text-white transition-all duration-200 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Searching flights...</span>
                    </div>
                  ) : (
                    'Search Flights'
                  )}
                </button>
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
                  <span>Powered by Various APIs</span>
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
