import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('q');
  const searchType = searchParams.get('type') || 'web';
  const page = parseInt(searchParams.get('page') || '1');

  if (!query) {
    return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
  }

  try {
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
    const resultsPerPage = 20;
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
        delete searchParams_final.tbm;
        break;

      case 'books':
        // Regular Google search but focused on book-related sites
        searchParams_final.num = resultsPerPage;
        searchParams_final.q = `${query} books`;
        if (page > 1) searchParams_final.start = startIndex;
        break;

      case 'flights':
        // Regular Google search but focused on flight booking sites
        searchParams_final.num = resultsPerPage;
        searchParams_final.q = `${query} flights`;
        if (page > 1) searchParams_final.start = startIndex;
        break;

      case 'finance':
        // Regular Google search but focused on financial information
        searchParams_final.num = resultsPerPage;
        searchParams_final.q = `${query} stock price finance`;
        if (page > 1) searchParams_final.start = startIndex;
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
        totalResults = searchInfo?.total_results || searchMeta?.total_results || results.length.toString();
        break;

      default: // web, books, flights, finance
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
