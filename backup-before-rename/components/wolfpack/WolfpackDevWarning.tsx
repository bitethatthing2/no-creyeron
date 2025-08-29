export interface WolfpackDevWarningProps {
  isUsingFallback: boolean;
}

export const WolfpackDevWarning = ({ isUsingFallback }: WolfpackDevWarningProps) => {
  if (!isUsingFallback || process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4">
      <p className="font-bold">Development Notice</p>
      <p className="text-sm">
        Wolf profiles relationship not found. Using fallback data.
        This may indicate a database schema issue that should be resolved.
      </p>
      <p className="text-xs mt-1 opacity-75">
        This warning only appears in development mode.
      </p>
    </div>
  );
};
