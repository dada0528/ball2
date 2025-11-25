import React, { useState, FC, useEffect, useRef, useCallback } from 'react';
import BadmintonCourt from './components/BadmintonCourt';
import SetupScreen, { GameConfig, Match, Player, generateSchedule } from './components/SetupScreen';
import RecordsModal from './components/RecordsModal';

// A simple SVG icon for the shuttlecock to indicate the server.
const ShuttlecockIcon: FC<{ className?: string }> = ({ className = '' }) => (
    <svg 
        className={className} 
        viewBox="0 0 24 24" 
        fill="currentColor" 
        xmlns="http://www.w3.org/2000/svg"
    >
        <path d="M18.5 8.5c0 2-2.5 3.5-2.5 3.5l-3 3.5L12 14.5l-3-3.5-3-3.5S3.5 10.5 3.5 8.5c0-2.2 1.8-4 4-4s4 1.8 4 4c0-2.2 1.8-4 4-4s4 1.8 4 4zM12 15l-1 1h4l-1-1-1 1-1-1zM9 17h6v2H9z" />
    </svg>
);

const SoundToggleButton: FC<{ isEnabled: boolean; onClick: () => void }> = ({ isEnabled, onClick }) => (
    <button
        onClick={onClick}
        aria-label={isEnabled ? "關閉音效" : "開啟音效"}
        className="absolute top-4 left-4 z-40 bg-white/80 text-gray-800 p-2 rounded-full shadow-lg hover:bg-white transition-all duration-300 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white"
    >
        {isEnabled ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
        ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                 <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l-4-4m0 4l4-4" />
            </svg>
        )}
    </button>
);

