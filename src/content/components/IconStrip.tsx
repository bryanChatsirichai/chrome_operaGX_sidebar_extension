import type { Pin } from '../../lib/types';
import { resolveIconUrl } from '../../lib/pin-utils';

interface IconStripProps {
  pins: Pin[];
  activePinId: string | null;
  settingsOpen: boolean;
  onPinClick: (pin: Pin) => void;
  onToggleSettings: () => void;
}

export function IconStrip({
  pins,
  activePinId,
  settingsOpen,
  onPinClick,
  onToggleSettings
}: IconStripProps) {
  return (
    <aside className="icon-strip" part="icon-strip">
      {pins.map((pin) => (
        <button
          key={pin.id}
          className={`pin-button${activePinId === pin.id ? ' active' : ''}`}
          type="button"
          title={pin.name}
          data-pin-id={pin.id}
          onClick={() => onPinClick(pin)}
        >
          {pin.iconUrl ? (
            <img src={resolveIconUrl(pin.iconUrl)} alt={pin.name} />
          ) : (
            <span className="pin-fallback">{pin.name.charAt(0).toUpperCase()}</span>
          )}
        </button>
      ))}

      <div className="strip-spacer" />

      <div className="strip-footer">
        <button
          className={`settings-button${settingsOpen ? ' active' : ''}`}
          type="button"
          title="Settings"
          onClick={onToggleSettings}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        </button>
      </div>
    </aside>
  );
}
