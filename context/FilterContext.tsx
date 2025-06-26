import React, { createContext, useContext, useState } from 'react';

export type FilterState = {
  user: string;
  include: string[];
  exclude: string[];
  categories: string[];
};

const initialFilters: FilterState = {
  user: '',
  include: [],
  exclude: [],
  categories: [],
};

const FilterContext = createContext<{
  filters: FilterState;
  setFilters: (f: FilterState) => void;
}>({ filters: initialFilters, setFilters: () => {} });

export const useFilterContext = () => useContext(FilterContext);

export const FilterProvider = ({ children }: { children: React.ReactNode }) => {
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  return (
    <FilterContext.Provider value={{ filters, setFilters }}>
      {children}
    </FilterContext.Provider>
  );
};
