// InitialAvatar.tsx
import React from 'react';

interface InitialAvatarProps {
  name: string;
  size: number;
}

const InitialAvatar: React.FC<InitialAvatarProps> = ({ name, size = 80 }) => {
  const initial = name?.charAt(0).toUpperCase() || '?';

  const styles: React.CSSProperties = {
    backgroundColor: '#007bff', // Bootstrap blue
    color: '#fff',
    width: size,
    height: size,
    borderRadius: '50%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: size * 0.5,
    fontWeight: 'bold',
    userSelect: 'none',
  };

  return <div style={styles}>{initial}</div>;
};

export default InitialAvatar;
