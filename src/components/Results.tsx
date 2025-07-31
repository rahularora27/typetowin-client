interface ResultsProps {
    correctChars: number;
    incorrectChars: number;
}

function Results({ correctChars, incorrectChars }: ResultsProps) {
    return (
        <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Game Over!</h2>
            <p className="text-gray-700">Correct Characters: <span className="font-bold">{correctChars}</span></p>
            <p className="text-gray-700">Incorrect Characters: <span className="font-bold">{incorrectChars}</span></p>
        </div>
    );
}

export default Results;
