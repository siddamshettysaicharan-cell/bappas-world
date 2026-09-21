/**
 * Main Full-screen Game Canvas and State Manager
 * Handles the game loop, responsive rendering, scene transitions,
 * audio orchestration, and unified desktop/mobile controls.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { soundEngine } from '../audio/soundEngine';
import { CHAPTERS_DATA, WORLD_BOUNDS } from '../game/constants';
import { BappaMatchScene } from '../game/scenes/BappaMatchScene';
import { CinematicIntroScene } from '../game/scenes/CinematicIntroScene';
import { GreatRaceScene } from '../game/scenes/GreatRaceScene';
import { KuberaFeastScene } from '../game/scenes/KuberaFeastScene';
import { MainMenuScene } from '../game/scenes/MainMenuScene';
import { MushikaRunScene } from '../game/scenes/MushikaRunScene';
import { ScribeScene } from '../game/scenes/ScribeScene';
import { WorldScene } from '../game/scenes/WorldScene';
import { ChapterId, FeastGameResult, GameScene, PlayerProfile, WorldLandmark } from '../types';
import { getLocalPlayerProfile, saveGameScore } from '../lib/supabase';
import { LeaderboardModal } from './LeaderboardModal';
import { PlayerRegistrationModal } from './PlayerRegistrationModal';
import { ResultOverlay } from './ResultOverlay';
import { StoryIntroOverlay } from './StoryIntroOverlay';
import { StoryJournalModal } from './StoryJournalModal';
import { VirtualJoystick } from './VirtualJoystick';

export const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Player Profile State (First launch registration + persistence)
  const [playerProfile, setPlayerProfile] = useState<PlayerProfile | null>(() => getLocalPlayerProfile());
  const playerProfileRef = useRef<PlayerProfile | null>(playerProfile);
  useEffect(() => {
    playerProfileRef.current = playerProfile;
  }, [playerProfile]);

  // High-level Game Scenes: starts with the dedicated, completely separate CINEMATIC_INTRO scene
  const [currentScene, setCurrentScene] = useState<GameScene>('CINEMATIC_INTRO');
  const [isWorldPlayable, setIsWorldPlayable] = useState<boolean>(true);
  const [activeChapterId, setActiveChapterId] = useState<ChapterId>('kubera_feast');
  const [lastResult, setLastResult] = useState<FeastGameResult | null>(null);
  const [showJournal, setShowJournal] = useState<boolean>(false);
  const [showHelp, setShowHelp] = useState<boolean>(false);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [leaderboardGameId, setLeaderboardGameId] = useState<string>('kubera_feast');
  const [isMuted, setIsMuted] = useState<boolean>(soundEngine.getMuted());
  const [nearLandmarkName, setNearLandmarkName] = useState<string | null>(null);
  const [activeLandmark, setActiveLandmark] = useState<WorldLandmark | null>(null);
  const activeLandmarkRef = useRef<WorldLandmark | null>(null);
  const [isPortrait, setIsPortrait] = useState<boolean>(() => typeof window !== 'undefined' ? window.innerHeight > window.innerWidth : false);
  const [dismissedPortraitNotice, setDismissedPortraitNotice] = useState<boolean>(false);

  // Scene instances kept in refs to avoid re-creation on re-renders
  const cinematicIntroSceneRef = useRef<CinematicIntroScene | null>(null);
  const mainMenuSceneRef = useRef<MainMenuScene | null>(null);
  const worldSceneRef = useRef<WorldScene | null>(null);
  const kuberaFeastSceneRef = useRef<KuberaFeastScene | null>(null);
  const scribeSceneRef = useRef<ScribeScene | null>(null);
  const greatRaceSceneRef = useRef<GreatRaceScene | null>(null);
  const mushikaRunSceneRef = useRef<MushikaRunScene | null>(null);
  const bappaMatchSceneRef = useRef<BappaMatchScene | null>(null);

  // Input states
  const keysPressed = useRef<Record<string, boolean>>({});
  const joystickDir = useRef<{ dx: number; dy: number }>({ dx: 0, dy: 0 });
  const isTouchDevice = useRef<boolean>(false);
  const mobileTypingInputRef = useRef<HTMLInputElement | null>(null);

  // Handle chapter completion / game over - automatically save score to Supabase
  const handleChapterGameOver = useCallback((result: FeastGameResult) => {
    console.log(`[2 CALLBACK] game=${result.chapterId} result=`, result);
    greatRaceSceneRef.current?.cleanUp();
    bappaMatchSceneRef.current?.cleanUp();
    scribeSceneRef.current?.cleanUp();
    mushikaRunSceneRef.current?.reset();
    setLastResult(result);
    setCurrentScene('CHAPTER_RESULT');

    // Automatically record final score to Supabase 'scores' table
    if (playerProfileRef.current && result.score >= 0) {
      console.log(`[3 SAVE START] player=${playerProfileRef.current.id} game=${result.chapterId} score=${result.score}`);
      saveGameScore({
        playerId: playerProfileRef.current.id,
        gameId: result.chapterId,
        score: result.score,
      }).catch((err) => console.error('[8 DB ERROR] Save failed in handleChapterGameOver:', err));
    } else {
      console.warn('[HANDLE GAME OVER] Score save skipped. Profile:', playerProfileRef.current, 'Result:', result);
    }
  }, []);

  // Return to Ganesha World seamlessly without movement reset or camera snapping
  const handleReturnToWorld = useCallback(() => {
    keysPressed.current = {};
    joystickDir.current = { dx: 0, dy: 0 };
    activeLandmarkRef.current = null;
    setActiveLandmark(null);
    setNearLandmarkName(null);
    worldSceneRef.current?.stopAllMovement();
    scribeSceneRef.current?.cleanUp();
    mushikaRunSceneRef.current?.reset();
    greatRaceSceneRef.current?.cleanUp();
    bappaMatchSceneRef.current?.reset();
    setCurrentScene('GANESHA_WORLD');
  }, []);

  // Initialize scene instances
  useEffect(() => {
    cinematicIntroSceneRef.current = new CinematicIntroScene(() => {
      setIsWorldPlayable(true);
      setCurrentScene('GANESHA_WORLD');
      worldSceneRef.current?.startRevealFromMandap();
    });

    mainMenuSceneRef.current = new MainMenuScene(
      () => {
        setCurrentScene('GANESHA_WORLD');
        worldSceneRef.current?.startRevealFromMandap();
      },
      () => {
        setShowJournal(true);
      }
    );

    worldSceneRef.current = new WorldScene((chapterId: ChapterId) => {
      setActiveChapterId(chapterId);
      setCurrentScene('STORY_INTRO');
    });

    kuberaFeastSceneRef.current = new KuberaFeastScene(handleChapterGameOver);
    scribeSceneRef.current = new ScribeScene(handleChapterGameOver);
    greatRaceSceneRef.current = new GreatRaceScene(handleChapterGameOver, handleReturnToWorld);
    mushikaRunSceneRef.current = new MushikaRunScene(handleChapterGameOver, handleReturnToWorld);
    bappaMatchSceneRef.current = new BappaMatchScene(handleChapterGameOver, handleReturnToWorld);
  }, [handleChapterGameOver, handleReturnToWorld]);

  // Unified Start Chapter
  const startActiveChapter = useCallback(() => {
    keysPressed.current = {};
    joystickDir.current = { dx: 0, dy: 0 };
    worldSceneRef.current?.stopAllMovement();
    if (activeChapterId === 'kubera_feast') {
      kuberaFeastSceneRef.current?.reset();
      setCurrentScene('KUBERA_FEAST');
    } else if (activeChapterId === 'unstoppable_scribe') {
      scribeSceneRef.current?.reset();
      setCurrentScene('SCRIBE_CHAPTER');
    } else if (activeChapterId === 'great_race') {
      greatRaceSceneRef.current?.reset();
      greatRaceSceneRef.current?.startCountdown();
      setCurrentScene('GREAT_RACE');
    } else if (activeChapterId === 'mushaks_adventure') {
      mushikaRunSceneRef.current?.reset();
      mushikaRunSceneRef.current?.startCountdown();
      setCurrentScene('MUSHIKA_RUN');
    } else if (activeChapterId === 'the_gatekeeper') {
      bappaMatchSceneRef.current?.reset();
      bappaMatchSceneRef.current?.startLevel(1);
      setCurrentScene('BAPPA_MATCH');
    } else {
      kuberaFeastSceneRef.current?.reset();
      setCurrentScene('KUBERA_FEAST');
    }
  }, [activeChapterId]);

  // Audio mute toggle
  const toggleMute = () => {
    const muted = soundEngine.toggleMute();
    setIsMuted(muted);
  };

  // Orientation and resize listener
  useEffect(() => {
    const handleResize = () => {
      const isNowPortrait = window.innerHeight > window.innerWidth;
      setIsPortrait(isNowPortrait);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Keyboard navigation & interaction listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = true;

      // Global sound toggle with 'M'
      if (e.key.toLowerCase() === 'm') {
        toggleMute();
        return;
      }

      // Interact with landmark in world using 'E' or Space
      if (currentScene === 'GANESHA_WORLD') {
        const ws = worldSceneRef.current;
        if (ws && (e.key.toLowerCase() === 'e' || e.code === 'Space')) {
          ws.interact();
        }
      }

      // Typing input for Ganesha & Mahabharata (Scribe Chapter)
      if (currentScene === 'SCRIBE_CHAPTER') {
        if (e.key === ' ') {
          e.preventDefault();
          scribeSceneRef.current?.handleInput(' ');
          return;
        }
        if (e.key === 'Backspace') {
          e.preventDefault();
          scribeSceneRef.current?.handleInput('Backspace');
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          scribeSceneRef.current?.handleInput('Enter');
          return;
        }
        if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
          scribeSceneRef.current?.handleInput(e.key);
          return;
        }
      }

      // Directional hopping for Ganesha's River Crossing
      if (currentScene === 'GREAT_RACE') {
        if (e.key === 'ArrowUp' || e.key.toLowerCase() === 'w' || e.key === ' ') {
          e.preventDefault();
          greatRaceSceneRef.current?.handleHop('up');
          return;
        } else if (e.key === 'ArrowDown' || e.key.toLowerCase() === 's') {
          e.preventDefault();
          greatRaceSceneRef.current?.handleHop('down');
          return;
        } else if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
          e.preventDefault();
          greatRaceSceneRef.current?.handleHop('left');
          return;
        } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
          e.preventDefault();
          greatRaceSceneRef.current?.handleHop('right');
          return;
        }
      }

      // Steering input for Mushika Run
      if (currentScene === 'MUSHIKA_RUN') {
        if (e.key === 'ArrowLeft' || e.key.toLowerCase() === 'a') {
          mushikaRunSceneRef.current?.setSteering(-1);
        } else if (e.key === 'ArrowRight' || e.key.toLowerCase() === 'd') {
          mushikaRunSceneRef.current?.setSteering(1);
        }
      }

      // Quick ESC to return from chapter or modal
      if (e.key === 'Escape') {
        if (showJournal) setShowJournal(false);
        else if (showHelp) setShowHelp(false);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current[e.key.toLowerCase()] = false;

      if (currentScene === 'MUSHIKA_RUN') {
        const left = keysPressed.current['arrowleft'] || keysPressed.current['a'];
        const right = keysPressed.current['arrowright'] || keysPressed.current['d'];
        let dir = 0;
        if (left) dir -= 1;
        if (right) dir += 1;
        mushikaRunSceneRef.current?.setSteering(dir);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [currentScene, showJournal, showHelp]);

  // Scroll and touch listeners for CINEMATIC_INTRO
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (currentScene === 'CINEMATIC_INTRO') {
        let delta = e.deltaY;
        // Normalize deltaMode: 0 = pixels, 1 = lines, 2 = pages
        if (e.deltaMode === 1) delta *= 33;
        else if (e.deltaMode === 2) delta *= 500;
        cinematicIntroSceneRef.current?.handleWheel(delta);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (currentScene === 'CINEMATIC_INTRO' && e.touches.length > 0) {
        cinematicIntroSceneRef.current?.handleTouchStart(e.touches[0].clientY);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (currentScene === 'CINEMATIC_INTRO' && e.touches.length > 0) {
        cinematicIntroSceneRef.current?.handleTouchMove(e.touches[0].clientY);
      }
    };

    const handleTouchEnd = () => {
      if (currentScene === 'CINEMATIC_INTRO') {
        cinematicIntroSceneRef.current?.handleTouchEnd();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [currentScene]);

  // Track window resize & orientation
  useEffect(() => {
    const handleResize = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Main 60FPS Game Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min(0.1, (time - lastTime) / 1000); // capped delta time to prevent spiraling
      lastTime = time;

      const canvas = canvasRef.current;
      if (canvas) {
        // Automatically sync canvas resolution to window
        const width = window.innerWidth;
        const height = window.innerHeight;
        if (canvas.width !== width || canvas.height !== height) {
          canvas.width = width;
          canvas.height = height;
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, width, height);

          // Render appropriate active scene
          switch (currentScene) {
            case 'CINEMATIC_INTRO':
              cinematicIntroSceneRef.current?.update(dt, width, height);
              cinematicIntroSceneRef.current?.render(ctx, width, height);
              break;

            case 'MAIN_MENU':
              mainMenuSceneRef.current?.update(dt, width, height);
              mainMenuSceneRef.current?.render(ctx, width, height);
              break;

            case 'GANESHA_WORLD': {
              const ws = worldSceneRef.current;
              if (ws) {
                // Sync playable state to show HUD and controls smoothly
                if (ws.isPlayable !== isWorldPlayable) {
                  setIsWorldPlayable(ws.isPlayable);
                }

                // Keyboard direction input (only when playable)
                if (ws.isPlayable) {
                  let dx = 0;
                  let dy = 0;
                  if (keysPressed.current['w'] || keysPressed.current['arrowup']) dy -= 1;
                  if (keysPressed.current['s'] || keysPressed.current['arrowdown']) dy += 1;
                  if (keysPressed.current['a'] || keysPressed.current['arrowleft']) dx -= 1;
                  if (keysPressed.current['d'] || keysPressed.current['arrowright']) dx += 1;

                  // Combine with virtual joystick if active
                  if (joystickDir.current.dx !== 0 || joystickDir.current.dy !== 0) {
                    dx = joystickDir.current.dx;
                    dy = joystickDir.current.dy;
                  }

                  ws.moveByDirection(dx, dy, dt);
                }

                ws.update(dt, width, height);
                ws.render(ctx, width, height);

                // Update active landmark and HUD state reactively
                const currentLm = ws.activePromptLandmark;
                if (currentLm?.id !== activeLandmarkRef.current?.id) {
                  activeLandmarkRef.current = currentLm;
                  setActiveLandmark(currentLm);
                  setNearLandmarkName(currentLm ? currentLm.name : null);
                }
              }
              break;
            }

            case 'KUBERA_FEAST': {
              const kf = kuberaFeastSceneRef.current;
              if (kf) {
                // Keyboard arrow movement for Thali
                let thaliDir = 0;
                if (keysPressed.current['arrowleft'] || keysPressed.current['a']) thaliDir -= 1;
                if (keysPressed.current['arrowright'] || keysPressed.current['d']) thaliDir += 1;
                if (thaliDir !== 0) {
                  kf.moveThaliKeyboard(thaliDir, dt, width);
                }

                kf.update(dt, width, height);
                kf.render(ctx, width, height);
              }
              break;
            }

            case 'SCRIBE_CHAPTER': {
              const sc = scribeSceneRef.current;
              if (sc) {
                sc.update(dt);
                sc.render(ctx, width, height);
              }
              break;
            }

            case 'GREAT_RACE': {
              const gr = greatRaceSceneRef.current;
              if (gr) {
                gr.update(dt, width, height);
                gr.render(ctx, width, height);
              }
              break;
            }

            case 'MUSHIKA_RUN': {
              const mr = mushikaRunSceneRef.current;
              if (mr) {
                // Poll keys continuously for smooth fluid steering
                let dir = 0;
                if (keysPressed.current['arrowleft'] || keysPressed.current['a']) dir -= 1;
                if (keysPressed.current['arrowright'] || keysPressed.current['d']) dir += 1;
                if (dir !== 0) {
                  mr.setSteering(dir);
                }

                mr.update(dt, width, height);
                mr.render(ctx, width, height);
              }
              break;
            }

            case 'BAPPA_MATCH': {
              const bm = bappaMatchSceneRef.current;
              if (bm) {
                bm.update(dt, width, height);
                bm.render(ctx, width, height);
              }
              break;
            }

            case 'STORY_INTRO':
            case 'CHAPTER_RESULT':
              // Freeze background scene under overlay
              if (activeChapterId === 'kubera_feast' && kuberaFeastSceneRef.current) {
                kuberaFeastSceneRef.current.render(ctx, width, height);
              } else if (activeChapterId === 'unstoppable_scribe' && scribeSceneRef.current) {
                scribeSceneRef.current.render(ctx, width, height);
              } else if (activeChapterId === 'mushaks_adventure' && mushikaRunSceneRef.current) {
                mushikaRunSceneRef.current.render(ctx, width, height);
              } else if (activeChapterId === 'the_gatekeeper' && bappaMatchSceneRef.current) {
                bappaMatchSceneRef.current.render(ctx, width, height);
              } else if (worldSceneRef.current) {
                worldSceneRef.current.render(ctx, width, height);
              }
              break;
          }
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [currentScene, activeChapterId]);

  // Pointer Movement (for moving the Feast Thali)
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (currentScene === 'KUBERA_FEAST') {
      kuberaFeastSceneRef.current?.updatePointer(e.clientX, window.innerWidth);
    }
  };

  // Pointer Down / Click (for walking in World, direct click on feast items, or hitting scribe runes)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    soundEngine.startAmbient();
    isTouchDevice.current = e.pointerType === 'touch';

    if (currentScene === 'CINEMATIC_INTRO') {
      // Tap or click on intro screen advances darshan smoothly
      cinematicIntroSceneRef.current?.handlePointerTap();
      return;
    }

    if (currentScene === 'MAIN_MENU') {
      // Click anywhere to transition to world
      mainMenuSceneRef.current?.handlePlayClick();
      return;
    }

    if (currentScene === 'GANESHA_WORLD') {
      const ws = worldSceneRef.current;
      if (ws) {
        // Convert screen coordinates to world coordinates taking cameraZoom & cameraFocus into account
        const halfViewW = window.innerWidth / 2;
        const halfViewH = window.innerHeight / 2;
        const worldX = ws.cameraFocus.x + (e.clientX - halfViewW) / ws.cameraZoom;
        const worldY = ws.cameraFocus.y + (e.clientY - halfViewH) / ws.cameraZoom;
        ws.setMoveTarget(worldX, worldY);
      }
      return;
    }

    if (currentScene === 'KUBERA_FEAST') {
      // Direct click on falling food item
      kuberaFeastSceneRef.current?.handlePointerClick(e.clientX, e.clientY);
      // Also sync Thali position
      kuberaFeastSceneRef.current?.updatePointer(e.clientX, window.innerWidth);
      return;
    }

    if (currentScene === 'SCRIBE_CHAPTER') {
      scribeSceneRef.current?.handlePointerClick(e.clientX, e.clientY);
      mobileTypingInputRef.current?.focus();
      return;
    }

    if (currentScene === 'MUSHIKA_RUN') {
      mushikaRunSceneRef.current?.handlePointerDown(e.clientX, e.clientY, window.innerWidth, window.innerHeight);
      return;
    }

    if (currentScene === 'GREAT_RACE') {
      greatRaceSceneRef.current?.handlePointerDown(e.clientX, e.clientY, window.innerWidth, window.innerHeight);
      return;
    }

    if (currentScene === 'BAPPA_MATCH') {
      bappaMatchSceneRef.current?.handlePointerDown(e.clientX, e.clientY, window.innerWidth, window.innerHeight);
      return;
    }
  };

  const handlePointerUp = () => {
    if (currentScene === 'MUSHIKA_RUN') {
      mushikaRunSceneRef.current?.handlePointerUp();
    }
    if (currentScene === 'GREAT_RACE') {
      greatRaceSceneRef.current?.handlePointerUp();
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-[#0d0604]">
      {/* Primary HTML5 2D Game Canvas */}
      <canvas
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        className={`absolute inset-0 w-full h-full touch-none ${currentScene === 'CINEMATIC_INTRO' ? 'cursor-default' : 'cursor-crosshair'}`}
      />

      {/* PORTRAIT ORIENTATION BANNER (Non-blocking, dismissible game notice) */}
      {isPortrait && !dismissedPortraitNotice && currentScene !== 'CINEMATIC_INTRO' && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-30 pointer-events-auto max-w-[92vw] animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="bg-[#3E3028]/95 border border-[#C6A15B] text-[#F6EBD8] px-3.5 py-1.5 rounded-full shadow-[0_4px_24px_rgba(0,0,0,0.7)] backdrop-blur-xs flex items-center gap-2.5 text-xs font-outfit">
            <span className="text-base select-none">📱</span>
            <div className="flex flex-col leading-tight pr-1">
              <span className="font-semibold text-[#F6EBD8]">For a better experience, play in horizontal mode.</span>
            </div>
            <button
              onClick={() => {
                soundEngine.playClick();
                setDismissedPortraitNotice(true);
              }}
              className="w-5 h-5 rounded-full bg-[#7A2E2E] hover:bg-[#C98232] text-[#F6EBD8] flex items-center justify-center text-xs cursor-pointer border border-[#C6A15B] shrink-0"
              title="Dismiss notice"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* FAST ENTER / SKIP BUTTON DURING CINEMATIC INTRO */}
      {currentScene === 'CINEMATIC_INTRO' && (
        <div className="absolute top-3.5 right-3.5 z-30 pointer-events-auto">
          <button
            onClick={() => {
              soundEngine.playClick();
              cinematicIntroSceneRef.current?.triggerEnterWorld();
            }}
            className="bg-black/60 border border-amber-500/40 hover:border-amber-400 hover:bg-amber-500/20 text-amber-200 hover:text-white px-3.5 py-1.5 rounded-full font-cinzel text-xs font-bold tracking-wider transition-all cursor-pointer backdrop-blur-xs flex items-center gap-1.5 shadow-lg"
          >
            <span>ENTER VILLAGE</span>
            <span className="text-amber-400">▶</span>
          </button>
        </div>
      )}

      {/* TOP HUD BAR (Minimal, authentic game styling - completely hidden during CINEMATIC_INTRO & MAIN_MENU) */}
      {currentScene !== 'CINEMATIC_INTRO' && currentScene !== 'MAIN_MENU' && (
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none z-20 transition-opacity duration-700 animate-fadeIn">
          {/* Left: Chapter / Hub indicator */}
          <div className="flex items-center gap-2 pointer-events-auto">
            {currentScene === 'GANESHA_WORLD' && (
              <div className="bg-black/60 border border-amber-500/30 px-3 py-1.5 rounded-full flex items-center gap-2 backdrop-blur-xs">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span className="font-cinzel text-xs font-bold text-amber-200">
                  GANESHA WORLD
                </span>
                {nearLandmarkName && (
                  <span className="text-[11px] font-outfit text-amber-400 border-l border-amber-500/40 pl-2">
                    Near: {nearLandmarkName}
                  </span>
                )}
              </div>
            )}

            {currentScene !== 'MAIN_MENU' && currentScene !== 'GANESHA_WORLD' && (
              <button
                onClick={() => {
                  soundEngine.playClick();
                  handleReturnToWorld();
                }}
                className="bg-black/60 border border-amber-500/40 hover:bg-amber-500/20 text-amber-300 px-3 py-1.5 rounded-full font-cinzel text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-md"
              >
                <span>←</span>
                <span>HUB WORLD</span>
              </button>
            )}
          </div>

          {/* Right: Sound, Leaderboard, Chronicles, Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto">
            <button
              onClick={() => {
                soundEngine.playClick();
                setLeaderboardGameId(
                  currentScene === 'KUBERA_FEAST' ? 'kubera_feast' :
                  currentScene === 'GREAT_RACE' ? 'great_race' :
                  currentScene === 'MUSHIKA_RUN' ? 'mushaks_adventure' :
                  currentScene === 'SCRIBE_CHAPTER' ? 'unstoppable_scribe' :
                  currentScene === 'BAPPA_MATCH' ? 'the_gatekeeper' :
                  activeChapterId || 'kubera_feast'
                );
                setShowLeaderboard(true);
              }}
              title="Campus Leaderboard"
              className="h-9 px-2.5 sm:px-3 rounded-full bg-black/60 border border-amber-500/40 hover:bg-amber-500/20 text-amber-300 flex items-center justify-center gap-1.5 text-xs font-cinzel font-bold transition-colors cursor-pointer shadow-md"
            >
              <span>🏆</span>
              <span className="hidden sm:inline">LEADERBOARD</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playClick();
                setShowJournal(true);
              }}
              title="Stories & Achievements"
              className="w-9 h-9 rounded-full bg-black/60 border border-amber-500/40 hover:bg-amber-500/20 text-amber-300 flex items-center justify-center text-sm transition-colors cursor-pointer shadow-md"
            >
              📜
            </button>

            <button
              onClick={() => {
                soundEngine.playClick();
                setShowHelp(true);
              }}
              title="How to Play"
              className="w-9 h-9 rounded-full bg-black/60 border border-amber-500/40 hover:bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-sm transition-colors cursor-pointer shadow-md"
            >
              ?
            </button>

            <button
              onClick={toggleMute}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              className="w-9 h-9 rounded-full bg-black/60 border border-amber-500/40 hover:bg-amber-500/20 text-amber-300 flex items-center justify-center text-sm transition-colors cursor-pointer shadow-md"
            >
              {isMuted ? '🔇' : '🔔'}
            </button>
          </div>
        </div>
      )}

      {/* MAIN MENU OVERLAY UI (Buttons layered on top of animated Canvas) */}
      {currentScene === 'MAIN_MENU' && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-end pb-10 sm:pb-14 pointer-events-none">
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 pointer-events-auto">
            <button
              onClick={() => mainMenuSceneRef.current?.handlePlayClick()}
              className="px-8 sm:px-10 py-3.5 sm:py-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-cinzel font-black text-base sm:text-lg tracking-widest shadow-[0_0_35px_rgba(245,158,11,0.6)] transition-transform hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-3"
            >
              <span>ENTER THE WORLD</span>
              <span>▶</span>
            </button>

            <button
              onClick={() => {
                soundEngine.playClick();
                setShowLeaderboard(true);
              }}
              className="px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl bg-black/60 border border-amber-500/40 hover:bg-amber-500/20 text-[#E8C766] font-cinzel font-bold text-xs sm:text-sm tracking-wider transition-colors cursor-pointer flex items-center gap-2 backdrop-blur-xs shadow-md"
            >
              <span>🏆</span>
              <span>LEADERBOARD</span>
            </button>

            <button
              onClick={() => mainMenuSceneRef.current?.handleLoreClick()}
              className="px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl bg-black/50 border border-amber-500/40 hover:bg-amber-500/20 text-amber-200 font-cinzel font-bold text-xs sm:text-sm tracking-wider transition-colors cursor-pointer flex items-center gap-2 backdrop-blur-xs shadow-md"
            >
              <span>📜</span>
              <span>STORIES OF WISDOM</span>
            </button>
          </div>

          <p className="mt-3.5 text-xs font-outfit text-amber-400/80 tracking-wide pointer-events-none">
            Desktop: WASD / Mouse • Mobile: Touch to explore & play
          </p>
        </div>
      )}

      {/* EXCLUSIVE GAME ENTRY SYSTEM */}
      {/* Appears immediately when player reaches a specific mini-game location */}
      {currentScene === 'GANESHA_WORLD' && activeLandmark && (
        <div
          id={`entry-prompt-${activeLandmark.id}`}
          className="absolute z-35 pointer-events-auto transition-all duration-150 animate-in fade-in zoom-in-95 select-none"
          style={{
            left: `${Math.round(
              Math.max(
                110,
                Math.min(
                  window.innerWidth - 110,
                  window.innerWidth / 2 + (activeLandmark.x - (worldSceneRef.current?.cameraFocus.x || 640)) * (worldSceneRef.current?.cameraZoom || 1)
                )
              )
            )}px`,
            top: `${Math.round(
              Math.max(
                55,
                Math.min(
                  window.innerHeight - 80,
                  window.innerHeight / 2 + (activeLandmark.y - (worldSceneRef.current?.cameraFocus.y || 400)) * (worldSceneRef.current?.cameraZoom || 1) - 70 * (worldSceneRef.current?.cameraZoom || 1)
                )
              )
            )}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <button
            id={`enter-${activeLandmark.id}-btn`}
            onClick={() => {
              soundEngine.playClick();
              worldSceneRef.current?.interact();
            }}
            className="group relative px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-[#C98232] via-[#A85F3D] to-[#C98232] hover:from-[#A85F3D] hover:to-[#C98232] border-2 border-[#C6A15B] text-[#F6EBD8] font-cinzel font-bold text-xs sm:text-sm tracking-wide shadow-[0_4px_16px_rgba(36,74,58,0.55)] transition-all transform hover:scale-102 active:scale-98 cursor-pointer flex items-center gap-2 whitespace-nowrap"
          >
            <span className="text-base sm:text-lg filter drop-shadow-xs">{activeLandmark.icon}</span>
            <span className="font-extrabold uppercase text-[#F6EBD8]">ENTER {activeLandmark.bannerText || activeLandmark.name}</span>
            <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded bg-[#3E3028]/80 text-[#E8C766] font-mono font-bold border border-[#C6A15B]/40">[E]</span>
            <span className="text-[#E8C766] font-bold text-xs leading-none">▶</span>
          </button>
        </div>
      )}

      {/* GANESHA WORLD MOBILE CONTROLS (Only visible when world is playable) */}
      {currentScene === 'GANESHA_WORLD' && isWorldPlayable && (
        <div className="absolute inset-x-0 bottom-6 px-6 flex items-end justify-between pointer-events-none z-20">
          {/* Virtual Joystick for Mobile Movement */}
          <div className="pointer-events-auto">
            <VirtualJoystick
              onMove={(dx, dy) => {
                joystickDir.current = { dx, dy };
              }}
              onStop={() => {
                joystickDir.current = { dx: 0, dy: 0 };
              }}
            />
          </div>
        </div>
      )}

      {/* Subtle Desktop Navigation Pill (only on non-touch desktop screens in GANESHA_WORLD) */}
      {currentScene === 'GANESHA_WORLD' && isWorldPlayable && (
        <div className="hidden sm:flex absolute bottom-3.5 inset-x-0 justify-center pointer-events-none z-10 animate-fadeIn">
          <div className="bg-black/65 border border-amber-500/25 px-4 py-1.5 rounded-full text-[11px] font-outfit text-amber-200/90 backdrop-blur-xs flex items-center gap-3 shadow-md">
            <span>⌨️ WASD / Arrow Keys or Click ground to walk</span>
            <span className="text-amber-500/40">•</span>
            <span>Walk near a shrine and press <strong className="text-amber-300 font-mono font-bold">[E]</strong> to enter story</span>
          </div>
        </div>
      )}

      {/* SCRIBE CHAPTER (GANESHA & MAHABHARATA) TYPING ASSIST & KEYBOARD TRIGGER FOR MOBILE */}
      {currentScene === 'SCRIBE_CHAPTER' && (
        <div className="absolute bottom-3 inset-x-0 flex flex-col items-center pointer-events-auto z-30 px-3">
          {/* Hidden input element used to capture mobile native on-screen virtual keyboard */}
          <input
            ref={mobileTypingInputRef}
            type="text"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            className="sr-only"
            value=""
            onChange={(e) => {
              const val = e.target.value;
              if (val) {
                for (const char of val) {
                  scribeSceneRef.current?.handleInput(char);
                }
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Backspace') {
                scribeSceneRef.current?.handleInput('Backspace');
              }
            }}
          />

          {/* Quick controls row for touch devices */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                mobileTypingInputRef.current?.focus();
              }}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-cinzel font-bold text-xs tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.5)] cursor-pointer sm:hidden flex items-center gap-1.5"
            >
              <span>⌨️</span>
              <span>TAP TO TYPE / OPEN KEYBOARD</span>
            </button>

            <button
              onClick={() => {
                scribeSceneRef.current?.handleInput('Backspace');
              }}
              className="px-3 py-2 rounded-full bg-black/70 border border-amber-500/40 text-amber-200 font-outfit text-xs font-semibold hover:bg-amber-500/20 cursor-pointer sm:hidden"
            >
              ⌫ Backspace
            </button>
          </div>
        </div>
      )}

      {/* STORY INTRO MODAL */}
      {currentScene === 'STORY_INTRO' && (
        <StoryIntroOverlay
          chapterId={activeChapterId}
          onStartChapter={startActiveChapter}
          onClose={handleReturnToWorld}
        />
      )}

      {/* CHAPTER RESULT / FEAST OVER MODAL */}
      {currentScene === 'CHAPTER_RESULT' && lastResult && (
        <ResultOverlay
          result={lastResult}
          onPlayAgain={startActiveChapter}
          onReturnToWorld={handleReturnToWorld}
          onOpenLeaderboard={() => {
            setLeaderboardGameId(lastResult.chapterId);
            setShowLeaderboard(true);
          }}
        />
      )}

      {/* STORY JOURNAL / ACHIEVEMENTS MODAL */}
      {showJournal && (
        <StoryJournalModal
          onClose={() => setShowJournal(false)}
          onSelectChapter={(id: ChapterId) => {
            setShowJournal(false);
            setActiveChapterId(id);
            setCurrentScene('STORY_INTRO');
          }}
        />
      )}

      {/* CAMPUS LEADERBOARD MODAL */}
      {showLeaderboard && (
        <LeaderboardModal
          playerProfile={playerProfile}
          initialGameId={leaderboardGameId}
          onClose={() => setShowLeaderboard(false)}
        />
      )}

      {/* FIRST-LAUNCH PLAYER REGISTRATION MODAL */}
      {!playerProfile && (
        <PlayerRegistrationModal
          onComplete={(profile) => {
            setPlayerProfile(profile);
            playerProfileRef.current = profile;
          }}
        />
      )}

      {/* HOW TO PLAY & CONTEST HELP MODAL */}
      {showHelp && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-gradient-to-b from-[#281308] via-[#1a0a04] to-[#120502] border-2 border-amber-500 rounded-2xl p-6 shadow-[0_0_50px_rgba(245,158,11,0.3)]">
            <div className="flex items-center justify-between border-b border-amber-500/30 pb-3">
              <h3 className="text-xl font-cinzel font-bold text-amber-200">
                GANESHA: STORIES OF WISDOM
              </h3>
              <button
                onClick={() => setShowHelp(false)}
                className="w-8 h-8 rounded-full border border-amber-500/40 text-amber-300 hover:bg-amber-500/20 text-sm flex items-center justify-center cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="my-4 space-y-3 text-xs sm:text-sm text-amber-100/90 font-outfit leading-relaxed">
              <div className="p-3 bg-amber-950/40 rounded-xl border border-amber-500/20">
                <span className="font-bold text-amber-400 block mb-1">🎮 How to Play</span>
                <p>
                  Explore the 2D festival hub world. Walk toward interactive story pavilions (Kubera’s Feast, Bappa’s Journey, Mushika Run, Bappa’s Book, Bappa Match) and press <kbd className="px-1.5 py-0.5 bg-amber-900/60 rounded text-amber-300">[E]</kbd> or tap to enter!
                </p>
              </div>

              <div className="p-3 bg-black/40 rounded-xl border border-amber-500/20">
                <span className="font-bold text-amber-400 block mb-1">🥟 Kubera’s Feast</span>
                <p>
                  Catch the right food and avoid distractions. Collect Modaks and sweet offerings for points and combo multipliers! Avoid non-food items which cost 1 of your 5 chances.
                </p>
              </div>

              <div className="p-3 bg-black/40 rounded-xl border border-amber-500/20">
                <span className="font-bold text-amber-400 block mb-1">🕹️ Controls</span>
                <p>
                  <strong>Desktop:</strong> WASD / Arrow keys or mouse click-to-move. Press [E] to enter locations. Move mouse/touch or Arrow keys to catch falling food.
                  <br />
                  <strong>Mobile:</strong> Virtual joystick on bottom left, tap anywhere to walk, tap falling items directly to collect.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowHelp(false)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-cinzel font-bold text-sm tracking-wide cursor-pointer shadow-md"
            >
              GOT IT, RETURN TO GAME
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
