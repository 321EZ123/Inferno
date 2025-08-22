import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import { findAirportByInput, validateAirportCode } from '@/lib/airports';

// Types for Alpha Vantage API responses
interface StockData {
  ticker: string;
  company_name?: string;
  price: string;
  change_amount: string;
  change_percentage: string;
  volume: string;
}

interface SearchResult {
  title: string;
  link: string;
  displayed_link: string;
  snippet: string;
  price?: string;
  change?: string;
  change_percentage?: string;
  volume?: string;
  ticker?: string;
  company_name?: string;
  type?: string;
  region?: string;
}

// Helper function to get date string
function getDateString(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
}

// Alpha Vantage API helper functions
async function searchSymbol(query: string, apiKey: string) {
  try {
    const response = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'SYMBOL_SEARCH',
        keywords: query,
        apikey: apiKey,
      },
      timeout: 10000,
    });
    return response.data;
  } catch (error) {
    console.error('Alpha Vantage symbol search error:', error);
    return null;
  }
}

async function getQuote(symbol: string, apiKey: string) {
  try {
    const response = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol: symbol,
        apikey: apiKey,
      },
      timeout: 10000,
    });
    return response.data;
  } catch (error) {
    console.error('Alpha Vantage quote error:', error);
    return null;
  }
}

async function getCompanyOverview(symbol: string, apiKey: string) {
  try {
    const response = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'OVERVIEW',
        symbol: symbol,
        apikey: apiKey,
      },
      timeout: 10000,
    });
    return response.data;
  } catch (error) {
    console.error('Alpha Vantage overview error:', error);
    return null;
  }
}

