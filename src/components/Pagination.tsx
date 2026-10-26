import { Button } from "./Button";

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(Math.max(1, page - 1))}>
        Sebelumnya
      </Button>
      {Array.from({ length: totalPages }).map((_, index) => {
        const target = index + 1;
        const active = target === page;
        return (
          <Button
            key={target}
            variant={active ? "primary" : "outline"}
            size="sm"
            className={active ? "!border-brand-primary-800 !bg-brand-primary-800" : ""}
            aria-current={active ? "page" : undefined}
            onClick={() => onPageChange(target)}
          >
            {target}
          </Button>
        );
      })}
      <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(Math.min(totalPages, page + 1))}>
        Selanjutnya
      </Button>
    </div>
  );
}
