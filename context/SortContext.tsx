import React, { createContext, useContext, useState } from 'react';

type SortOrder = 'Mas recientes' | 'Mas antiguas' | 'Nombre A-Z' | 'Nombre Z-A';

interface SortContextProps {
  sortOrder: SortOrder;
  setSortOrder: (order: SortOrder) => void;
}

const SortContext = createContext<SortContextProps>({
  sortOrder: 'Mas recientes',
  setSortOrder: () => {},
});

export const SortProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sortOrder, setSortOrder] = useState<SortOrder>('Mas recientes');

  return (
    <SortContext.Provider value={{ sortOrder, setSortOrder }}>
      {children}
    </SortContext.Provider>
  );
};

export const useSortContext = () => useContext(SortContext);
