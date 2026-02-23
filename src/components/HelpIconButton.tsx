interface HelpIconButtonProps {
  onClick: () => void;
  size?: 'small' | 'medium' | 'large';
  dataTestId?: string;
}

export function HelpIconButton({
  onClick,
  size = 'medium',
  dataTestId,
}: HelpIconButtonProps) {
  const sizeStyles = {
    small: {
      width: '16px',
      height: '16px',
      fontSize: '12px',
      padding: '0',
    },
    medium: {
      width: '20px',
      height: '20px',
      fontSize: '14px',
      padding: '0',
    },
    large: {
      width: '24px',
      height: '24px',
      fontSize: '16px',
      padding: '0',
    },
  };

  const style = sizeStyles[size];

  return (
    <button
      onClick={onClick}
      data-testid={dataTestId}
      style={{
        ...style,
        minWidth: style.width,
        minHeight: style.height,
        maxWidth: style.width,
        maxHeight: style.height,
        borderRadius: '50%',
        backgroundColor: '#0f3460',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: '0.5rem',
        transition: 'all 0.2s',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#1a4a7c';
        e.currentTarget.style.transform = 'scale(1.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#0f3460';
        e.currentTarget.style.transform = 'scale(1)';
      }}
      title="Get help"
    >
      ?
    </button>
  );
}

export default HelpIconButton;
