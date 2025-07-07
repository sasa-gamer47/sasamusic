import React, { Suspense } from 'react';
import SearchResultsClient from '@/components/SearchResultsClient';

const SearchPage = () => {
  return (
    <Suspense fallback={<div>Loading search results...</div>}>
      <SearchResultsClient />
    </Suspense>
  );
};

export default SearchPage;
