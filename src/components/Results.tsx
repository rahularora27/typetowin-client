interface ResultsProps {
    correctChars: number;
    incorrectChars: number;
}

function Results({ correctChars, incorrectChars }: ResultsProps) {
    const totalChars = correctChars + incorrectChars;
    const accuracy = totalChars > 0 ? ((correctChars / totalChars) * 100).toFixed(1) : 0;

    return (
        <div className="flex flex-col items-center justify-center space-y-6">
            {/* Main Stats */}
            <div className="flex items-center space-x-12">
                {/* Accuracy */}
                <div className="text-center">
                    <div className="text-gray-500 text-sm mb-1">acc</div>
                    <div className="text-[#e2b714] text-4xl font-bold">{accuracy}%</div>
                </div>
                
                {/* Correct/Incorrect */}
                <div className="text-center">
                    <div className="text-gray-500 text-sm mb-1">characters</div>
                    <div className="flex items-baseline space-x-2">
                        <span className="text-gray-300 text-3xl font-bold">{correctChars}</span>
                        <span className="text-gray-600 text-xl">/</span>
                        <span className="text-red-400 text-3xl font-bold">{incorrectChars}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Results;
