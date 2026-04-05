import { getInitials } from '@/lib/utils'
import type { Player } from '@/types'

interface PlayerAvatarProps {
  player: Pick<Player, 'name' | 'avatarColor' | 'photoUrl'>
  size?: number
}

function PlayerAvatar({ player, size = 40 }: PlayerAvatarProps) {
  const initials = getInitials(player.name)

  if (player.photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={player.photoUrl}
        alt={player.name}
        width={size}
        height={size}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }}
      />
    )
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: player.avatarColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          color: '#ffffff',
          fontWeight: 600,
          fontSize: size <= 32 ? 11 : size <= 48 ? 14 : 16,
          letterSpacing: '0.02em',
          lineHeight: 1,
        }}
      >
        {initials}
      </span>
    </div>
  )
}

export { PlayerAvatar }