const UndoButton: FC<{ onClick: () => void; disabled: boolean }> = ({ onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        aria-label="回到上一步"
        className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-white/80 text-gray-800 p-2 rounded-full shadow-lg hover:bg-white transition-all duration-300 ease-in-out transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
    >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15l-6-6m0 0l6-6m-6 6h12a6 6 0 010 12h-3" />
        </svg>
    </button>
);


const BackToScheduleButton: FC<{ onClick: () => void; label: string }> = ({ onClick, label }) => (
    <button
        onClick={onClick}
        className="absolute top-4 right-4 z-40 bg-white/80 text-gray-800 font-semibold px-4 py-2 rounded-full shadow-lg hover:bg-white transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-white"
    >
        {label}
    </button>
);

const ScheduleDisplay: FC<{ schedule: Match[]; currentMatchIndex: number; matchHistory: MatchRecord[]; title?: string }> = ({ schedule, currentMatchIndex, matchHistory, title }) => {
    const currentMatchRef = useRef<HTMLDivElement>(null);

    // This effect will scroll the current match into the center of the view when it changes.
    useEffect(() => {
        if (currentMatchRef.current) {
            currentMatchRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
                inline: 'center',
            });
        }
    }, [currentMatchIndex]);

    return (
        <div className="w-full bg-black/40 backdrop-blur-sm p-3 min-w-0">
            <h3 className="text-white text-center text-xs font-bold mb-2 tracking-wider">{title || '對戰賽程'}</h3>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {schedule.map((match, index) => {
                    const isCurrent = index === currentMatchIndex;
                    const isFinished = matchHistory.some(h => JSON.stringify(h.match) === JSON.stringify(match));
                    const teamADisplay = match.teamA.map(p => `${p.name}(${p.level})`).join('/');
                    const teamBDisplay = match.teamB.map(p => `${p.name}(${p.level})`).join('/');
                    const record = matchHistory.find(h => JSON.stringify(h.match) === JSON.stringify(match));
                    
                    const getCardStyle = () => {
                        if (isCurrent) return 'bg-yellow-400 text-black shadow-lg';
                        if (isFinished) return 'bg-white/5 text-white/70';
                        return 'bg-white/10 text-white';
                    };

                    return (
                        <div 
                            key={index} 
                            ref={isCurrent ? currentMatchRef : null}
                            className={`p-2 rounded-lg text-center flex-shrink-0 w-44 transition-all duration-300 ${getCardStyle()}`}>
                            <p className="font-bold text-sm">第 {index + 1} 場</p>
                            <p className="text-xs truncate mt-1">{teamADisplay}</p>
                            {record ? (
                                <p className={`font-mono text-lg my-0.5 ${isCurrent ? 'text-black' : 'text-white'}`}>
                                    <span className={record.winner === 'playerA' ? 'font-extrabold' : ''}>{record.scores.playerA}</span>
                                    <span className="mx-1">-</span>
                                    <span className={record.winner === 'playerB' ? 'font-extrabold' : ''}>{record.scores.playerB}</span>
                                </p>
                            ) : (
                                <p className={`text-xs my-0.5 ${isCurrent ? 'text-gray-800' : 'text-gray-400'}`}>{isCurrent ? <strong>vs</strong> : 'vs'}</p>
                            )}
                            <p className="text-xs truncate">{teamBDisplay}</p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// Defines the structure for a completed match record.
export interface MatchRecord {
    match: Match;
    winner: 'playerA' | 'playerB';
    scores: { playerA: number; playerB: number };
}

// Defines the structure of the entire game's state.
interface GameState {
  scores: { playerA: number; playerB: number };
  gamesWon: { playerA: number; playerB: number };
  server: 'playerA' | 'playerB';
  winner: 'playerA' | 'playerB' | null;
  matchWinner: 'playerA' | 'playerB' | null;
  ends: { top: 'playerA' | 'playerB'; bottom: 'playerA' | 'playerB' };
  isMidGameEndChangeDone: boolean;
  isGameDecided: boolean;
}

// The initial state for a new match.
const INITIAL_STATE: GameState = {
  scores: { playerA: 0, playerB: 0 },
  gamesWon: { playerA: 0, playerB: 0 },
  server: 'playerA',
  winner: null,
  matchWinner: null,
  ends: { top: 'playerA', bottom: 'playerB' },
  isMidGameEndChangeDone: false,
  isGameDecided: false,
};

const App: FC = () => {
    // Lifted state from SetupScreen
    const [players, setPlayers] = useState<Player[]>([
        { id: 1, name: '', level: 3 },
        { id: 2, name: '', level: 3 },
        { id: 3, name: '', level: 3 },
        { id: 4, name: '', level: 3 },
    ]);
    const [schedules, setSchedules] = useState<Record<string, Match[]> | null>(null);

    const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);
    const [gameConfig, setGameConfig] = useState<GameConfig | null>(null);
    const [matchHistory, setMatchHistory] = useState<MatchRecord[]>([]);
    const [historyStack, setHistoryStack] = useState<GameState[]>([]);
    const [showRecords, setShowRecords] = useState(false);
    const [isSoundEnabled, setIsSoundEnabled] = useState(() => {
        try {
            const item = window.localStorage.getItem('soundEnabled');
            return item ? JSON.parse(item) : true;
        } catch (error) {
            return true;
        }
    });

    // Save sound preference to localStorage
    useEffect(() => {
        try {
            window.localStorage.setItem('soundEnabled', JSON.stringify(isSoundEnabled));
        } catch (error) {
            console.error("Could not save sound preference.", error);
        }
    }, [isSoundEnabled]);

    const speak = useRef((text: string) => {
        if (!text || typeof window.speechSynthesis === 'undefined') return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-TW';
        utterance.rate = 0.95;
        window.speechSynthesis.speak(utterance);
    }).current;

    const handleStartGame = (config: GameConfig) => {
        window.speechSynthesis.cancel();
        setGameConfig(config);
        setGameState(INITIAL_STATE);
        setHistoryStack([]);
        if (config.mode === 'auto') {
            // Do NOT clear match history here if we are continuing a schedule
            // But if it's a completely fresh start (not from existing schedule), we might.
            // Current design: matchHistory persists while 'schedules' exists.
        } else {
             setMatchHistory([]);
        }
    };
    
    // Effect to record match results when a winner is decided.
    useEffect(() => {
        if (gameState.matchWinner && gameConfig?.schedule && gameConfig.currentMatchIndex !== undefined) {
            const currentMatch = gameConfig.schedule[gameConfig.currentMatchIndex];
            const alreadyExists = matchHistory.some(h => JSON.stringify(h.match) === JSON.stringify(currentMatch));
            if (!alreadyExists) {
                 setMatchHistory(prev => [...prev, { 
                    match: currentMatch, 
                    winner: gameState.matchWinner!, 
                    scores: gameState.scores 
                }]);
            }
        }
    }, [gameState.matchWinner, gameConfig, matchHistory, gameState.scores]);
    
    const getPlayerDisplayName = (player: 'playerA' | 'playerB') => {
        if (!gameConfig) return '';
        const teamNames = player === 'playerA' ? gameConfig.playerNames.teamA : gameConfig.playerNames.teamB;
        return teamNames.join(' / ');
    };

    const generateAnnouncement = (newState: GameState, oldState: GameState): string => {
        const { scores: newScores, gamesWon: newGamesWon, winner: newWinner, server: newServer } = newState;
        const { winner: oldWinner } = oldState;

        if (newWinner && !oldWinner) {
            const winnerName = getPlayerDisplayName(newWinner);
            const loser = newWinner === 'playerA' ? 'playerB' : 'playerA';
            return `${winnerName} 獲勝, ${newScores[newWinner]} 比 ${newScores[loser]}`;
        }
        
        if (newWinner) return '';

        const serverScore = newScores[newServer];
        const opponent = newServer === 'playerA' ? 'playerB' : 'playerA';
        const opponentScore = newScores[opponent];

        let prefix = '';
        if ( (serverScore >= 20 && serverScore > opponentScore && (serverScore < 29 || opponentScore < 29)) || (serverScore === 29 && opponentScore === 29) ) {
            const isMatchPoint = gameConfig?.mode === 'auto' || newGamesWon[newServer] === 1;
            prefix = isMatchPoint ? '賽點, ' : '局點, ';
        }
        
        let scoreText;
        if (serverScore === opponentScore) {
            if (serverScore === 0) return '';
            scoreText = (serverScore >= 20) ? "Deuce" : `${serverScore} 平`;
        } else {
            scoreText = `${serverScore} 比 ${opponentScore}`;
        }
        
        return `${prefix}${scoreText}`;
    }

    const handlePoint = (playerWhoScored: 'playerA' | 'playerB') => {
        if (gameState.matchWinner || gameState.isGameDecided) return;

        setHistoryStack(prev => [...prev, gameState]);
        const newState = JSON.parse(JSON.stringify(gameState));

        newState.scores[playerWhoScored]++;
        newState.server = playerWhoScored;

        const { playerA: scoreA, playerB: scoreB } = newState.scores;
        let gameWinner: 'playerA' | 'playerB' | null = null;

        if ((scoreA >= 21 && scoreA >= scoreB + 2) || scoreA === 30) {
            gameWinner = 'playerA';
        } else if ((scoreB >= 21 && scoreB >= scoreA + 2) || scoreB === 30) {
            gameWinner = 'playerB';
        }

        if (gameWinner) {
            newState.winner = gameWinner;
            newState.gamesWon[gameWinner]++;
            newState.isGameDecided = true;
            
            // For 'auto' mode, winning one game wins the match.
            // For other modes, it's the standard best of 3 (win 2 games).
            if (gameConfig?.mode === 'auto' || newState.gamesWon[gameWinner] === 2) {
                newState.matchWinner = gameWinner;
            }
        } else {
            // In the 3rd game of a classic match, players switch ends at 11 points.
            const isDecidingGame = newState.gamesWon.playerA + newState.gamesWon.playerB === 2;
            const isAtEleven = scoreA === 11 || scoreB === 11;
            if (gameConfig?.mode !== 'auto' && isDecidingGame && isAtEleven && !newState.isMidGameEndChangeDone) {
                newState.ends = { top: gameState.ends.bottom, bottom: gameState.ends.top };
                newState.isMidGameEndChangeDone = true;
            }
        }
        
        if (isSoundEnabled) {
            const announcement = generateAnnouncement(newState, gameState);
            speak(announcement);
        }

        setGameState(newState);
    };
    
    const handleNextGame = () => {
        if (gameState.matchWinner) return;
        window.speechSynthesis.cancel();
        setHistoryStack([]);
        setGameState(prevState => {
            const newState = JSON.parse(JSON.stringify(prevState));
            newState.isGameDecided = false;
            newState.winner = null;
            newState.scores = { playerA: 0, playerB: 0 };
            newState.ends = { top: prevState.ends.bottom, bottom: prevState.ends.top };
            newState.isMidGameEndChangeDone = false;
            newState.server = prevState.winner!; 
            return newState;
        });
    };
    
    const handleNextMatch = useCallback(() => {
        if (!gameConfig || gameConfig.mode !== 'auto' || !gameConfig.schedule || gameConfig.currentMatchIndex === undefined) return;
        
        // Check if we need to look at a specific court's schedule
        const currentSchedule = gameConfig.schedule;
        const nextMatchIndex = gameConfig.currentMatchIndex + 1;
        
        if (nextMatchIndex >= currentSchedule.length) {
            return;
        }
        
        window.speechSynthesis.cancel();
        const nextMatch = currentSchedule[nextMatchIndex];
        
        setGameConfig(prevConfig => ({
            ...prevConfig!,
            playerNames: {
                teamA: nextMatch.teamA.map(p => p.name),
                teamB: nextMatch.teamB.map(p => p.name),
            },
            currentMatchIndex: nextMatchIndex,
        }));
        setHistoryStack([]);
        setGameState(INITIAL_STATE);
    }, [gameConfig]);

    // Effect to automatically proceed to the next match in 'auto' mode.
    useEffect(() => {
        if (gameState.matchWinner && gameConfig?.mode === 'auto') {
            const isLastMatch = !gameConfig.schedule || gameConfig.currentMatchIndex === undefined || gameConfig.currentMatchIndex >= gameConfig.schedule.length - 1;
            if (!isLastMatch) {
                const timer = setTimeout(() => {
                    handleNextMatch();
                }, 3000); // 3-second delay to show the winner

                // Cleanup function to clear the timeout if dependencies change or component unmounts
                return () => clearTimeout(timer);
            }
        }
    }, [gameState.matchWinner, gameConfig, handleNextMatch]);

    const handlePlayAgain = () => {
        if (gameConfig?.mode !== 'auto' || !gameConfig.players) return;
        window.speechSynthesis.cancel();

        // If using multi-court schedules, we need to regenerate ALL schedules for next round?
        // For simplicity in this version, if 'schedules' exists (multi-court), we might need to be careful.
        // But handlePlayAgain here is logic from single-track. 
        // With multi-court, users should likely go back to schedule view and regenerate there or just pick matches.
        
        // If we are in multi-court mode, 'handlePlayAgain' might be ambiguous (which court?).
        // Let's redirect to schedule view instead for multi-court.
        if (schedules) {
            setGameConfig(null); // Go back to schedule dashboard
            return;
        }

        const nextRound = (gameConfig.scheduleRound ?? 0) + 1;
        const newSchedule = generateSchedule(gameConfig.players, nextRound);

        if (newSchedule && newSchedule.length > 0) {
            const firstMatch = newSchedule[0];
            setGameConfig({
                mode: 'auto',
                playerNames: {
                    teamA: firstMatch.teamA.map(p => p.name),
                    teamB: firstMatch.teamB.map(p => p.name),
                },
                schedule: newSchedule,
                currentMatchIndex: 0,
                players: gameConfig.players,
                scheduleRound: nextRound,
            });
            setGameState(INITIAL_STATE);
            // setMatchHistory([]); // Optional: Keep history or clear? Prompt says "Next Round", typically implies continuing session or new set.
            // The original logic cleared history, but for multi-court dashboard we usually keep it.
            // Let's keep history for now if it's "Play Again" in single mode, but clear active game.
            // Actually original code did setMatchHistory([]). Let's stick to user intent or dashboard.
            if (!schedules) setMatchHistory([]); 
            setHistoryStack([]);
        }
    };

    const handleBackToDashboard = () => {
        window.speechSynthesis.cancel();
        setGameConfig(null);
        setGameState(INITIAL_STATE);
        setHistoryStack([]);
    };

    const handleResetAll = () => {
         window.speechSynthesis.cancel();
         setGameConfig(null);
         setGameState(INITIAL_STATE);
         setMatchHistory([]);
         setHistoryStack([]);
         setSchedules(null); // Go back to player input
    }
    
    const handleUndo = () => {
        if (historyStack.length === 0) return;
        window.speechSynthesis.cancel();
        const lastState = historyStack[historyStack.length - 1];
        setGameState(lastState);
        setHistoryStack(prev => prev.slice(0, -1));
    };

    const handleToggleSound = () => {
        if (isSoundEnabled) {
            window.speechSynthesis.cancel();
        }
        setIsSoundEnabled(prev => !prev);
    };
    
    // RENDER LOGIC
    // 1. If gameConfig is active -> Show Court (Game Mode)
    // 2. If !gameConfig -> Show SetupScreen (which handles both Player Input and Schedule Dashboard)

    if (!gameConfig) {
        return (
            <SetupScreen 
                onStartGame={handleStartGame}
                players={players}
                setPlayers={setPlayers}
                schedules={schedules}
                setSchedules={setSchedules}
            />
        );
    }
    
    const isLastMatch = gameConfig.mode !== 'auto' || !gameConfig.schedule || gameConfig.currentMatchIndex === undefined || gameConfig.currentMatchIndex >= gameConfig.schedule.length - 1;

    const topPlayer = gameState.ends.top;
    const bottomPlayer = gameState.ends.bottom;
    const topPlayerName = getPlayerDisplayName(topPlayer);
    const bottomPlayerName = getPlayerDisplayName(bottomPlayer);
    const winnerName = gameState.winner ? getPlayerDisplayName(gameState.winner) : '';
    const matchWinnerName = gameState.matchWinner ? getPlayerDisplayName(gameState.matchWinner) : '';

    return (
        <main className="h-screen w-screen flex flex-col bg-[#05483A] font-sans antialiased overflow-hidden select-none relative">
            <SoundToggleButton isEnabled={isSoundEnabled} onClick={handleToggleSound} />
            <UndoButton onClick={handleUndo} disabled={historyStack.length === 0} />
            
            {!gameState.matchWinner && (
                <BackToScheduleButton 
                    onClick={handleBackToDashboard} 
                    label={schedules ? "返回賽程" : "返回設定"} 
                />
            )}
            
            <div className="flex-1 flex flex-col relative">
                <BadmintonCourt />

                {/* Top player's court area */}
                <div
                    className="flex-1 w-full flex justify-center items-center cursor-pointer relative group transition-colors duration-300 hover:bg-white/10"
                    onClick={() => handlePoint(topPlayer)}
                >
                    <div className="absolute top-4 left-4 lg:left-auto lg:right-4 bg-black/40 px-4 py-2 rounded-lg text-white font-semibold text-lg flex flex-col items-start lg:items-end gap-1 shadow-lg">
                        <span>{topPlayerName}</span>
                        <span className="text-base font-normal">局數: {gameState.gamesWon[topPlayer]}</span>
                    </div>
                    <div className="flex items-center justify-center">
                        <span className="font-mono text-9xl md:text-[12rem] lg:text-[15rem] font-black text-white text-opacity-80 transition-transform duration-300 group-hover:scale-110" style={{textShadow: '0 0 15px rgba(0,0,0,0.5)'}}>
                            {gameState.scores[topPlayer]}
                        </span>
                        {gameState.server === topPlayer && !gameState.matchWinner && !gameState.isGameDecided && (
                             <ShuttlecockIcon className="w-16 h-16 md:w-20 md:h-20 text-yellow-300 ml-4 -translate-y-4 opacity-90" />
                        )}
                    </div>
                </div>

                <div className="w-full h-1 bg-white/60 shadow-lg"></div>

                {/* Bottom player's court area */}
                <div
                    className="flex-1 w-full flex justify-center items-center cursor-pointer relative group transition-colors duration-300 hover:bg-white/10"
                    onClick={() => handlePoint(bottomPlayer)}
                >
                    <div className="absolute bottom-4 right-4 bg-black/40 px-4 py-2 rounded-lg text-white font-semibold text-lg flex flex-col items-end gap-1 shadow-lg">
                        <span>{bottomPlayerName}</span>
                        <span className="text-base font-normal">局數: {gameState.gamesWon[bottomPlayer]}</span>
                    </div>
                    <div className="flex items-center justify-center">
                        <span className="font-mono text-9xl md:text-[12rem] lg:text-[15rem] font-black text-white text-opacity-80 transition-transform duration-300 group-hover:scale-110" style={{textShadow: '0 0 15px rgba(0,0,0,0.5)'}}>
                            {gameState.scores[bottomPlayer]}
                        </span>
                         {gameState.server === bottomPlayer && !gameState.matchWinner && !gameState.isGameDecided &&(
                            <ShuttlecockIcon className="w-16 h-16 md:w-20 md:h-20 text-yellow-300 ml-4 -translate-y-4 opacity-90" />
                        )}
                    </div>
                </div>

                 {/* Overlay for when a game is won but the match is not over */}
                {gameState.isGameDecided && !gameState.matchWinner && (
                    <div 
                        className="absolute inset-0 bg-black/60 flex flex-col justify-center items-center z-20 cursor-pointer animate-fade-in"
                        onClick={handleNextGame}
                    >
                        <h2 className="text-5xl font-bold text-white mb-4">
                            {winnerName} 贏得此局
                        </h2>
                        <p className="text-2xl text-white/80">點擊開始下一局</p>
                    </div>
                )}

                {/* Overlay for the match winner */}
                {gameState.matchWinner && (
                     !isLastMatch ? (
                        <div className="absolute inset-0 bg-black/70 flex flex-col justify-center items-center z-20 animate-fade-in">
                            <h2 className="text-6xl font-extrabold text-white">
                                {matchWinnerName} 獲勝!
                            </h2>
                            <p className="text-2xl text-yellow-300 mt-4 bg-black/30 px-4 py-2 rounded-lg">準備開始下一場比賽...</p>
                        </div>
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-black/70 flex flex-col justify-center items-center z-20 animate-fade-in">
                            <h2 className="text-6xl font-extrabold text-white animate-pulse">
                                {matchWinnerName} 獲勝!
                            </h2>
                            <p className="text-2xl text-white/80 mt-4">所有賽程已結束</p>
                            <div className="mt-8 flex flex-wrap justify-center gap-4">
                                <button 
                                    onClick={handlePlayAgain}
                                    className="bg-yellow-400 text-black font-bold px-8 py-3 rounded-full text-lg hover:bg-yellow-300 transition-all duration-300 transform hover:scale-105 shadow-lg"
                                >
                                    {schedules ? "返回賽程" : "再玩一輪"}
                                </button>
                                 <button
                                    onClick={() => setShowRecords(true)}
                                    className="bg-blue-500 text-white font-bold px-8 py-3 rounded-full text-lg hover:bg-blue-400 transition-all duration-300"
                                >
                                    查看紀錄
                                </button>
                                 <button
                                    onClick={schedules ? handleBackToDashboard : handleResetAll}
                                    className="bg-gray-500 text-white font-bold px-8 py-3 rounded-full text-lg hover:bg-gray-400 transition-all duration-300"
                                >
                                    {schedules ? "返回賽程表" : "重新設定"}
                                </button>
                            </div>
                        </div>
                    )
                )}
            </div>
            
            {/* Show simple scrollable schedule at bottom only if we are in Single Mode Auto or if we want to show just the current track. 
                For Multi-court, maybe better to keep clean or show just the current court's schedule. 
                Updated to show current court's schedule if available.
            */}
            {gameConfig.mode === 'auto' && gameConfig.schedule && gameConfig.currentMatchIndex !== undefined && (
                 <ScheduleDisplay 
                    schedule={gameConfig.schedule} 
                    currentMatchIndex={gameConfig.currentMatchIndex}
                    matchHistory={matchHistory}
                    title={gameConfig.courtId ? `${gameConfig.courtId} 賽程` : '對戰賽程'}
                />
            )}
            
            <RecordsModal
                isOpen={showRecords}
                onClose={() => setShowRecords(false)}
                history={matchHistory}
                players={gameConfig.players || players || []}
            />

        </main>
    );
};

export default App;