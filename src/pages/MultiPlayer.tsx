export default function MultiPlayer() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold text-white mb-4 drop-shadow-lg">
                        MultiPlayer
                    </h1>
                    <p className="text-xl text-white/90 font-light">
                        Connect with friends and start playing together
                    </p>
                </div>
                
                {/* Sections Container */}
                <div className="flex flex-col lg:flex-row gap-8 justify-center items-start">
                    {/* Create Room Section */}
                    <div className="flex-1 max-w-md w-full bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/20">
                        <h2 className="text-2xl font-semibold text-gray-800 text-center mb-6">
                            🎮 Create Room
                        </h2>
                        
                        <div className="space-y-6">
                            <div>
                                <label htmlFor="create-name" className="block text-sm font-medium text-gray-700 mb-2">
                                    Your Name
                                </label>
                                <input
                                    id="create-name"
                                    type="text"
                                    placeholder="Enter your name"
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 focus:bg-white transition-all duration-300 text-gray-800 placeholder-gray-400"
                                />
                            </div>
                            
                            <button className="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg uppercase tracking-wide">
                                Create Room
                            </button>
                        </div>
                    </div>

                    {/* Join Room Section */}
                    <div className="flex-1 max-w-md w-full bg-white/95 backdrop-blur-sm rounded-2xl p-8 shadow-2xl border border-white/20">
                        <h2 className="text-2xl font-semibold text-gray-800 text-center mb-6">
                            🚪 Join Room
                        </h2>
                        
                        <div className="space-y-6">
                            <div>
                                <label htmlFor="join-name" className="block text-sm font-medium text-gray-700 mb-2">
                                    Your Name
                                </label>
                                <input
                                    id="join-name"
                                    type="text"
                                    placeholder="Enter your name"
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white transition-all duration-300 text-gray-800 placeholder-gray-400"
                                />
                            </div>
                            
                            <div>
                                <label htmlFor="room-id" className="block text-sm font-medium text-gray-700 mb-2">
                                    Room ID
                                </label>
                                <input
                                    id="room-id"
                                    type="text"
                                    placeholder="Enter room ID"
                                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white transition-all duration-300 text-gray-800 placeholder-gray-400"
                                />
                            </div>
                            
                            <button className="w-full bg-purple-500 hover:bg-purple-600 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg uppercase tracking-wide">
                                Join Room
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
