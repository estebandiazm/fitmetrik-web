import { TablePagination } from '../../src/components/coach/TablePagination';

export function MiddlePage() {
  return <TablePagination page={2} totalPages={8} onPageChange={() => {}} />;
}

export function FirstPage() {
  return <TablePagination page={0} totalPages={8} onPageChange={() => {}} />;
}

export function LastPage() {
  return <TablePagination page={7} totalPages={8} onPageChange={() => {}} />;
}