async function getTopGainersLosers(apiKey: string) {
  try {
    const response = await axios.get('https://www.alphavantage.co/query', {
      params: {
        function: 'TOP_GAINERS_LOSERS',
        apikey: apiKey,
      },
      timeout: 10000,
    });
    return response.data;
  } catch (error) {
    console.error('Alpha Vantage top gainers/losers error:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const searchType = searchParams.get('type') || 'web';
  const page = parseInt(searchParams.get('page') || '1');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  // Constants for pagination
  const resultsPerPage = 20;

  try {
    // Handle books searches with Open Library
    if (searchType === 'books') {
      const openLibraryParams: Record<string, string | number> = {
        q: query,
        limit: resultsPerPage,
        fields: 'key,title,author_name,first_publish_year,publisher,language,number_of_pages_median,isbn,cover_i,ia,subject,edition_count,publish_year,publish_date',
      };

      // Add pagination for Open Library
      if (page > 1) {
        openLibraryParams.offset = (page - 1) * resultsPerPage;
      }

      console.log('Making Open Library API request:', {
        searchType,
        page,
        params: openLibraryParams
      });

      const openLibraryResponse = await axios.get('https://openlibrary.org/search.json', {
        params: openLibraryParams,
        timeout: 15000,
      });

      console.log('Open Library response received:', {
        status: openLibraryResponse.status,
        numFound: openLibraryResponse.data.num_found,
        docsLength: openLibraryResponse.data.docs?.length
      });

      // Map Open Library results to standard format
      const results = (openLibraryResponse.data.docs || []).map((result: {
        title?: string;
        key?: string;
        author_name?: string[];
        first_publish_year?: number;
        publisher?: string[];
        language?: string[];
        number_of_pages_median?: number;
        isbn?: string[];
        cover_i?: number;
        ia?: string[];
        subject?: string[];
        edition_count?: number;
        publish_year?: number[];
        publish_date?: string[];
      }) => {
        // Create Open Library work URL
        const workUrl = result.key ? `https://openlibrary.org${result.key}` : '#';

        // Get cover image URL if available
        const thumbnail = result.cover_i
          ? `https://covers.openlibrary.org/b/id/${result.cover_i}-M.jpg`
          : undefined;

        // Format publication date
        let publicationDate = '';
        if (result.first_publish_year) {
          publicationDate = result.first_publish_year.toString();
        } else if (result.publish_date && result.publish_date.length > 0) {
          publicationDate = result.publish_date[0];
        } else if (result.publish_year && result.publish_year.length > 0) {
          publicationDate = result.publish_year[0].toString();
        }

        // Format publisher
        const publisher = result.publisher && result.publisher.length > 0
          ? result.publisher[0]
          : undefined;

        // Format ISBN
        const isbn = result.isbn && result.isbn.length > 0
          ? result.isbn[0]
          : undefined;

        // Create snippet from available data
        let snippet = '';
        if (result.subject && result.subject.length > 0) {
          snippet = `Subjects: ${result.subject.slice(0, 3).join(', ')}`;
          if (result.subject.length > 3) snippet += '...';
        }
        if (result.edition_count) {
          snippet += snippet ? ` • ${result.edition_count} editions` : `${result.edition_count} editions`;
        }

        return {
          title: result.title || 'Unknown Title',
          link: workUrl,
          snippet: snippet,
          displayed_link: 'openlibrary.org',
          authors: result.author_name || [],
          publication_date: publicationDate,
          publisher: publisher,
          pages: result.number_of_pages_median,
          isbn: isbn,
          thumbnail: thumbnail
        };
      });

      const totalResults = openLibraryResponse.data.num_found?.toString() || results.length.toString();
      const timeTaken = 0.5; // Open Library is generally fast

      // Calculate pagination info for Open Library
      const totalResultsNum = openLibraryResponse.data.num_found || 0;
      const totalPages = Math.ceil(totalResultsNum / resultsPerPage);
      const hasNextPage = page < totalPages && page < 10; // Limit to 10 pages max
      const hasPrevPage = page > 1;

      // Return early for books since we're not using SerpAPI
      return NextResponse.json({
        results: results,
        search_metadata: {
          total_results: totalResults,
          time_taken_displayed: timeTaken,
          search_type: 'books',
          current_page: page,
          total_pages: Math.min(totalPages, 10),
          has_next_page: hasNextPage,
          has_prev_page: hasPrevPage,
          results_per_page: resultsPerPage,
        },
        search_type: 'books',
      });
    }

    // Handle finance searches with Alpha Vantage
    if (searchType === 'finance') {
      const alphaVantageKey = 'EMMEZJF2DJ08Y82M';

      const results: SearchResult[] = [];

      // For general market queries
      if (query.toLowerCase().includes('market') || query.toLowerCase().includes('gainers') || query.toLowerCase().includes('losers')) {
        const marketData = await getTopGainersLosers(alphaVantageKey);
        if (marketData) {
          // Add top gainers
          if (marketData.top_gainers) {
            marketData.top_gainers.slice(0, 5).forEach((stock: StockData) => {
              results.push({
                title: `${stock.ticker} - ${stock.company_name || stock.ticker}`,
                link: `https://finance.yahoo.com/quote/${stock.ticker}`,
                displayed_link: 'finance.yahoo.com',
                snippet: `Top Gainer: ${stock.price} (${stock.change_percentage})`,
                price: stock.price,
                change: stock.change_amount,
                change_percentage: stock.change_percentage,
                volume: stock.volume,
                ticker: stock.ticker
              });
            });
          }

          // Add top losers
          if (marketData.top_losers) {
            marketData.top_losers.slice(0, 5).forEach((stock: StockData) => {
              results.push({
                title: `${stock.ticker} - ${stock.company_name || stock.ticker}`,
                link: `https://finance.yahoo.com/quote/${stock.ticker}`,
                displayed_link: 'finance.yahoo.com',
                snippet: `Top Loser: ${stock.price} (${stock.change_percentage})`,
                price: stock.price,
                change: stock.change_amount,
                change_percentage: stock.change_percentage,
                volume: stock.volume,
                ticker: stock.ticker
              });
            });
          }
        }
      } else {
        // Search for specific stocks
        const symbolData = await searchSymbol(query, alphaVantageKey);

        if (symbolData && symbolData.bestMatches) {
          // Get quotes for top 5 matches
          const topMatches = symbolData.bestMatches.slice(0, 5);

          for (const match of topMatches) {
            const symbol = match['1. symbol'];
            const name = match['2. name'];
            const type = match['3. type'];
            const region = match['4. region'];

            // Get current quote
            const quoteData = await getQuote(symbol, alphaVantageKey);

            let price = 'N/A';
            let change = 'N/A';
            let changePercent = 'N/A';
            let volume = 'N/A';

            if (quoteData && quoteData['Global Quote']) {
              const quote = quoteData['Global Quote'];
              price = quote['05. price'];
              change = quote['09. change'];
              changePercent = quote['10. change percent'];
              volume = quote['06. volume'];
            }

            results.push({
              title: `${symbol} - ${name}`,
              link: `https://finance.yahoo.com/quote/${symbol}`,
              displayed_link: 'finance.yahoo.com',
              snippet: `${type} in ${region} - Price: $${price}, Change: ${change} (${changePercent})`,
              price: price,
              change: change,
              change_percentage: changePercent,
              volume: volume,
              ticker: symbol,
              company_name: name,
              type: type,
              region: region
            });

            // Add delay to respect API rate limits
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }
      }

      return NextResponse.json({
        results: results,
        search_metadata: {
          total_results: results.length.toString(),
          time_taken_displayed: 0.5,
          search_type: 'finance',
          current_page: 1,
          total_pages: 1,
          has_next_page: false,
          has_prev_page: false,
          results_per_page: results.length,
        },
        search_type: 'finance',
      });
    }

    const serpApiKey = process.env.SERPAPI_KEY;

    if (!serpApiKey) {
      return NextResponse.json({ error: 'SerpAPI key not configured' }, { status: 500 });
    }

    // Base parameters for all searches
    const baseParams: Record<string, string | number> = {
      engine: 'google',
      q: query,
      api_key: serpApiKey,
      location: 'United States',
      gl: 'us',
      hl: 'en',
    };

    // Calculate start position for pagination
    const startIndex = (page - 1) * resultsPerPage;

    // Configure parameters based on search type
    const searchParams_final: Record<string, string | number> = { ...baseParams };

    switch (searchType) {
      case 'images':
        searchParams_final.tbm = 'isch';
        searchParams_final.num = 30;
        if (page > 1) searchParams_final.start = startIndex;
        break;

      case 'videos':
        searchParams_final.tbm = 'vid';
        searchParams_final.num = resultsPerPage;
        if (page > 1) searchParams_final.start = startIndex;
        break;

      case 'news':
        searchParams_final.tbm = 'nws';
        searchParams_final.num = resultsPerPage;
        if (page > 1) searchParams_final.start = startIndex;
        break;

      case 'shopping':
        searchParams_final.tbm = 'shop';
        searchParams_final.num = resultsPerPage;
        if (page > 1) searchParams_final.start = startIndex;
        break;

      case 'maps':
        searchParams_final.engine = 'google_maps';
        searchParams_final.type = 'search';

        // Add geographic location parameter - default to NYC coordinates if not provided
        const lat = searchParams.get('lat') || '40.7455096';
        const lng = searchParams.get('lng') || '-74.0083012';
        const zoom = searchParams.get('zoom') || '14z';
        searchParams_final.ll = `@${lat},${lng},${zoom}`;

        // Add localization parameters for better results
        searchParams_final.gl = 'us';
        searchParams_final.hl = 'en';

        // Remove pagination parameters as they work differently for Maps
        delete searchParams_final.start;
        delete searchParams_final.num;
        delete searchParams_final.tbm;

        // Support pagination for maps results if provided
        if (page > 1) {
          searchParams_final.start = (page - 1) * 20;
        }
        break;





      case 'flights':
        searchParams_final.engine = 'google_flights';
        delete searchParams_final.tbm;
        delete searchParams_final.num;
        delete searchParams_final.location;
        delete searchParams_final.q;

        // Extract and validate flight parameters
        const departureInput = searchParams.get('departure_id') || '';
        const arrivalInput = searchParams.get('arrival_id') || '';
        const outbound_date = searchParams.get('outbound_date') || getDateString(7);
        const return_date = searchParams.get('return_date') || getDateString(14);
        const type = searchParams.get('flight_type') || '1';
        const travel_class = searchParams.get('travel_class') || '1';
        const adults = searchParams.get('adults') || '1';

        // Validate and convert airport inputs to IATA codes
        let departure_id = '';
        let arrival_id = '';

        if (departureInput) {
          const departureAirport = findAirportByInput(departureInput);
          if (departureAirport) {
            departure_id = departureAirport.code;
          } else {
            // Check if it's already a valid 3-letter code
            if (departureInput.length === 3 && /^[A-Z]{3}$/i.test(departureInput)) {
              departure_id = departureInput.toUpperCase();
            } else {
              return NextResponse.json({
                error: `Invalid departure airport: "${departureInput}". Please use a valid airport code (e.g., JFK) or city name (e.g., New York).`
              }, { status: 400 });
            }
          }
        } else {
          return NextResponse.json({
            error: 'Departure airport is required for flight search.'
          }, { status: 400 });
        }

        if (arrivalInput) {
          const arrivalAirport = findAirportByInput(arrivalInput);
          if (arrivalAirport) {
            arrival_id = arrivalAirport.code;
          } else {
            // Check if it's already a valid 3-letter code
            if (arrivalInput.length === 3 && /^[A-Z]{3}$/i.test(arrivalInput)) {
              arrival_id = arrivalInput.toUpperCase();
            } else {
              return NextResponse.json({
                error: `Invalid arrival airport: "${arrivalInput}". Please use a valid airport code (e.g., LAX) or city name (e.g., Los Angeles).`
              }, { status: 400 });
            }
          }
        } else {
          return NextResponse.json({
            error: 'Arrival airport is required for flight search.'
          }, { status: 400 });
        }

        // Validate dates
        const outboundDate = new Date(outbound_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (outboundDate < today) {
          return NextResponse.json({
            error: 'Departure date cannot be in the past.'
          }, { status: 400 });
        }

        if (type === '1') { // Round trip
          const returnDate = new Date(return_date);
          if (returnDate <= outboundDate) {
            return NextResponse.json({
              error: 'Return date must be after departure date.'
            }, { status: 400 });
          }
        }

        // Validate passenger count
        const adultsNum = parseInt(adults);
        if (isNaN(adultsNum) || adultsNum < 1 || adultsNum > 9) {
          return NextResponse.json({
            error: 'Number of adults must be between 1 and 9.'
          }, { status: 400 });
        }

        console.log('Flight search parameters:', {
          departure_id,
          arrival_id,
          outbound_date,
          return_date: type === '1' ? return_date : 'N/A',
          type,
          travel_class,
          adults
        });

        searchParams_final.departure_id = departure_id;
        searchParams_final.arrival_id = arrival_id;
        searchParams_final.outbound_date = outbound_date;
        searchParams_final.type = type;
        searchParams_final.travel_class = travel_class;
        searchParams_final.adults = adults;
        searchParams_final.currency = 'USD';

        // Add return date for round trip
        if (type === '1') {
          searchParams_final.return_date = return_date;
        }
        break;

      default: // web search
        searchParams_final.num = resultsPerPage;
        if (page > 1) searchParams_final.start = startIndex;
        break;
    }

    console.log('Making SerpAPI request:', {
      searchType,
      page,
      params: searchParams_final
    });

    const response = await axios.get('https://serpapi.com/search', {
      params: searchParams_final,
      timeout: 20000,
    });

    console.log('SerpAPI response received:', {
      status: response.status,
      dataKeys: Object.keys(response.data),
      searchType,
      hasResults: !!response.data.organic_results || !!response.data.images_results || !!response.data.video_results || !!response.data.news_results
    });

    // Handle different response structures based on search type
    let results = [];
    let totalResults = '0';
    let timeTaken = 0;

    // Extract timing information
    if (response.data.search_metadata) {
      timeTaken = response.data.search_metadata.time_taken_displayed ||
                  response.data.search_metadata.processed_time ||
                  response.data.search_metadata.total_time_taken || 0;
    }

    // Extract total results from search_information first, then search_metadata
    const searchInfo = response.data.search_information;
    const searchMeta = response.data.search_metadata;

    // Get results based on search type
    switch (searchType) {
      case 'images':
        results = response.data.images_results || [];
        totalResults = searchInfo?.total_results || searchMeta?.total_results || results.length.toString();
        break;

      case 'videos':
        results = response.data.video_results || [];
        totalResults = searchInfo?.total_results || searchMeta?.total_results || results.length.toString();
        break;

      case 'news':
        results = response.data.news_results || [];
        totalResults = searchInfo?.total_results || searchMeta?.total_results || results.length.toString();
        break;

      case 'shopping':
        results = response.data.shopping_results || [];
        totalResults = searchInfo?.total_results || searchMeta?.total_results || results.length.toString();
        break;

      case 'maps':
        results = response.data.local_results || [];

        // For maps, also include place results if available
        if (response.data.place_results) {
          results = [response.data.place_results, ...results];
        }

        // Map the results to include proper fields for frontend
        results = results.map((result: {
          title?: string;
          address?: string;
          phone?: string;
          website?: string;
          rating?: number;
          reviews?: number;
          price?: string;
          type?: string;
          types?: string[];
          hours?: string;
          operating_hours?: Record<string, string>;
          open_state?: string;
          gps_coordinates?: { latitude: number; longitude: number };
          place_id?: string;
          thumbnail?: string;
          description?: string;
          service_options?: Record<string, boolean>;
        }) => ({
          title: result.title,
          address: result.address,
          phone: result.phone,
          website: result.website,
          rating: result.rating,
          reviews: result.reviews,
          price: result.price,
          type: result.type,
          types: result.types,
          hours: result.hours || result.operating_hours,
          open_state: result.open_state,
          gps_coordinates: result.gps_coordinates,
          place_id: result.place_id,
          thumbnail: result.thumbnail,
          description: result.description,
          service_options: result.service_options,
          // Include the original link structure for consistency
          link: result.website || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(result.title + ' ' + (result.address || ''))}`,
          displayed_link: result.website || 'Google Maps',
          snippet: result.description
        }));

        totalResults = searchInfo?.total_results || searchMeta?.total_results || results.length.toString();
        break;



      case 'flights':
        // Handle both best_flights and other_flights
        const best_flights = response.data.best_flights || [];
        const other_flights = response.data.other_flights || [];
        results = [...best_flights, ...other_flights];

        // Debug logging to understand booking data structure
        console.log('Flight results sample:', {
          total_results: results.length,
          sample_result: results[0] ? {
            has_booking_token: !!results[0].booking_token,
            has_departure_token: !!results[0].departure_token,
            has_booking_options: !!results[0].booking_options,
            booking_options_count: results[0].booking_options?.length || 0,
            keys: Object.keys(results[0])
          } : 'No results'
        });

        // Map flight results to standard format
        results = results.map((result: {
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
          price?: number;
          carbon_emissions?: { this_flight?: number; typical_for_this_route?: number };
          departure_token?: string;
          booking_token?: string;
          booking_options?: Array<{
            link?: string;
            name?: string;
            price?: string;
          }>;
        }) => {
          const firstFlight = result.flights?.[0];
          const lastFlight = result.flights?.[result.flights.length - 1];

          // Generate proper booking link
          let bookingLink = '#';
          let displayedLink = 'Google Flights';

          if (result.booking_token) {
            // Use Google Flights booking URL with token
            bookingLink = `https://www.google.com/travel/flights/booking?token=${result.booking_token}`;
            displayedLink = 'Google Flights';
          } else if (result.booking_options && result.booking_options.length > 0) {
            // Use first booking option if available
            const firstBookingOption = result.booking_options[0];
            if (firstBookingOption.link) {
              bookingLink = firstBookingOption.link;
              displayedLink = firstBookingOption.name || 'Book Flight';
            }
          } else if (result.departure_token) {
            // Fallback to Google Flights search with departure token
            bookingLink = `https://www.google.com/travel/flights/search?token=${result.departure_token}`;
            displayedLink = 'Google Flights';
          } else {
            // Fallback to construct a proper Google Flights search URL
            const departureCode = firstFlight?.departure_airport?.id || searchParams_final.departure_id;
            const arrivalCode = lastFlight?.arrival_airport?.id || searchParams_final.arrival_id;
            const departureDate = searchParams_final.outbound_date;
            const returnDate = searchParams_final.return_date;

            if (departureCode && arrivalCode && departureDate) {
              // Create a Google Flights URL with proper parameters
              const searchParams_url = new URLSearchParams();

              // Basic flight search parameters
              searchParams_url.append('hl', 'en');
              searchParams_url.append('curr', 'USD');

              if (searchParams_final.type === '1' && returnDate) {
                // Round trip search
                searchParams_url.append('tfs', `CBwQAhooEgoyMDI0LTEyLTMxagcIARID${departureCode}cgcIARID${arrivalCode}cAE`);
                bookingLink = `https://www.google.com/travel/flights/search?${searchParams_url.toString()}`;
              } else {
                // One way search
                searchParams_url.append('tfs', `CBwQAhoqEgoyMDI0LTEyLTMxagcIARID${departureCode}cgcIARID${arrivalCode}`);
                bookingLink = `https://www.google.com/travel/flights/search?${searchParams_url.toString()}`;
              }

              // Simpler, more reliable approach using query parameters
              const simpleParams = new URLSearchParams({
                f: '0', // No flexible dates
                hl: 'en',
                curr: 'USD',
                tfs: `CBwQAhooag0IAhIJL20vMDJfMjg2cgwIAxIIL20vMDEzX2Y0`,
              });

              // Most reliable approach - construct Google Flights URL manually
              bookingLink = `https://www.google.com/travel/flights/search?q=${encodeURIComponent(`${departureCode} to ${arrivalCode} ${departureDate}${returnDate ? ' returning ' + returnDate : ''}`)}&hl=en`;

            } else {
              // Final fallback
              bookingLink = `https://www.google.com/travel/flights`;
            }

            displayedLink = 'Google Flights';
          }

          return {
            title: `${firstFlight?.departure_airport?.name || 'Unknown'} to ${lastFlight?.arrival_airport?.name || 'Unknown'}`,
            link: bookingLink,
            displayed_link: displayedLink,
            snippet: `${result.flights?.length || 0} flight${(result.flights?.length || 0) > 1 ? 's' : ''}, ${Math.floor((result.total_duration || 0) / 60)}h ${((result.total_duration || 0) % 60)}m total`,
            price: result.price ? `${result.price}` : undefined,
            departure_airport: firstFlight?.departure_airport,
            arrival_airport: lastFlight?.arrival_airport,
            flights: result.flights,
            layovers: result.layovers,
            total_duration: result.total_duration,
            carbon_emissions: result.carbon_emissions,
            departure_token: result.departure_token,
            booking_token: result.booking_token,
            booking_options: result.booking_options
          };
        });

        totalResults = results.length.toString();
        break;

      default: // web, finance
        results = response.data.organic_results || [];
        totalResults = searchInfo?.total_results || searchMeta?.total_results || results.length.toString();
        break;
    }

    console.log('Processed results:', {
      count: results.length,
      totalResults,
      timeTaken,
      searchType,
      page
    });

    // If no results found, log the full response for debugging
    if (results.length === 0) {
      console.log('No results found. Full response:', JSON.stringify(response.data, null, 2));
    }

    // Calculate pagination info
    const totalResultsNum = parseInt(String(totalResults).replace(/[,\s]/g, '')) || 0;
    const totalPages = Math.ceil(totalResultsNum / resultsPerPage);
    const hasNextPage = page < totalPages && page < 10; // Limit to 10 pages max
    const hasPrevPage = page > 1;

    // Return structured response
    const filteredResponse = {
      results: results,
      search_metadata: {
        total_results: totalResults,
        time_taken_displayed: timeTaken,
        search_type: searchType,
        current_page: page,
        total_pages: Math.min(totalPages, 10),
        has_next_page: hasNextPage,
        has_prev_page: hasPrevPage,
        results_per_page: resultsPerPage,
      },
      search_type: searchType,
    };

    return NextResponse.json(filteredResponse);
  } catch (error) {
    console.error('SerpAPI Error Details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      response: axios.isAxiosError(error) ? {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      } : null,
      searchType,
      query,
      page
    });

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        return NextResponse.json({ error: 'Invalid SerpAPI key' }, { status: 401 });
      }
      if (error.response?.status === 429) {
        return NextResponse.json({ error: 'API rate limit exceeded. Please try again later.' }, { status: 429 });
      }
      if (error.response?.status === 400) {
        return NextResponse.json({ error: 'Invalid search parameters' }, { status: 400 });
      }
      if (error.code === 'ECONNABORTED') {
        return NextResponse.json({ error: 'Search request timed out' }, { status: 408 });
      }
    }

    return NextResponse.json({
      error: 'Search failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
