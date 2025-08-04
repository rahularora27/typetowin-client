import { Link } from "react-router-dom";

export default function App() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-8">
            <div className="max-w-4xl mx-auto text-center">
                {/* Header */}
                <div className="mb-12">
                    <h1 className="text-6xl font-bold text-white mb-6 drop-shadow-lg">
                        TypeToWin
                    </h1>
                </div>
                
                {/* Navigation Buttons */}
                <div className="flex flex-col sm:flex-row gap-8 justify-center items-center">
                    {/* SinglePlayer Button */}
                    <Link to="/singleplayer" className="group">
                        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 min-w-[280px]">
                            <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
                                🎯
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-3">
                                SinglePlayer
                            </h2>
                            <button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform group-hover:-translate-y-1 group-hover:shadow-lg uppercase tracking-wide">
                                Start Solo Game
                            </button>
                        </div>
                    </Link>

                    {/* MultiPlayer Button */}
                    <Link to="/multiplayer" className="group">
                        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/20 hover:shadow-3xl transition-all duration-300 transform hover:-translate-y-2 hover:scale-105 min-w-[280px]">
                            <div className="text-6xl mb-4 group-hover:scale-110 transition-transform duration-300">
                                👥
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800 mb-3">
                                MultiPlayer
                            </h2>
                            <button className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform group-hover:-translate-y-1 group-hover:shadow-lg uppercase tracking-wide">
                                Join Friends
                            </button>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
