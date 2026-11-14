/**
 * Frame-side audio reporter for pinned-site embeds.
 *
 * Runs in every subframe (all_frames: true, document_start). A panel frame
 * that belongs to a pinned origin tells its parent (the sidebar's content
 * script) whenever it starts or stops producing sound, so the icon strip can
 * badge pins that are playing audio while hidden.
 *
 * The report goes to the parent via postMessage rather than through the
 * background worker: the sidebar matches `event.source` against each pin's
 * iframe `contentWindow`, which identifies the exact pin even when two pins
 * share an origin.
 *
 * Detection covers <audio>/<video> elements in the document. Sound produced
 * through the Web Audio API, by detached `new Audio()` elements, or by media
 * elements inside shadow roots (their media events are not composed) is not
 * seen.
 */
import { FRAME_AUDIO_MESSAGE_TYPE, type FrameAudioMessage } from '../lib/types';

/** Media events that can change whether an element is audible. */
const MEDIA_EVENTS = ['play', 'playing', 'pause', 'ended', 'volumechange', 'emptied'] as const;

/**
 * Delay before reporting "stopped". Players pause and resume between tracks
 * or while seeking; reporting each gap would make the badge flicker.
 */
const SILENCE_REPORT_DELAY_MS = 1500;

/**
 * While something is audible, re-check this often. A playing element that is
 * removed from the DOM pauses, but its pause event no longer propagates to
 * this window, so the removal is only noticed by polling.
 */
const AUDIBLE_RECHECK_MS = 2000;

function isAudible(element: HTMLMediaElement): boolean {
  return element.isConnected && !element.paused && !element.ended && !element.muted && element.volume > 0;
}

// Only direct children of the top window can be panel frames; nested frames
// (e.g. a video embed inside a pinned site) are not matched by the sidebar.
if (window.top !== window.self && window.parent === window.top) {
  const playing = new Set<HTMLMediaElement>();
  let reportingEnabled = false;
  let lastReported = false;
  let silenceTimer: ReturnType<typeof setTimeout> | null = null;
  let recheckTimer: ReturnType<typeof setInterval> | null = null;

  const post = (audible: boolean) => {
    if (!reportingEnabled || audible === lastReported) {
      return;
    }
    lastReported = audible;
    const message: FrameAudioMessage = { type: FRAME_AUDIO_MESSAGE_TYPE, audible };
    window.parent.postMessage(message, '*');
  };

  const evaluate = () => {
    for (const element of playing) {
      if (!isAudible(element)) {
        playing.delete(element);
      }
    }
    const audible = playing.size > 0;

    if (audible) {
      if (silenceTimer !== null) {
        clearTimeout(silenceTimer);
        silenceTimer = null;
      }
      recheckTimer ??= setInterval(evaluate, AUDIBLE_RECHECK_MS);
      post(true);
      return;
    }

    if (recheckTimer !== null) {
      clearInterval(recheckTimer);
      recheckTimer = null;
    }
    silenceTimer ??= setTimeout(() => {
      silenceTimer = null;
      if (playing.size === 0) {
        post(false);
      }
    }, SILENCE_REPORT_DELAY_MS);
  };

  const onMediaEvent = (event: Event) => {
    if (event.target instanceof HTMLMediaElement && isAudible(event.target)) {
      playing.add(event.target);
    }
    evaluate();
  };

  // Media events do not bubble; a capture listener on the window still sees
  // them for every element connected to this document. Registered before the
  // gate resolves so playback that starts during the round trip is tracked.
  for (const type of MEDIA_EVENTS) {
    window.addEventListener(type, onMediaEvent, true);
  }

  const stopTracking = () => {
    for (const type of MEDIA_EVENTS) {
      window.removeEventListener(type, onMediaEvent, true);
    }
    if (recheckTimer !== null) {
      clearInterval(recheckTimer);
      recheckTimer = null;
    }
  };

  chrome.runtime
    .sendMessage({ action: 'shouldReportAudio' })
    .then((response: { ok?: boolean } | undefined) => {
      if (!response?.ok) {
        stopTracking();
        return;
      }
      reportingEnabled = true;
      if (playing.size > 0) {
        post(true);
      }
    })
    .catch(() => {
      // Extension context invalidated (frame outlived an update) — no reports.
      stopTracking();
    });
}
