import React, { useState, useRef, useEffect } from 'react';
import { getAirportSuggestions, Airport } from '@/lib/airports';
import { Plane, MapPin } from 'lucide-react';

interface AirportInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  id: string;
}

export default function AirportInput({ value, onChange, placeholder, label, id }: AirportInputProps) {
  const [suggestions, setSuggestions] = useState<Airport[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    if (value.length >= 2) {
      const newSuggestions = getAirportSuggestions(value, 8);
      setSuggestions(newSuggestions);
      setShowSuggestions(true);
      setSelectedIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handleSuggestionClick = (airport: Airport) => {
    onChange(airport.code);
    setShowSuggestions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleBlur = () => {
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  const handleFocus = () => {
    if (value.length >= 2 && suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  return (
    <div className="relative">
      <label htmlFor={id} className="block text-sm font-medium text-zinc-300 mb-2">
        {label}
      </label>
      <div className="relative">
        <Plane className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <input
          ref={inputRef}
          id={id}
          type="text"
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={handleFocus}
          placeholder={placeholder}
          className="w-full pl-10 pr-3 py-2 bg-zinc-800 border border-zinc-600 rounded-lg text-white placeholder-zinc-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500/20"
          autoComplete="off"
        />
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <ul
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-zinc-800 border border-zinc-600 rounded-lg shadow-lg max-h-64 overflow-y-auto"
        >
          {suggestions.map((airport, index) => (
            <li
              key={airport.code}
              className={`px-3 py-2 cursor-pointer border-b border-zinc-700 last:border-b-0 ${
                index === selectedIndex
                  ? 'bg-red-600 text-white'
                  : 'hover:bg-zinc-700 text-zinc-100'
              }`}
              onClick={() => handleSuggestionClick(airport)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-sm">
                      {airport.code}
                    </span>
                    <MapPin className="h-3 w-3 text-zinc-400" />
                    <span className="text-sm text-zinc-300">
                      {airport.city}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-zinc-400">
                  {airport.country}
                </span>
              </div>
              <div className="text-xs text-zinc-400 mt-1 truncate">
                {airport.name}
              </div>
            </li>
          ))}
        </ul>
      )}

      {value.length >= 2 && suggestions.length === 0 && showSuggestions && (
        <div className="absolute z-50 w-full mt-1 bg-zinc-800 border border-zinc-600 rounded-lg shadow-lg p-3">
          <div className="text-zinc-400 text-sm">
            No airports found for "{value}". Try using a 3-letter airport code (e.g., JFK) or city name.
          </div>
        </div>
      )}
    </div>
  );
}
