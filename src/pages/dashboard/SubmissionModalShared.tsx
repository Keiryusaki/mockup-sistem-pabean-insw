import { Button } from "../../components/Button";

export function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-current">
      <path d="M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4 17.6 5 12 10.6 6.4 5Z" />
    </svg>
  );
}

export function ModalCancelButton({ onClick, className = "" }: { onClick: () => void; className?: string }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} startIcon={<CloseIcon />} className={className}>
      Batal
    </Button>
  );
}
