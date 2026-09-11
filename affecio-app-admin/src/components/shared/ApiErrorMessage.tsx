interface ApiErrorMessageProps {
  message: string;
}

export function ApiErrorMessage({ message }: ApiErrorMessageProps) {
  return (
    <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-700 dark:text-red-400">
      {message}
    </div>
  );
}
