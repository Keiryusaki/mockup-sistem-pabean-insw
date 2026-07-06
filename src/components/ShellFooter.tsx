export function ShellFooter() {
  return (
    <footer className="mt-auto border-t border-white bg-white px-4 py-3 text-[13px] text-neutral-700 sm:px-6">
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="min-w-0 text-left leading-6">
          Copyright (c) 2020 - 2026 All Right Reserved |{" "}
          <span className="font-medium text-brand-primary-600">Indonesia National Single Window</span>
        </p>
        <div className="self-start rounded-md border border-neutral-700 bg-white px-3 py-2 text-[12px] font-medium text-brand-primary-600 shadow-sm sm:self-auto">
          v1.6.1
        </div>
      </div>
    </footer>
  );
}
