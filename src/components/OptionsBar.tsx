interface OptionsBarProps {
  gameMode: 'timer' | 'words';
  includePunctuation: boolean;
  includeNumbers: boolean;
  timerDuration: number;
  wordCount: number;
  onPunctuationToggle: () => void;
  onNumbersToggle: () => void;
  onModeSelect: (mode: 'timer' | 'words') => void;
  onPrimaryOptionSelect: (value: number) => void;
  onCustomPrimaryClick: () => void;
}

function OptionsBar({
  gameMode,
  includePunctuation,
  includeNumbers,
  timerDuration,
  wordCount,
  onPunctuationToggle,
  onNumbersToggle,
  onModeSelect,
  onPrimaryOptionSelect,
  onCustomPrimaryClick,
}: OptionsBarProps) {
  const primaryValues = gameMode === 'timer' ? [15, 30, 60] : [10, 25, 50];
  const isCustomSelected = gameMode === 'timer'
    ? (timerDuration !== 15 && timerDuration !== 30 && timerDuration !== 60)
    : (wordCount !== 10 && wordCount !== 25 && wordCount !== 50);

  return (
    <div className="flex items-center bg-[#2c2e31] rounded-lg px-4 py-2 space-x-4">
      {/* Content Options */}
      <div className="flex items-center space-x-3">
        <button
          className={`text-sm transition-colors duration-200 ${
            includePunctuation ? 'text-[#e2b714]' : 'text-gray-500 hover:text-gray-300'
          }`}
          onClick={onPunctuationToggle}
        >
          punctuation
        </button>
        <button
          className={`text-sm transition-colors duration-200 ${
            includeNumbers ? 'text-[#e2b714]' : 'text-gray-500 hover:text-gray-300'
          }`}
          onClick={onNumbersToggle}
        >
          numbers
        </button>
      </div>

      {/* Vertical Separator */}
      <div className="h-6 w-px bg-gray-700" />

      {/* Game Mode Selection */}
      <div className="flex items-center space-x-3">
        <button
          className={`text-sm transition-colors duration-200 ${
            gameMode === 'timer' ? 'text-[#e2b714]' : 'text-gray-500 hover:text-gray-300'
          }`}
          onClick={() => onModeSelect('timer')}
        >
          time
        </button>
        <button
          className={`text-sm transition-colors duration-200 ${
            gameMode === 'words' ? 'text-[#e2b714]' : 'text-gray-500 hover:text-gray-300'
          }`}
          onClick={() => onModeSelect('words')}
        >
          words
        </button>
      </div>

      {/* Vertical Separator */}
      <div className="h-6 w-px bg-gray-700" />

      {/* Primary Options */}
      <div className="flex items-center space-x-2">
        {primaryValues.map((val) => {
          const isSelected = gameMode === 'timer' ? timerDuration === val : wordCount === val;
          return (
            <button
              key={val}
              className={`text-sm px-3 py-1 rounded transition-colors duration-200 ${
                isSelected ? 'text-[#e2b714]' : 'text-gray-500 hover:text-gray-300'
              }`}
              onClick={() => onPrimaryOptionSelect(val)}
            >
              {val}
            </button>
          );
        })}
        <button
          className={`text-sm px-3 py-1 rounded transition-colors duration-200 ${
            isCustomSelected ? 'text-[#e2b714]' : 'text-gray-500 hover:text-gray-300'
          }`}
          onClick={onCustomPrimaryClick}
        >
          custom
        </button>
      </div>
    </div>
  );
}

export default OptionsBar;
