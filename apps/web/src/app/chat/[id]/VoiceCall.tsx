/**
 * Voice Call Component
 * Handles ElevenLabs Conversational AI voice calls
 */

'use client';

import { useEffect, useRef, useState } from 'react';

interface VoiceCallProps {
  signedUrl: string;
  onTranscript: (transcript: Array<{ role: 'user' | 'assistant'; content: string }>) => void;
  onEnd: () => void;
}

interface ElevenLabsEvent {
  type: string;
  [key: string]: any;
}

export default function VoiceCall({ signedUrl, onTranscript, onEnd }: VoiceCallProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [callDuration, setCallDuration] = useState(0);
  const [audioContextState, setAudioContextState] = useState<string>('');
  
  const websocketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<AudioBuffer[]>([]);
  const isPlayingRef = useRef(false);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const callStartTimeRef = useRef<number>(0);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isInitializedRef = useRef(false); // Prevent double initialization

  useEffect(() => {
    // Prevent double initialization (React Strict Mode in dev)
    if (isInitializedRef.current) {
      console.log('Already initialized, skipping');
      return;
    }
    isInitializedRef.current = true;
    
    startCall();
    
    return () => {
      cleanup();
    };
  }, []);

  const startCall = async () => {
    try {
      // Check if already connected
      if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
        console.log('WebSocket already connected, skipping');
        return;
      }

      console.log('Starting call with signed URL:', signedUrl);
      
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
        } 
      });
      console.log('✅ Microphone access granted');
      
      // Initialize audio context for playback - use 16kHz to match ElevenLabs output
      audioContextRef.current = new AudioContext({ sampleRate: 16000 });
      console.log('Audio context created, state:', audioContextRef.current.state);
      setAudioContextState(audioContextRef.current.state);
      
      // Try to resume immediately (may be blocked by browser)
      if (audioContextRef.current.state === 'suspended') {
        try {
          await audioContextRef.current.resume();
          console.log('Audio context resumed immediately');
          setAudioContextState(audioContextRef.current.state);
        } catch (e) {
          console.log('Audio context resume blocked, will retry on first audio');
        }
      }
      
      // Connect to ElevenLabs WebSocket
      const ws = new WebSocket(signedUrl);
      websocketRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
        callStartTimeRef.current = Date.now();
        
        // Start duration timer
        durationIntervalRef.current = setInterval(() => {
          const elapsed = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
          setCallDuration(elapsed);
        }, 1000);

        // Send initial connection message
        ws.send(JSON.stringify({
          type: 'conversation_initiation_client_data',
          conversation_config_override: {
            agent: {
              language: 'en',
            },
            tts: {
              voice_id: audioContextRef.current ? 'EXAVITQu4vr4xnSDxMaL' : undefined,
            },
          },
        }));
        console.log('Sent initiation message');

        // Start recording and sending audio
        startAudioCapture(stream, ws);
      };

      ws.onmessage = async (event) => {
        try {
          const data: ElevenLabsEvent = JSON.parse(event.data);
          console.log('Received message:', data.type);
          handleWebSocketMessage(data, ws);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };

      ws.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        setIsConnected(false);
        cleanup();
      };
    } catch (error) {
      console.error('❌ Failed to start call:', error);
      alert('Failed to access microphone. Please check permissions.');
      onEnd();
    }
  };

  const startAudioCapture = (stream: MediaStream, ws: WebSocket) => {
    console.log('Setting up audio capture with PCM encoding');
    
    // Use Web Audio API to capture and convert to PCM
    const audioContext = new AudioContext({ sampleRate: 16000 });
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    
    source.connect(processor);
    processor.connect(audioContext.destination);
    
    processor.onaudioprocess = (e) => {
      if (ws.readyState !== WebSocket.OPEN) return;
      
      // Get audio data as Float32Array
      const inputData = e.inputBuffer.getChannelData(0);
      
      // Convert to 16-bit PCM
      const pcmData = new Int16Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        // Clamp to [-1, 1] and convert to 16-bit integer
        const s = Math.max(-1, Math.min(1, inputData[i]));
        pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      
      // Convert to base64
      const uint8Array = new Uint8Array(pcmData.buffer);
      const base64 = btoa(String.fromCharCode.apply(null, Array.from(uint8Array)));
      
      // Send to ElevenLabs
      ws.send(JSON.stringify({
        user_audio_chunk: base64,
      }));
    };
    
    // Store for cleanup
    mediaRecorderRef.current = { processor, audioContext, source } as any;
    
    console.log('🎤 Started recording audio with PCM encoding');
  };

  const handleWebSocketMessage = async (data: ElevenLabsEvent, ws: WebSocket) => {
    switch (data.type) {
      case 'ping':
        // Respond to ping to keep connection alive
        setTimeout(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
              type: 'pong',
              event_id: data.ping_event?.event_id,
            }));
          }
        }, data.ping_event?.ping_ms || 0);
        break;

      case 'user_transcript':
        // User's speech was transcribed
        const userText = data.user_transcription_event?.user_transcript;
        if (userText) {
          console.log('👤 User said:', userText);
          setTranscript((prev) => [...prev, { role: 'user', content: userText }]);
        }
        break;

      case 'agent_response':
        // Agent's text response
        const agentText = data.agent_response_event?.agent_response;
        if (agentText) {
          console.log('🤖 Agent said:', agentText);
          setTranscript((prev) => [...prev, { role: 'assistant', content: agentText }]);
        }
        break;

      case 'audio':
        // Agent's voice audio
        const audioData = data.audio_event?.audio_base_64;
        if (audioData) {
          console.log('🔊 Received audio chunk');
          await playAudio(audioData);
        }
        break;

      case 'interruption':
        // User interrupted the agent
        console.log('User interrupted');
        stopAudioPlayback();
        break;

      case 'conversation_initiation_metadata':
        // Ignore this event
        break;

      default:
        console.log('Unknown event type:', data.type);
    }
  };

  const playAudio = async (base64Audio: string) => {
    try {
      // Decode base64 to array buffer
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      console.log('Received audio chunk, size:', bytes.length);

      // ElevenLabs sends PCM audio at 16kHz, 16-bit, mono
      if (!audioContextRef.current) {
        console.error('No audio context');
        return;
      }

      // Resume audio context if needed
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }

      // Convert PCM bytes to Float32Array for Web Audio API
      const pcmData = new Int16Array(bytes.buffer);
      const floatData = new Float32Array(pcmData.length);
      
      // Convert 16-bit PCM to float (-1.0 to 1.0)
      for (let i = 0; i < pcmData.length; i++) {
        floatData[i] = pcmData[i] / 32768.0;
      }

      // Create audio buffer with correct sample rate (16kHz)
      const audioBuffer = audioContextRef.current.createBuffer(
        1, // mono
        floatData.length,
        16000 // 16kHz sample rate - matches ElevenLabs output
      );
      
      // Copy data to buffer
      audioBuffer.getChannelData(0).set(floatData);

      // Add to queue instead of playing immediately
      audioQueueRef.current.push(audioBuffer);
      console.log('Added audio to queue, queue length:', audioQueueRef.current.length);

      // Start playing if not already playing
      if (!isPlayingRef.current) {
        playNextInQueue();
      }
      
    } catch (error) {
      console.error('❌ Error playing audio:', error);
      setIsSpeaking(false);
    }
  };

  const playNextInQueue = () => {
    if (audioQueueRef.current.length === 0 || !audioContextRef.current) {
      isPlayingRef.current = false;
      setIsSpeaking(false);
      console.log('Queue empty, stopping playback');
      return;
    }

    isPlayingRef.current = true;
    setIsSpeaking(true);

    const audioBuffer = audioQueueRef.current.shift()!;
    
    // Stop any currently playing source
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch (e) {
        // Ignore if already stopped
      }
    }

    // Create and play new source
    const source = audioContextRef.current.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(audioContextRef.current.destination);
    currentSourceRef.current = source;
    
    source.onended = () => {
      console.log('✅ Audio chunk ended, playing next');
      currentSourceRef.current = null;
      playNextInQueue();
    };
    
    console.log('▶️ Playing audio chunk, duration:', audioBuffer.duration.toFixed(2), 'seconds');
    source.start(0);
  };

  const stopAudioPlayback = () => {
    // Stop current source
    if (currentSourceRef.current) {
      try {
        currentSourceRef.current.stop();
      } catch (e) {
        // Ignore if already stopped
      }
      currentSourceRef.current = null;
    }
    // Clear queue
    audioQueueRef.current = [];
    isPlayingRef.current = false;
    setIsSpeaking(false);
  };

  const endCall = () => {
    // Send transcript to parent
    onTranscript(transcript);
    cleanup();
    onEnd();
  };

  const cleanup = () => {
    // Stop duration timer
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }

    // Stop any playing audio
    stopAudioPlayback();

    // Stop audio processor
    if (mediaRecorderRef.current) {
      const { processor, audioContext, source } = mediaRecorderRef.current as any;
      if (processor) {
        processor.disconnect();
        source.disconnect();
      }
      if (audioContext && audioContext.state !== 'closed') {
        audioContext.close().catch(console.error);
      }
    }

    // Close WebSocket
    if (websocketRef.current && websocketRef.current.readyState === WebSocket.OPEN) {
      websocketRef.current.close();
    }

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(console.error);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleScreenClick = async () => {
    // Resume audio context on user interaction (browser autoplay policy)
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      try {
        await audioContextRef.current.resume();
        console.log('✅ Audio context resumed via click');
        setAudioContextState(audioContextRef.current.state);
      } catch (error) {
        console.error('Failed to resume audio context:', error);
      }
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-gray-900 z-50 flex flex-col items-center justify-center"
      onClick={handleScreenClick}
    >
      {/* Call UI */}
      <div className="text-center">
        {/* Avatar */}
        <div className="mb-8">
          <div className={`w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center ${isSpeaking ? 'animate-pulse' : ''}`}>
            <svg className="w-16 h-16 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Status */}
        <h2 className="text-2xl font-semibold text-white mb-2">
          {isConnected ? 'Voice Call Active' : 'Connecting...'}
        </h2>
        <p className="text-gray-400 mb-2">
          {isSpeaking ? 'AI is speaking...' : 'Listening...'}
        </p>
        
        {/* Audio Context Debug Info */}
        {audioContextState === 'suspended' && (
          <div className="bg-yellow-600 text-white px-4 py-2 rounded-lg mb-4 text-sm">
            Audio is paused. Click anywhere to enable sound.
          </div>
        )}
        
        {/* Duration */}
        <p className="text-3xl font-mono text-white mb-8">
          {formatDuration(callDuration)}
        </p>

        {/* Live Transcript */}
        {transcript.length > 0 && (
          <div className="max-w-md mx-auto mb-8 max-h-40 overflow-y-auto bg-gray-800 rounded-lg p-4">
            {transcript.slice(-3).map((entry, index) => (
              <p key={index} className={`text-sm mb-2 ${entry.role === 'user' ? 'text-blue-300' : 'text-green-300'}`}>
                <span className="font-semibold">{entry.role === 'user' ? 'You' : 'AI'}:</span> {entry.content}
              </p>
            ))}
          </div>
        )}

        {/* End Call Button */}
        <button
          onClick={endCall}
          className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full font-semibold transition-colors flex items-center gap-2 mx-auto"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
          </svg>
          End Call
        </button>
      </div>
    </div>
  );
}
