import React from 'react';
import { Button } from './Button';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  lastPage: number;
  onPageChange: (page: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({ currentPage, lastPage, onPageChange }) => {
  if (lastPage <= 1) return null;

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(lastPage, start + maxVisible - 1);

    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    if (start > 1) {
      pages.push(
        <Button key={1} variant={currentPage === 1 ? 'default' : 'outline'} onClick={() => onPageChange(1)} className={`w-10 h-10 p-0 rounded-xl ${currentPage === 1 ? 'bg-primary text-slate-900 border-0' : 'border-slate-200 dark:border-slate-800'}`}>
          1
        </Button>
      );
      if (start > 2) {
        pages.push(<div key="dots-1" className="flex items-center justify-center w-10 text-slate-400"><MoreHorizontal size={16} /></div>);
      }
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <Button key={i} variant={currentPage === i ? 'default' : 'outline'} onClick={() => onPageChange(i)} className={`w-10 h-10 p-0 rounded-xl ${currentPage === i ? 'bg-primary text-slate-900 border-0' : 'border-slate-200 dark:border-slate-800'}`}>
          {i}
        </Button>
      );
    }

    if (end < lastPage) {
      if (end < lastPage - 1) {
        pages.push(<div key="dots-2" className="flex items-center justify-center w-10 text-slate-400"><MoreHorizontal size={16} /></div>);
      }
      pages.push(
        <Button key={lastPage} variant={currentPage === lastPage ? 'default' : 'outline'} onClick={() => onPageChange(lastPage)} className={`w-10 h-10 p-0 rounded-xl ${currentPage === lastPage ? 'bg-primary text-slate-900 border-0' : 'border-slate-200 dark:border-slate-800'}`}>
          {lastPage}
        </Button>
      );
    }

    return pages;
  };

  return (
    <div className="flex items-center justify-center space-x-2 mt-8">
      <Button 
        variant="outline" 
        disabled={currentPage === 1} 
        onClick={() => onPageChange(currentPage - 1)}
        className="w-10 h-10 p-0 rounded-xl border-slate-200 dark:border-slate-800"
      >
        <ChevronLeft size={16} />
      </Button>
      
      {renderPageNumbers()}
      
      <Button 
        variant="outline" 
        disabled={currentPage === lastPage} 
        onClick={() => onPageChange(currentPage + 1)}
        className="w-10 h-10 p-0 rounded-xl border-slate-200 dark:border-slate-800"
      >
        <ChevronRight size={16} />
      </Button>
    </div>
  );
};
